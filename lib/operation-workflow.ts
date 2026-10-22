import { z } from "zod";
import type { State, Round } from "./model";
import type { Context } from "./workflow";
import { count, amount, identifier, calendarDay, days, preparedLine, carryLine, closeLine, extraLine, quantities, snackLine, doughBatchSchema, type OperationWeek } from "./operation-model";
import { carryBalances, total, weekEstimate, initOperation } from "./operation-domain";

const explanation = { reason: z.string().trim().max(300).default("") };
export const operationCommands = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("photo-template"), confirmed: z.literal(true), lines: z.array(z.object({ name: z.string().trim().min(1).max(80), flavorId: identifier.nullable(), allocations: quantities })).min(1).max(100) }),
  z.object({ kind: z.literal("week-prepare"), roundId: identifier, day: calendarDay, contributors: z.array(z.string().trim().min(1).max(80)).min(1).max(30), flourKg: z.number().min(0).max(10000).nullable(), lines: z.array(preparedLine).max(100), carry: z.array(carryLine).max(100), extras: z.array(z.object({ flavorId: identifier, allocations: quantities })).max(100), ...explanation }),
  z.object({ kind: z.literal("week-close"), roundId: identifier, day: calendarDay, margin: count.nullable(), lines: z.array(closeLine).max(100), extras: z.array(extraLine).max(100), notes: z.string().max(500), ...explanation }),
  z.object({ kind: z.literal("week-fair"), roundId: identifier, key: z.enum(days), cancelled: z.boolean(), note: z.string().max(300), ...explanation }),
  z.object({ kind: z.literal("week-reopen"), roundId: identifier, reason: z.string().trim().min(3).max(300) }),
  z.object({ kind: z.literal("week-pattern"), roundId: identifier }),
  z.object({ kind: z.literal("week-prices"), roundId: identifier, lines: z.array(z.object({ flavorId: identifier, prices: snackLine.shape.prices })).max(100), reason: z.string().trim().min(3).max(300) }),
  z.object({ kind: z.literal("snack-count"), roundId: identifier, lines: z.array(snackLine.omit({ opening: true, name: true })).max(30), ...explanation }),
  z.object({ kind: z.literal("dough-batch"), id: identifier.optional(), day: calendarDay, quantity: count, unitPrice: amount.nullable(), ...explanation }),
  z.object({ kind: z.literal("dough-observe"), id: identifier, observation: doughBatchSchema.shape.observation.unwrap(), ...explanation }),
]);
function fail(message: string): never { throw new Error(message); }
function exactly(ids: string[], received: string[]) {
  if (ids.length !== received.length || new Set(received).size !== received.length || received.some(id => !ids.includes(id))) fail("Confira todos os itens uma única vez. Nenhum campo ausente significa zero.");
}
function audit(s: State, c: Context, day: string, key: string, roundId: string, kind: State["records"][number]["kind"], values: Record<string, unknown>) {
  const old = s.records.find(x => x.key === key);
  const record = { id: old?.id ?? crypto.randomUUID(), key, kind, roundId, fairId: "", flavorId: "", day, savedAt: c.now.toISOString(), savedBy: c.name, savedById: c.userId, revision: (old?.revision ?? 0) + 1, values };
  if (old) s.records[s.records.indexOf(old)] = record; else s.records.push(record);
  return record;
}
function correction(existing: boolean, reason: string) {
  if (existing && reason.length < 3) fail("Informe um motivo para corrigir o registro salvo.");
}
function sourceCheck(s: State, r: Round) {
  const { source, lines } = carryBalances(s, r);
  if (r.operation!.sourceId && (!source?.operation?.closing || !source.productionClosed)) fail("Feche primeiro a semana anterior para conferir o saldo disponível.");
  if (source && s.rounds.some(x => x.id !== r.id && x.productionClosed && x.operation?.sourceId === source.id)) fail("Esse saldo já está vinculado a outra semana.");
  return { source, lines };
}
function invalidate(s: State, r: Round, seen = new Set<string>()) {
  if (seen.has(r.id)) fail("Vínculo de semanas inválido.");
  seen.add(r.id);
  for (const child of s.rounds.filter(x => x.operation?.sourceId === r.id)) invalidate(s, child, seen);
  r.status = "aberta"; r.productionClosed = false;
  if (r.operation) { if (r.operation.closing) r.operation.reopenedClosing = r.operation.closing; r.operation.closing = null; r.operation.sourceRevision = null; r.operation.snacksConfirmed = false; r.operation.revision++; }
}
export function applyWeeklyOperation(s: State, raw: unknown, c: Context, day: string) {
  const parsed = operationCommands.safeParse(raw);
  if (!parsed.success) return null;
  const op = parsed.data;
  let action = "", roundId = "", kind: State["records"][number]["kind"] = "production", recordKey = "";
  if (op.kind === "photo-template") {
    if (c.role !== "admin") fail("O padrão é conferido pelo administrador.");
    const mapped: State["settings"]["productionTemplate"] = [];
    for (const l of op.lines) {
      let f = s.flavors.find(f => f.id === l.flavorId);
      if (l.flavorId && (!f || !f.active || f.prepKind !== "base")) fail("Escolha um sabor ativo da base para cada linha.");
      if (!f) {
        if (s.flavors.some(f => f.name.toLocaleLowerCase("pt-BR") === l.name.toLocaleLowerCase("pt-BR"))) fail("Já existe um sabor com esse nome. Selecione-o ou revise o cadastro.");
        f = { id: crypto.randomUUID(), name: l.name, active: true, prepKind: "base", price: 0, prices: {} }; s.flavors.push(f);
      }
      if (mapped.some(x => x.flavorId === f!.id)) fail("Associe cada linha a um sabor diferente.");
      mapped.push({ flavorId: f.id, quantity: total(l.allocations), allocations: l.allocations });
    }
    s.settings.productionTemplate = [...s.settings.productionTemplate.filter(t => !mapped.some(x => x.flavorId === t.flavorId)), ...mapped];
    action = "Conferir tabela da foto para próximas semanas"; recordKey = "photo-template"; kind = "template";
  } else if (op.kind === "dough-batch") {
    if (op.day > day) fail("Use a data em que o lote foi produzido.");
    const old = s.doughBatches.find(b => b.id === op.id);
    if (op.id && !old) fail("Lote não encontrado.");
    correction(!!old, op.reason);
    if (old?.observation && (old.observation.remaining + (old.observation.nonSale ?? 0) > op.quantity || old.observation.confirmedOn < op.day || (old.observation.endedOn && old.observation.endedOn < op.day))) fail("Revise a observação do lote antes de alterar sua produção.");
    const next = doughBatchSchema.parse({ id: old?.id ?? crypto.randomUUID(), day: op.day, quantity: op.quantity, unitPrice: op.unitPrice, observation: old?.observation ?? null });
    if (old) s.doughBatches[s.doughBatches.indexOf(old)] = next; else s.doughBatches.push(next);
    recordKey = `dough|${next.id}`; action = old ? "Corrigir lote de massinhas" : "Registrar lote de massinhas";
  } else if (op.kind === "dough-observe") {
    const b = s.doughBatches.find(b => b.id === op.id); if (!b) fail("Lote não encontrado.");
    const v = op.observation;
    if (v.confirmedOn > day || v.confirmedOn < b.day || (v.endedOn && (v.endedOn < b.day || v.endedOn > v.confirmedOn || v.remaining !== 0))) fail("Confira as datas do lote e da confirmação.");
    if (v.remaining + (v.nonSale ?? 0) > b.quantity) fail("Sobra e saídas sem venda superam o lote.");
    correction(!!b.observation, op.reason); b.observation = v;
    recordKey = `dough-observe|${b.id}`; kind = "return"; action = "Conferir lote de massinhas";
  } else {
    const r = s.rounds.find(r => r.id === op.roundId); if (!r?.operation) fail("Use o fluxo correspondente a esta semana.");
    const o = r.operation; roundId = r.id; recordKey = `${op.kind}|${r.id}`;
    if (op.kind === "week-pattern") {
      if (s.records.some(e => e.key === `week-prepare|${r.id}`)) fail("A produção já foi confirmada. Corrija os sabores existentes sem substituir o histórico pelo padrão.");
      const fresh = initOperation(s, r);
      r.operation = { ...fresh, sourceId: o.sourceId, fairs: o.fairs, snacks: o.snacks, snacksConfirmed: o.snacksConfirmed };
      for (const f of fresh.flavors) {
        let p = r.production.find(l => l.flavorId === f.id);
        if (!p) { p = { flavorId: f.id, planned: f.target, produced: 0 }; r.production.push(p); } else p.planned = f.target;
        for (const fair of r.fairs) {
          const old = fair.lines.find(l => l.flavorId === f.id);
          if (!old) fair.lines.push({ flavorId: f.id, planned: f.allocations[fair.scheduleKey!], taken: 0, returned: 0, reusable: 0, loss: 0, adjustment: 0, soldOut: false, price: f.prices[fair.scheduleKey!] ?? 0 });
        }
      }
      kind = "template"; action = "Carregar padrão atualizado antes da produção";
    } else if (op.kind === "week-reopen") {
      if (c.role !== "admin") fail("Peça a reabertura ao administrador.");
      invalidate(s, r); kind = "seal"; action = "Reabrir semana e conferir saldos das semanas seguintes";
    } else if (op.kind === "week-prices") {
      if (c.role !== "admin") fail("Os preços são corrigidos pelo administrador.");
      exactly(o.flavors.map(f => f.id), op.lines.map(l => l.flavorId));
      for (const l of op.lines) o.flavors.find(f => f.id === l.flavorId)!.prices = l.prices;
      kind = "template"; action = "Corrigir preços históricos desta semana";
    } else {
      if (o.closing && op.kind !== "snack-count") fail("Reabra a semana antes de corrigir produção, feiras ou contagem. O histórico será preservado.");
      if (op.kind === "week-prepare") {
        if (op.day !== r.start && op.day !== new Date(Date.parse(r.start + "T12:00:00Z") + 86400000).toISOString().slice(0, 10)) fail("Escolha quarta ou quinta para a produção.");
        if (op.day > day) fail("Confirme a produção a partir do dia escolhido.");
        const wasPrepared = s.records.some(e => e.key === `week-prepare|${r.id}`);
        correction(wasPrepared, op.reason);
        const source = sourceCheck(s, r);
        exactly(source.lines.map(l => l.flavorId), op.carry.map(l => l.flavorId));
        for (const l of op.carry) if (l.ready + l.discarded + l.dismantled !== source.lines.find(x => x.flavorId === l.flavorId)!.quantity) fail("Divida todo o saldo anterior entre prontos, descarte e desmontagem.");
        for (const l of op.carry) if (l.ready && !o.flavors.some(f => f.id === l.flavorId && f.kind === "base")) fail("Reative o sabor no cadastro e abra a semana com ele, ou revise esse saldo como descarte/desmontagem.");
        exactly(o.flavors.filter(f => f.kind === "base").map(f => f.id), op.lines.map(l => l.flavorId));
        exactly(o.flavors.filter(f => f.kind === "na_feira").map(f => f.id), op.extras.map(l => l.flavorId));
        for (const l of op.lines) {
          const ready = op.carry.find(x => x.flavorId === l.flavorId)?.ready ?? 0;
          if (total(l.allocations) > l.quantity + ready) fail("A separação por feira supera a produção nova mais os pastéis prontos aproveitados.");
          const p = r.production.find(p => p.flavorId === l.flavorId)!; p.produced = l.quantity;
          o.flavors.find(f => f.id === l.flavorId)!.allocations = l.allocations;
          for (const d of days) { const line = r.fairs.find(f => f.scheduleKey === d)!.lines.find(x => x.flavorId === l.flavorId)!; line.taken = l.allocations[d]; }
        }
        for (const l of op.extras) o.flavors.find(f => f.id === l.flavorId)!.allocations = l.allocations;
        // Prices can be configured after opening but freeze on first confirmation.
        if (!wasPrepared) for (const f of o.flavors) {
          const current = s.flavors.find(x => x.id === f.id)!;
          for (const d of days) f.prices[d] = (current.prices[d] ?? current.price) || null;
        }
        o.carry = op.carry; o.flourKg = op.flourKg; o.sourceRevision = source.source?.operation?.revision ?? null;
        r.productionDay = op.day; r.contributors = [...new Set(op.contributors)]; r.productionClosed = true;
        action = "Confirmar produção e separação da semana";
      } else if (op.kind === "week-fair") {
        const f = o.fairs.find(f => f.key === op.key)!;
        correction(f.cancelled && !op.cancelled, op.reason);
        f.cancelled = op.cancelled; f.note = op.note;
        kind = "allocation"; recordKey += `|${op.key}`; action = op.cancelled ? "Cancelar feira e revisar destino da carga" : "Atualizar feira";
      } else if (op.kind === "week-close") {
        if (!r.productionClosed) fail("Confirme a produção primeiro.");
        const active = r.fairs.filter(f => !o.fairs.find(x => x.key === f.scheduleKey)!.cancelled);
        const lastDay = active.map(f => f.date).sort().at(-1) ?? r.productionDay!;
        if (day < lastDay || op.day < lastDay || op.day > day) fail("Feche a partir da última feira que aconteceu. Cancele as que não aconteceram, se necessário.");
        exactly(o.flavors.filter(f => f.kind === "base").map(f => f.id), op.lines.map(l => l.flavorId));
        exactly(o.flavors.filter(f => f.kind === "na_feira").map(f => f.id), op.extras.map(l => l.flavorId));
        o.closing = { day: op.day, lines: op.lines, extras: op.extras }; o.margin = op.margin; o.notes = op.notes;
        const estimate = weekEstimate(r)!;
        for (const line of estimate.lines) {
          if (line.returned! > line.taken) fail("A sobra das feiras supera a quantidade levada. Reserva e feira cancelada já ficam fora desta contagem.");
          const countLine = op.lines.find(l => l.flavorId === line.id)!;
          if (days.reduce((n, d) => n + (countLine.nonSale[d] ?? 0), 0) > line.taken - line.returned!) fail("Sobras e saídas sem venda superam a quantidade levada às feiras.");
          for (const f of line.perFair) {
            const actual = countLine.nonSale[f.day];
            if (actual !== null && actual > f.available - (line.allocationIncomplete ? 0 : f.returned ?? 0)) fail("A saída sem venda informada supera a quantidade disponível nessa feira.");
          }
        }
        for (const l of op.extras) for (const d of days) {
          const e = l.values[d];
          if ((e.mode === "pending") !== (e.quantity === null)) fail("Informe a quantidade do extra ou deixe como pendente.");
          if (o.fairs.find(f => f.key === d)!.cancelled && (e.quantity ?? 0) > 0) fail("Feira cancelada não pode ter saída de extras.");
        }
        r.status = "concluida"; o.reopenedClosing = null; kind = "return"; action = "Fechar semana com estimativa identificada";
      } else if (op.kind === "snack-count") {
        const source = sourceCheck(s, r);
        if (source.source && !source.source.operation!.snacksConfirmed) fail("Confira primeiro os salgados da semana anterior, inclusive se não havia estoque.");
        if (s.rounds.some(x => x.operation?.sourceId === r.id && x.operation.snacksConfirmed)) fail("Reabra primeiro esta semana para rever os saldos das semanas seguintes.");
        correction(o.snacksConfirmed, op.reason);
        exactly(o.snacks.map(l => l.id), op.lines.map(l => l.id));
        o.snacks = op.lines.map(l => {
          const old = o.snacks.find(x => x.id === l.id)!;
          const opening = source.source?.operation?.snacks.find(x => x.id === l.id)?.remaining ?? 0;
          if (l.remaining !== null && l.remaining + (l.nonSale ?? 0) > opening + l.purchased) fail("Sobra e ajustes dos salgados superam o saldo mais as compras.");
          if (days.some(d => l.soldByFair[d] !== null)) {
            if (l.remaining === null || l.nonSale === null || days.some(d => l.soldByFair[d] === null) || total(l.soldByFair as Record<string, number>) !== opening + l.purchased - l.remaining - l.nonSale) fail("A distribuição opcional deve corresponder à saída total dos salgados, descontados os ajustes.");
            if (days.some(d => o.fairs.find(f => f.key === d)!.cancelled && (l.soldByFair[d] ?? 0) > 0)) fail("Não atribua vendas de salgados a feira cancelada.");
          }
          return { ...l, name: old.name, opening };
        });
        o.snacksConfirmed = o.snacks.every(l => l.remaining !== null);
        kind = "return"; action = "Conferir salgados comprados";
      }
      o.revision++;
    }
  }
  const receipt = audit(s, c, day, recordKey, roundId, kind, { ...op, event: op.kind, methodology: "weekly-allocation-v2" });
  return { state: s, action, receipt };
}
