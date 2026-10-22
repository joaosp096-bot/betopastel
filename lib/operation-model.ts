import { z } from "zod";

export const count = z.number().int().min(0).max(1000000);
export const amount = z.number().int().min(1).max(100000000);
export const identifier = z.string().min(1).max(80);
export const calendarDay = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v, "Data inválida");
export const days = ["sexta", "sabado", "domingo"] as const;
export type Day = typeof days[number];
export const quantities = z.object({ sexta: count, sabado: count, domingo: count });
export const nullableQuantities = z.object({ sexta: count.nullable(), sabado: count.nullable(), domingo: count.nullable() });
export const prices = z.object({ sexta: amount.nullable(), sabado: amount.nullable(), domingo: amount.nullable() });
export const zero = () => ({ sexta: 0, sabado: 0, domingo: 0 });
export const unknownCounts = () => ({ sexta: null, sabado: null, domingo: null });
export const extraEntry = z.object({ mode: z.enum(["pending", "count", "estimate"]), quantity: count.nullable() });
export const carryLine = z.object({ flavorId: identifier, ready: count, discarded: count, dismantled: count });
export const preparedLine = z.object({ flavorId: identifier, quantity: count, allocations: quantities });
export const closeLine = z.object({ flavorId: identifier, returned: count, nonSale: nullableQuantities });
export const extraLine = z.object({ flavorId: identifier, values: z.object({ sexta: extraEntry, sabado: extraEntry, domingo: extraEntry }) });
export const snackNames = ["Salsicha", "Coxinha de frango", "Bolovo", "Risoles de queijo", "Risoles de pizza", "Risoles de carne", "Enrolado de presunto e queijo", "Quibe"];
export const snackLine = z.object({ id: identifier, name: z.string().min(1).max(80), opening: count, purchased: count, remaining: count.nullable(), nonSale: count.nullable(), soldByFair: nullableQuantities, prices });
export const operationSchemaV2 = z.object({
  method: z.literal("weekly-allocation-v2"),
  revision: z.number().int().min(0),
  sourceId: identifier.nullable(),
  sourceRevision: z.number().int().min(0).nullable(),
  carry: z.array(carryLine).max(100),
  flourKg: z.number().min(0).max(10000).nullable(),
  margin: count.nullable(),
  notes: z.string().max(500),
  fairs: z.array(z.object({ key: z.enum(days), cancelled: z.boolean(), note: z.string().max(300) })).length(3),
  flavors: z.array(z.object({ id: identifier, name: z.string().min(1).max(80), kind: z.enum(["base", "na_feira"]), prices, target: count, allocations: quantities })).max(100),
  closing: z.object({ day: calendarDay, lines: z.array(closeLine).max(100), extras: z.array(extraLine).max(100) }).nullable(),
  reopenedClosing: z.object({ day: calendarDay, lines: z.array(closeLine).max(100), extras: z.array(extraLine).max(100) }).nullable().optional(),
  snacks: z.array(snackLine).max(30),
  snacksConfirmed: z.boolean(),
});
export const doughBatchSchema = z.object({
  id: identifier, day: calendarDay, quantity: count.refine(v => v > 0, "Informe a quantidade do lote"), unitPrice: amount.nullable(),
  observation: z.object({ remaining: count, nonSale: count.nullable(), confirmedOn: calendarDay, endedOn: calendarDay.nullable() }).nullable(),
});
export type OperationWeek = z.infer<typeof operationSchemaV2>;
export type DoughBatch = z.infer<typeof doughBatchSchema>;
