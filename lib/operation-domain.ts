import type { Round, State } from "./model";
import { days, zero, unknownCounts, snackNames, type Day, type OperationWeek, type DoughBatch } from "./operation-model.ts";

export const total = (v: Record<string, number>) => Object.values(v).reduce((a, b) => a + b, 0);
export function initOperation(s: State, r: Round): OperationWeek {
  const previous = [...s.rounds].filter(x => x.operation && x.start < r.start).sort((a, b) => b.start.localeCompare(a.start))[0];
  return {
    method: "weekly-allocation-v2", revision: 0, sourceId: previous?.id ?? null, sourceRevision: null,
    carry: [], flourKg: null, margin: null, notes: "", closing: null,
    fairs: days.map(key => ({ key, cancelled: false, note: "" })),
    flavors: s.flavors.filter(f => f.active).map(f => {
      const t = s.settings.productionTemplate.find(t => t.flavorId === f.id);
      return { id: f.id, name: f.name, kind: f.prepKind, target: t?.quantity ?? 0, allocations: t?.allocations ?? zero(),
        prices: Object.fromEntries(days.map(d => [d, (f.prices[d] ?? f.price) || null])) as OperationWeek["flavors"][number]["prices"] };
    }),
    snacks: snackNames.map((name, i) => ({ id: `snack-${i}`, name, opening: 0, purchased: 0, remaining: null, nonSale: null, soldByFair: unknownCounts(), prices: unknownCounts() })),
    snacksConfirmed: false,
  };
}

/** Cancellation is a projection, never a mutation of source loads. Repeated reads cannot duplicate stock. */
export function routed(o: OperationWeek, allocations: Record<Day, number>) {
  const loads = zero(); let carried = 0;
  for (const day of days) {
    carried += allocations[day];
    if (!o.fairs.find(f => f.key === day)!.cancelled) { loads[day] = carried; carried = 0; }
  }
  return { loads, held: carried };
}

export function weekEstimate(r: Round) {
  const o = r.operation;
  if (!o) return null;
  const active = days.filter(d => !o.fairs.find(f => f.key === d)!.cancelled);
  const last = active.at(-1);
  const lines = o.flavors.filter(f => f.kind === "base").map(f => {
    const p = r.production.find(p => p.flavorId === f.id);
    const made = r.productionClosed ? p?.produced ?? 0 : 0;
    const reused = r.productionClosed ? o.carry.find(c => c.flavorId === f.id)?.ready ?? 0 : 0;
    const allocations = Object.fromEntries(days.map(d => [d, r.productionClosed ? r.fairs.find(x => x.scheduleKey === d)?.lines.find(l => l.flavorId === f.id)?.taken ?? 0 : 0])) as Record<Day, number>;
    const route = routed(o, allocations), taken = total(route.loads), reserve = made + reused - total(allocations);
    const closing = o.closing?.lines.find(l => l.flavorId === f.id);
    const returned = closing?.returned ?? null;
    const allocationIncomplete = returned !== null && returned > (last ? route.loads[last] : 0);
    const perFair = days.map(d => {
      const available = route.loads[d];
      const remaining = d === last ? returned : 0;
      const actual = closing?.nonSale[d] ?? null;
      const deduction = actual ?? o.margin;
      const incomplete = !closing || allocationIncomplete || (available > (remaining ?? 0) && deduction === null);
      const nonSale = incomplete ? null : Math.min(deduction ?? 0, available - (remaining ?? 0));
      const sold = incomplete ? null : available - (remaining ?? 0) - (nonSale ?? 0);
      const value = sold === 0 ? 0 : sold !== null && f.prices[d] !== null ? sold * f.prices[d]! : null;
      return { day: d, available, returned: remaining, nonSale, sold, value, price: f.prices[d], actual: actual !== null };
    });
    const sold = perFair.every(f => f.sold !== null) ? perFair.reduce((n, f) => n + f.sold!, 0) : null;
    const finalStock = returned === null ? null : reserve + route.held + returned;
    return { id: f.id, name: f.name, made, reused, taken, reserve, held: route.held, returned, allocationIncomplete, perFair, sold, finalStock };
  });
  const extras = o.flavors.filter(f => f.kind === "na_feira").flatMap(f => days.map(d => {
    const cancelled = o.fairs.find(x => x.key === d)!.cancelled;
    const e = o.closing?.extras.find(e => e.flavorId === f.id)?.values[d];
    const quantity = cancelled ? 0 : e?.mode !== "pending" && e?.quantity !== null && e?.quantity !== undefined ? e.quantity : null;
    return { id: f.id, name: f.name, day: d, mode: e?.mode ?? "pending", quantity, value: quantity === 0 ? 0 : quantity !== null && f.prices[d] !== null ? quantity * f.prices[d]! : null };
  }));
  const values = [...lines.flatMap(l => l.perFair.map(f => f.value)), ...extras.map(e => e.value)];
  const value = values.reduce<number>((n, v) => n + (v ?? 0), 0);
  if (!Number.isSafeInteger(value)) throw new Error("O valor informado ultrapassa o limite de cálculo exato. Confira preços e quantidades.");
  return {
    lines, extras, value, partial: !o.closing || values.some(v => v === null),
    produced: lines.reduce((n, l) => n + l.made, 0), taken: lines.reduce((n, l) => n + l.taken, 0),
    returned: o.closing ? lines.reduce((n, l) => n + (l.returned ?? 0), 0) : null,
    output: o.closing && lines.every(l => l.sold !== null) ? lines.reduce((n, l) => n + l.sold!, 0) + extras.reduce((n, e) => n + (e.quantity ?? 0), 0) : null,
    extrasPending: extras.filter(e => e.quantity === null).length,
  };
}

export function carryBalances(s: State, r: Round) {
  const source = s.rounds.find(x => x.id === r.operation?.sourceId);
  const estimate = source && weekEstimate(source);
  return { source, lines: estimate?.lines.filter(l => (l.finalStock ?? 0) > 0).map(l => ({ flavorId: l.id, name: l.name, quantity: l.finalStock! })) ?? [] };
}
export function batchEstimate(b: DoughBatch) {
  const obs = b.observation, consumed = obs ? b.quantity - obs.remaining : null;
  const sold = consumed !== null && obs?.nonSale !== null && obs?.nonSale !== undefined ? consumed - obs.nonSale : null;
  const elapsed = obs?.remaining === 0 ? Math.round((Date.parse((obs.endedOn ?? obs.confirmedOn) + "T12:00:00Z") - Date.parse(b.day + "T12:00:00Z")) / 86400000) : null;
  return { consumed, sold, value: sold === 0 ? 0 : sold !== null && b.unitPrice !== null ? sold * b.unitPrice : null, elapsed, exact: !!obs?.endedOn };
}
export function snackEstimate(l: OperationWeek["snacks"][number]) {
  const output = l.remaining === null ? null : l.opening + l.purchased - l.remaining;
  const sold = output === null || l.nonSale === null ? null : output - l.nonSale;
  const allocated = days.every(d => l.soldByFair[d] !== null) && total(l.soldByFair as Record<Day, number>) === sold;
  const value = sold === 0 ? 0 : allocated && days.every(d => !l.soldByFair[d] || l.prices[d] !== null) ? days.reduce((n, d) => n + (l.soldByFair[d] ?? 0) * (l.prices[d] ?? 0), 0) : null;
  return { output, sold, value };
}
