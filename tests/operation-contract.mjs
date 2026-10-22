import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
const require = createRequire(import.meta.url), dirs = await readdir('node_modules/.pnpm');
const esbuild = require(path.resolve('node_modules/.pnpm', dirs.find(n => n.startsWith('esbuild@')), 'node_modules/esbuild/lib/main.js'));
await esbuild.build({ entryPoints: ['lib/workflow.ts'], bundle: true, platform: 'node', format: 'esm', outfile: 'work/operation-test.mjs' });
const { applyOperation } = await import('../work/operation-test.mjs');
const { emptyState, readState } = await import('../lib/model.ts');
const { weekEstimate, carryBalances, batchEstimate, snackEstimate } = await import('../lib/operation-domain.ts');
const { days, unknownCounts } = await import('../lib/operation-model.ts');
let s, now, role = 'admin', count = 0;
const ctx = () => ({ userId: 'qa-v2', name: 'Conferência QA', role, now: new Date(now) });
const run = op => { s = applyOperation(s, op, ctx()).state; return s.rounds.at(-1); };
const reject = (op, re) => assert.throws(() => applyOperation(s, op, ctx()), re);
const check = (name, fn) => { fn(); console.log('PASS:', name); count++; };
function setup() {
  s = emptyState(); now = '2026-10-14T10:00:00-03:00'; role = 'admin';
  s.flavors.forEach(f => { f.active = ['sabor-3', 'sabor-14'].includes(f.id); f.prices = { sexta: 1000, sabado: 1200, domingo: 1500 }; });
  s.settings.productionTemplate = s.flavors.filter(f => f.active).map(f => ({ flavorId: f.id, quantity: f.prepKind === 'base' ? 110 : 6, allocations: f.prepKind === 'base' ? { sexta: 30, sabado: 30, domingo: 40 } : { sexta: 2, sabado: 2, domingo: 2 } }));
  return run({ kind: 'round', start: '2026-10-14', methodology: 'weekly-allocation-v2' });
}
function prepare(r = s.rounds.at(-1), overrides = {}) {
  return run({ kind: 'week-prepare', roundId: r.id, day: r.productionDay, contributors: ['Robson', 'Erly'], flourKg: 50, lines: [{ flavorId: 'sabor-3', quantity: 110, allocations: { sexta: 30, sabado: 30, domingo: 40 } }], carry: [], extras: [{ flavorId: 'sabor-14', allocations: { sexta: 2, sabado: 2, domingo: 2 } }], ...overrides });
}
function close(r = s.rounds.at(-1), overrides = {}) {
  now = '2026-10-19T10:00:00-03:00';
  return run({ kind: 'week-close', roundId: r.id, day: '2026-10-19', margin: 2, notes: '', lines: [{ flavorId: 'sabor-3', returned: 10, nonSale: unknownCounts() }], extras: [{ flavorId: 'sabor-14', values: Object.fromEntries(days.map(d => [d, { mode: 'pending', quantity: null }])) }], ...overrides });
}
const cancel = (r, key) => run({ kind: 'week-fair', roundId: r.id, key, cancelled: true, note: 'Chuva' });
check('Legado permanece legível e não recebe novo método automaticamente', () => { const old = emptyState(); delete old.doughBatches; assert.deepEqual(readState(old).doughBatches, []); });
check('Produção, reserva e três preços: conservação de unidades', () => {
  setup(); const r = close(prepare()), e = weekEstimate(r), l = e.lines[0];
  assert.equal(l.reserve, 10); assert.equal(l.taken, 100); assert.equal(l.sold, 84); assert.equal(l.finalStock, 20); assert.equal(e.value, 103600); assert.equal(e.partial, true);
  assert.equal(l.made + l.reused, l.sold + l.perFair.reduce((n, f) => n + f.nonSale, 0) + l.finalStock);
  assert.equal(r.operation.flourKg, 50); assert.deepEqual(r.contributors, ['Robson', 'Erly']);
});
check('Tudo vendido confirma zero; margem não excede disponibilidade', () => {
  setup(); prepare(); const e = weekEstimate(close(undefined, { margin: 100, lines: [{ flavorId: 'sabor-3', returned: 0, nonSale: unknownCounts() }] }));
  assert.equal(e.lines[0].sold, 0); assert.equal(e.lines[0].finalStock, 10);
});
check('Margem pendente não vira zero; ajuste explícito substitui margem', () => {
  setup(); prepare(); let e = weekEstimate(close(undefined, { margin: null })); assert.equal(e.output, null); assert.equal(e.partial, true);
  setup(); prepare(); e = weekEstimate(close(undefined, { lines: [{ flavorId: 'sabor-3', returned: 10, nonSale: { sexta: 0, sabado: 3, domingo: null } }] }));
  assert.deepEqual(e.lines[0].perFair.map(f => f.nonSale), [0, 3, 2]); assert.equal(e.lines[0].sold, 85);
});
check('Extras opcionais, contados e aproximados não sofrem margem', () => {
  setup(); prepare(); const e = weekEstimate(close(undefined, { extras: [{ flavorId: 'sabor-14', values: { sexta: { mode: 'estimate', quantity: 2 }, sabado: { mode: 'count', quantity: 1 }, domingo: { mode: 'pending', quantity: null } } }] }));
  assert.deepEqual(e.extras.map(x => x.quantity), [2, 1, null]); assert.equal(e.value, 106800); assert.equal(e.extrasPending, 1);
});
check('Preço ausente preserva unidades e subtotal parcial', () => {
  setup(); s.flavors.find(f => f.id === 'sabor-3').prices = { sexta: 1000, sabado: 0, domingo: 1500 }; prepare(); const e = weekEstimate(close());
  assert.equal(e.lines[0].sold, 84); assert.equal(e.lines[0].perFair[1].value, null); assert.equal(e.value, 70000);
});
check('Sexta cancelada transfere uma vez e usa preço de sábado', () => {
  let r = setup(); prepare(); cancel(r, 'sexta'); cancel(r, 'sexta'); const e = weekEstimate(close());
  assert.deepEqual(e.lines[0].perFair.map(f => f.available), [0, 60, 40]); assert.equal(e.value, 111600); assert.equal(e.lines[0].perFair[0].nonSale, 0);
});
check('Domingo cancelado guarda sua carga para próxima semana', () => {
  let r = setup(); prepare(); cancel(r, 'domingo'); const e = weekEstimate(close()); assert.equal(e.lines[0].held, 40); assert.equal(e.lines[0].finalStock, 60); assert.equal(e.lines[0].taken, 60);
});
check('Cancelamentos sucessivos e todas canceladas conservam o estoque', () => {
  let r = setup(); prepare(); cancel(r, 'sexta'); cancel(r, 'sabado'); let e = weekEstimate(close()); assert.deepEqual(e.lines[0].perFair.map(f => f.available), [0, 0, 100]); assert.equal(e.value, 132000);
  r = setup(); prepare(); days.forEach(d => cancel(r, d)); e = weekEstimate(close(undefined, { lines: [{ flavorId: 'sabor-3', returned: 0, nonSale: unknownCounts() }] })); assert.equal(e.lines[0].finalStock, 110); assert.equal(e.value, 0); assert.equal(e.partial, false);
});
check('Sobra maior que domingo permanece visível com distribuição incompleta', () => {
  setup(); prepare(); const e = weekEstimate(close(undefined, { lines: [{ flavorId: 'sabor-3', returned: 60, nonSale: unknownCounts() }] }));
  assert.equal(e.lines[0].allocationIncomplete, true); assert.equal(e.lines[0].finalStock, 70); assert.equal(e.lines[0].sold, null); assert.equal(e.partial, true);
});
check('Fechamento antecipado só após última feira ativa', () => {
  const r = setup(); prepare(); cancel(r, 'domingo'); now = '2026-10-17T18:00:00-03:00';
  const op = { kind: 'week-close', roundId: r.id, day: '2026-10-17', margin: 0, notes: '', lines: [{ flavorId: 'sabor-3', returned: 0, nonSale: unknownCounts() }], extras: [{ flavorId: 'sabor-14', values: Object.fromEntries(days.map(d => [d, { mode: 'pending', quantity: null }])) }] };
  run(op); assert.equal(s.rounds[0].status, 'concluida');
});
check('Sobra pronta reduz produção; descarte e desmontagem não duplicam unidades', () => {
  setup(); const previous = close(prepare()); now = '2026-10-21T11:00:00-03:00'; let next = run({ kind: 'round', start: '2026-10-21', methodology: 'weekly-allocation-v2' });
  assert.equal(carryBalances(s, next).lines[0].quantity, 20);
  next = prepare(next, { lines: [{ flavorId: 'sabor-3', quantity: 95, allocations: { sexta: 30, sabado: 30, domingo: 40 } }], carry: [{ flavorId: 'sabor-3', ready: 15, discarded: 3, dismantled: 2 }] });
  assert.equal(weekEstimate(next).lines[0].reserve, 10); assert.equal(next.production[0].produced, 95);
  run({ kind: 'week-reopen', roundId: previous.id, reason: 'Contagem revisada' }); assert.equal(s.rounds[1].productionClosed, false); assert.equal(s.rounds[1].operation.closing, null);
  assert.equal(weekEstimate(s.rounds[1]).produced, 0);
  assert.throws(() => prepare(s.rounds[1], { reason: 'Revisão do saldo' }), /semana anterior/);
});
check('Padrão e preço futuros não reescrevem semana confirmada', () => {
  setup(); const r = prepare(); const before = structuredClone(r.operation.flavors);
  const flavors = structuredClone(s.flavors); flavors.forEach(f => f.prices = { sexta: 2200, sabado: 2500, domingo: 3000 }); run({ kind: 'catalog', flavors });
  assert.deepEqual(s.rounds[0].operation.flavors, before);
  role = 'operador'; reject({ kind: 'week-prices', roundId: r.id, lines: before.map(f => ({ flavorId: f.id, prices: f.prices })), reason: 'Preço novo' }, /administrador/);
});
check('Lote de massinha atravessa semanas e não inventa data de venda', () => {
  setup(); run({ kind: 'dough-batch', day: '2026-10-01', quantity: 40, unitPrice: 1000 }); const b = s.doughBatches[0];
  run({ kind: 'dough-batch', day: '2026-10-14', quantity: 30, unitPrice: 1100 }); assert.equal(s.doughBatches[0].observation, null);
  run({ kind: 'dough-observe', id: b.id, observation: { remaining: 0, nonSale: null, confirmedOn: '2026-10-14', endedOn: null } });
  let e = batchEstimate(s.doughBatches[0]); assert.equal(e.sold, null); assert.equal(e.elapsed, 13); assert.equal(e.exact, false);
  run({ kind: 'dough-observe', id: b.id, observation: { remaining: 0, nonSale: 3, confirmedOn: '2026-10-14', endedOn: '2026-10-12' }, reason: 'Conferimos a perda' });
  e = batchEstimate(s.doughBatches[0]); assert.equal(e.sold, 37); assert.equal(e.value, 37000); assert.equal(e.elapsed, 11); assert.equal(e.exact, true);
});
check('Salgados: compra, ajustes, sobra, preço pendente e saldo seguinte', () => {
  setup(); let r = close(prepare());
  const lines = r.operation.snacks.map((l, i) => ({ ...l, purchased: i === 0 ? 40 : 0, remaining: i === 0 ? 5 : 0, nonSale: i === 0 ? 2 : 0 }));
  run({ kind: 'snack-count', roundId: r.id, lines }); const l = s.rounds[0].operation.snacks[0]; assert.equal(snackEstimate(l).sold, 33); assert.equal(snackEstimate(l).value, null);
  now = '2026-10-21T10:00:00-03:00'; r = run({ kind: 'round', start: '2026-10-21', methodology: 'weekly-allocation-v2' });
  run({ kind: 'snack-count', roundId: r.id, lines: r.operation.snacks.map(l => ({ ...l, purchased: 0, remaining: l.id === 'snack-0' ? 3 : 0, nonSale: 0 })) });
  const next = s.rounds[1].operation.snacks[0]; assert.equal(next.opening, 5); assert.equal(snackEstimate(next).output, 2);
});
check('Operações legadas não alteram a metodologia nova', () => {
  const r = setup(); reject({ kind: 'reopen-round', roundId: r.id, reason: 'Teste QA' }, /conferência semanal/);
  reject({ kind: 'production', roundId: r.id, day: r.start, flavorId: 'sabor-3', produced: 10, planned: 10 }, /conferência semanal/);
});
check('Importação exige associação única e não transforma nomes semelhantes em um produto', () => {
  setup(); run({ kind: 'photo-template', confirmed: true, lines: [{ name: 'Frango', flavorId: null, allocations: { sexta: 40, sabado: 40, domingo: 50 } }] });
  const frango = s.flavors.find(f => f.name === 'Frango'); assert.notEqual(frango.id, 'sabor-0'); assert.equal(frango.price, 0); assert.equal(s.rounds[0].operation.flavors.some(f => f.id === frango.id), false);
  role = 'operador'; reject({ kind: 'photo-template', confirmed: true, lines: [{ name: 'Carne', flavorId: 'sabor-3', allocations: { sexta: 40, sabado: 45, domingo: 70 } }] }, /administrador/);
});
console.log(JSON.stringify({ passed: count }));
