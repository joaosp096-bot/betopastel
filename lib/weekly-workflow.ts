import { z } from "zod";
import { State, Round, templateLineSchema, uid } from "./model";
import type { Context } from "./workflow";
const qty = z.number().int().min(0).max(1000000),
  money = z.number().int().min(0).max(100000000),
  id = z.string().min(1).max(80);
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (v) =>
      !Number.isNaN(Date.parse(v)) &&
      new Date(v).toISOString().slice(0, 10) === v,
    "Data inválida",
  );
const correction = {
  correction: z.boolean().optional(),
  reason: z.string().trim().max(300).optional(),
};
export const evolutionOperationSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("production-template"),
    lines: z.array(templateLineSchema).min(1).max(100),
  }),
  z.object({
    kind: z.literal("production-confirm"),
    roundId: id,
    day: date,
    contributors: z.array(z.string().trim().min(1).max(80)).min(1).max(30),
    lines: z.array(templateLineSchema).min(1).max(100),
    ...correction,
  }),
  z.object({
    kind: z.literal("weekly-return"),
    roundId: id,
    day: date,
    lines: z
      .array(
        z.object({
          flavorId: id,
          returned: qty,
          loss: qty,
          fairProduced: qty.nullable(),
        }),
      )
      .min(1)
      .max(100),
    ...correction,
  }),
  z.object({
    kind: z.literal("weekly-cash"),
    roundId: id,
    float: money,
    cash: money,
    pix: money,
    debit: money,
    credit: money,
    withdrawal: money,
    ...correction,
  }),
  z.object({
    kind: z.literal("cash-method"),
    roundId: id,
    mode: z.enum(["diario", "semanal"]),
  }),
  z.object({ kind: z.literal("expense-payment"), expenseId: id, date }),
]);
function fail(m: string): never {
  throw Error(m);
}
function correctionRequired(
  op: { correction?: boolean; reason?: string },
  c: Context,
  adminOnly = false,
) {
  if (adminOnly && c.role !== "admin")
    fail("Peça ao administrador a correção desta semana.");
  if (!op.correction || !op.reason || op.reason.trim().length < 3)
    fail("Informe o motivo da correção.");
}
function log(
  s: State,
  c: Context,
  kind: State["records"][number]["kind"],
  key: string,
  roundId: string,
  day: string,
  values: Record<string, unknown>,
  flavorId = "",
  fairId = "",
) {
  const old = s.records.find((e) => e.key === key),
    next = {
      id: old?.id || uid(),
      key,
      kind,
      roundId,
      day,
      flavorId,
      fairId,
      savedAt: c.now.toISOString(),
      savedBy: c.name,
      savedById: c.userId,
      revision: (old?.revision || 0) + 1,
      values,
    };
  s.records = old
    ? s.records.map((e) => (e.key === key ? next : e))
    : [...s.records, next];
  return next;
}
export function initializeWeeklyRound(s: State, r: Round) {
  r.returnMode = "semana";
  r.cashMode = "semanal";
  for (const p of r.production) {
    const t = s.settings.productionTemplate.find(
      (t) => t.flavorId === p.flavorId,
    );
    p.planned = t?.quantity || 0;
  }
  for (const f of r.fairs) {
    f.team = "";
    for (const l of f.lines) {
      const t = s.settings.productionTemplate.find(
        (t) => t.flavorId === l.flavorId,
      );
      l.planned = f.scheduleKey ? t?.allocations[f.scheduleKey] || 0 : 0;
    }
  }
}
/** New workflow is additive. Legacy per-fair records remain readable and cannot be summed twice. */
export function applyEvolution(
  s: State,
  raw: unknown,
  c: Context,
  day: string,
): { state: State; action: string; receipt?: State["records"][number] } | null {
  const parsed = evolutionOperationSchema.safeParse(raw);
  if (!parsed.success) return null;
  const op = parsed.data;
  if (op.kind === "production-template") {
    if (c.role !== "admin") fail("O padrão é ajustado pelo administrador.");
    if (new Set(op.lines.map((l) => l.flavorId)).size !== op.lines.length)
      fail("Sabor duplicado.");
    for (const l of op.lines) {
      const f = s.flavors.find((f) => f.id === l.flavorId && f.active);
      if (!f) fail("Sabor não encontrado.");
      if (
        f.prepKind === "base" &&
        Object.values(l.allocations).reduce((a, b) => a + b, 0) > l.quantity
      )
        fail("A separação supera a quantidade padrão.");
    }
    const before = structuredClone(s.settings.productionTemplate);
    s.settings.productionTemplate = op.lines;
    const receipt = log(s, c, "template", "template|production", "", day, {
      before,
      after: op.lines,
    });
    return { state: s, action: "Ajustar padrão de produção", receipt };
  }
  if (op.kind === "expense-payment") {
    const e = s.expenses.find((e) => e.id === op.expenseId && !e.cancelled);
    if (!e) fail("Gasto não encontrado.");
    if (e.status === "pago") fail("Este gasto já foi pago.");
    if (op.date > day) fail("Use a data real do pagamento.");
    const before = structuredClone(e);
    e.status = "pago";
    e.paidOn = op.date;
    e.updatedAt = c.now.toISOString();
    e.updatedBy = c.name;
    const receipt = log(s, c, "expense", "expense|" + e.id, e.roundId, e.date, {
      before,
      after: { ...e },
      event: "payment",
    });
    return {
      state: s,
      action: "Registrar pagamento: " + e.description,
      receipt,
    };
  }
  const r = s.rounds.find((r) => r.id === op.roundId);
  if (!r) fail("Semana não encontrada.");
  if (op.kind === "cash-method") {
    if (r.weeklyCash?.closed || r.fairs.some((f) => f.cash.closed))
      fail(
        "Já há caixa registrado. Preserve a forma de fechamento para evitar duplicidade.",
      );
    r.cashMode = op.mode;
    return {
      state: s,
      action:
        "Escolher fechamento " +
        (op.mode === "semanal" ? "semanal" : "por feira"),
    };
  }
  if (op.kind === "production-confirm") {
    if (r.status === "concluida" && !op.correction)
      fail("A contagem da semana já foi encerrada.");
    if (r.legacyProduction)
      fail(
        "Esta produção usa registros anteriores. Faça a correção pelo histórico.",
      );
    if (op.day !== (r.productionDay || r.start) || op.day > day)
      fail("Confirme a produção no dia escolhido ou depois dele.");
    if (r.weeklyReturn?.closed) correctionRequired(op, c, true);
    if (r.productionClosed) correctionRequired(op, c);
    const base = s.flavors.filter((f) => f.active && f.prepKind === "base");
    if (
      new Set(op.lines.map((l) => l.flavorId)).size !== op.lines.length ||
      op.lines.length !== base.length ||
      base.some((f) => !op.lines.some((l) => l.flavorId === f.id))
    )
      fail("Confira todos os sabores de produção, incluindo zero.");
    const contributors = [...new Set(op.contributors.map((n) => n.trim()))];
    for (const l of op.lines) {
      if (Object.values(l.allocations).reduce((a, b) => a + b, 0) > l.quantity)
        fail("A separação supera a produção de um sabor.");
      const p = r.production.find((p) => p.flavorId === l.flavorId);
      if (!p) fail("Sabor não encontrado na semana.");
      const before = structuredClone(p);
      p.produced = l.quantity;
      log(
        s,
        c,
        "production",
        [r.id, "production", op.day, l.flavorId, ""].join("|"),
        r.id,
        op.day,
        {
          before,
          produced: l.quantity,
          planned: p.planned,
          contributors,
          reason: op.reason || "",
        },
        l.flavorId,
      );
      for (const f of r.fairs) {
        const line = f.lines.find((x) => x.flavorId === l.flavorId);
        if (!line || !f.scheduleKey) continue;
        const amount = l.allocations[f.scheduleKey];
        if (
          line.taken !== amount &&
          (f.loadConfirmed ||
            f.cash.closed ||
            f.returnSealed ||
            (r.productionClosed && day > f.date))
        )
          correctionRequired(op, c, true);
        line.taken = amount;
      }
      log(
        s,
        c,
        "allocation",
        [r.id, "allocation", op.day, l.flavorId, ""].join("|"),
        r.id,
        op.day,
        {
          allocations: r.fairs.map((f) => ({
            fairId: f.id,
            quantity:
              f.lines.find((x) => x.flavorId === l.flavorId)?.taken || 0,
          })),
        },
        l.flavorId,
      );
    }
    if (r.weeklyReturn?.closed)
      for (const line of r.weeklyReturn.lines) {
        const quantity =
          line.fairProduced ??
          r.production.find((p) => p.flavorId === line.flavorId)?.produced ??
          0;
        if (line.returned + line.loss > quantity)
          fail(
            "A produção corrigida fica menor que as sobras e perdas já confirmadas. Confira a contagem.",
          );
      }
    r.contributors = contributors;
    r.productionClosed = true;
    const receipt = log(
      s,
      c,
      "seal",
      [r.id, "seal-production", op.day, "", ""].join("|"),
      r.id,
      op.day,
      { phase: "production", contributors, reason: op.reason || "" },
    );
    return {
      state: s,
      action:
        (op.correction ? "Corrigir" : "Confirmar") +
        " produção" +
        (op.reason ? " · " + op.reason : ""),
      receipt,
    };
  }
  if (op.kind === "weekly-return") {
    const last = r.fairs
      .map((f) => f.date)
      .sort()
      .at(-1);
    if (!last || day < last || op.day < last || op.day > day)
      fail(
        "A contagem final pode ser registrada a partir do domingo da semana.",
      );
    if (!r.productionClosed)
      fail("Confirme a produção antes de contar as sobras.");
    if (
      r.returnMode === "feira" ||
      s.records.some(
        (e) => e.roundId === r.id && e.kind === "return" && e.fairId,
      )
    )
      fail(
        "Esta semana tem contagem por feira. Use os retornos existentes para preservar o histórico.",
      );
    if (r.weeklyReturn?.closed)
      correctionRequired(op, c, c.role !== "admin" && r.status === "concluida");
    const required = s.flavors.filter((f) =>
      r.production.some(
        (p) => p.flavorId === f.id && (f.active || p.produced > 0),
      ),
    );
    if (
      new Set(op.lines.map((l) => l.flavorId)).size !== op.lines.length ||
      op.lines.length !== required.length ||
      required.some((f) => !op.lines.some((l) => l.flavorId === f.id))
    )
      fail(
        "Preencha a contagem de cada sabor. Zero também precisa ser confirmado.",
      );
    for (const l of op.lines) {
      const f = s.flavors.find((f) => f.id === l.flavorId)!;
      if (f.prepKind === "na_feira" && l.fairProduced === null)
        fail(
          "Confirme quanto foi preparado na feira; a média não é produção real.",
        );
      if (f.prepKind === "base" && l.fairProduced !== null)
        fail("Produção da base já está confirmada.");
      const total =
        f.prepKind === "base"
          ? r.production.find((p) => p.flavorId === l.flavorId)?.produced || 0
          : l.fairProduced || 0;
      if (l.returned + l.loss > total)
        fail(
          "Sobras e perdas superam o total produzido. Confira " + f.name + ".",
        );
    }
    const before = r.weeklyReturn;
    r.weeklyReturn = { closed: true, day: op.day, lines: op.lines };
    r.status = "concluida";
    const receipt = log(
      s,
      c,
      "return",
      [r.id, "weekly-return"].join("|"),
      r.id,
      op.day,
      { before, after: r.weeklyReturn, reason: op.reason || "" },
    );
    return {
      state: s,
      action:
        (before ? "Corrigir contagem semanal" : "Fechar contagem semanal") +
        (op.reason ? " · " + op.reason : ""),
      receipt,
    };
  }
  if (op.kind === "weekly-cash") {
    const last = r.fairs
      .map((f) => f.date)
      .sort()
      .at(-1);
    if (!last || day < last) fail("Feche o caixa semanal a partir do domingo.");
    if (r.cashMode !== "semanal" || r.fairs.some((f) => f.cash.closed))
      fail(
        "Há fechamento por feira. Use os caixas existentes; os valores não serão somados duas vezes.",
      );
    if (r.weeklyCash?.closed) correctionRequired(op, c);
    const before = r.weeklyCash;
    r.weeklyCash = {
      closed: true,
      float: op.float,
      cash: op.cash,
      pix: op.pix,
      card: 0,
      debit: op.debit,
      credit: op.credit,
      withdrawal: op.withdrawal,
    };
    const receipt = log(
      s,
      c,
      "cash",
      [r.id, "weekly-cash"].join("|"),
      r.id,
      last,
      { before, after: r.weeklyCash, reason: op.reason || "" },
    );
    return {
      state: s,
      action:
        (before ? "Corrigir" : "Fechar") +
        " caixa semanal" +
        (op.reason ? " · " + op.reason : ""),
      receipt,
    };
  }
  return null;
}
export const expenseFields = {
  roundId: z.string().max(80).default(""),
  status: z.enum(["pago", "pendente"]).default("pago"),
  paidOn: date.nullable().default(null),
  supplier: z.string().trim().max(100).default(""),
};
export function applyExpense(s: State, op: any, c: Context, day: string) {
  const old = op.expenseId
    ? s.expenses.find((e) => e.id === op.expenseId)
    : undefined;
  if (op.expenseId && !old) fail("Gasto não encontrado.");
  if (old?.cancelled) fail("Este gasto foi cancelado.");
  if (op.kind === "expense-cancel") {
    if (!old) fail("Gasto não encontrado.");
    const before = { ...old };
    old.cancelled = true;
    old.updatedAt = c.now.toISOString();
    old.updatedBy = c.name;
    const receipt = log(
      s,
      c,
      "expense",
      "expense|" + old.id,
      old.roundId,
      old.date,
      { before, after: { ...old }, reason: op.reason, event: "cancel" },
    );
    return { state: s, action: "Cancelar gasto: " + op.reason, receipt };
  }
  if (old) correctionRequired(op, c);
  if (op.date > day) fail("Use a data em que o gasto aconteceu.");
  if (op.roundId && !s.rounds.some((r) => r.id === op.roundId))
    fail("Semana não encontrada.");
  if (
    op.fairId &&
    !s.rounds
      .find((r) => r.id === op.roundId)
      ?.fairs.some((f) => f.id === op.fairId)
  )
    fail("Feira não encontrada.");
  if (op.status === "pago" && op.paidOn && op.paidOn > day)
    fail("O pagamento ainda não aconteceu.");
  if (
    !old &&
    op.newExpenseId &&
    s.expenses.some((e) => e.id === op.newExpenseId)
  )
    fail("Este identificador de gasto já foi usado.");
  if (op.amount <= 0) fail("Informe um valor maior que zero.");
  const next = {
    id: old?.id || op.newExpenseId || uid(),
    roundId: op.roundId,
    fairId: op.fairId,
    date: op.date,
    description: op.description,
    amount: op.amount,
    category: op.category,
    status: op.status,
    paidOn: op.status === "pago" ? op.paidOn || op.date : null,
    supplier: op.supplier,
    cancelled: false,
    createdAt: old ? old.createdAt : c.now.toISOString(),
    createdBy: old ? old.createdBy : c.name,
    updatedAt: c.now.toISOString(),
    updatedBy: c.name,
  };
  s.expenses = old
    ? s.expenses.map((e) => (e.id === old.id ? next : e))
    : [...s.expenses, next];
  const receipt = log(
    s,
    c,
    "expense",
    "expense|" + next.id,
    next.roundId,
    next.date,
    { before: old || null, after: next, reason: op.reason || "" },
  );
  return {
    state: s,
    action:
      (old ? "Corrigir gasto: " : "Registrar gasto: ") +
      op.description +
      (op.reason ? " · " + op.reason : ""),
    receipt,
  };
}
