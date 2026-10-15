import { z } from "zod";
import {
  State,
  Round,
  Fair,
  uid,
  newRound,
  newFair,
  addDays,
  weekStart,
  stateSchema,
  flavorSchema,
} from "./model";
export type Actor = {
  userId: string;
  name: string;
  role: "admin" | "operador";
};
export type Context = Actor & { now: Date };
const n = z.number().int().min(0).max(1000000),
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
export const operationSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("round"),
    start: date,
    productionDay: date.optional(),
  }),
  z.object({ kind: z.literal("production-day"), roundId: id, day: date }),
  z.object({
    kind: z.literal("production"),
    roundId: id,
    flavorId: id,
    day: date,
    planned: n,
    produced: n,
    ...correction,
  }),
  z.object({
    kind: z.literal("allocation"),
    roundId: id,
    flavorId: id,
    day: date,
    allocations: z.array(z.object({ fairId: id, quantity: n })).length(3),
    ...correction,
  }),
  z.object({
    kind: z.literal("load"),
    roundId: id,
    fairId: id,
    flavorId: id,
    taken: n,
    price: money.optional(),
    ...correction,
  }),
  z.object({ kind: z.literal("confirm-load"), roundId: id, fairId: id }),
  z.object({
    kind: z.literal("return"),
    roundId: id,
    fairId: id,
    flavorId: id,
    returned: n,
    reusable: n,
    loss: n,
    adjustment: z.number().int().min(-1000000).max(1000000),
    soldOut: z.boolean(),
    ...correction,
  }),
  z.object({
    kind: z.literal("cash"),
    roundId: id,
    fairId: id,
    float: money,
    cash: money,
    pix: money,
    card: money,
    withdrawal: money,
    ...correction,
  }),
  z.object({ kind: z.literal("seal-production"), roundId: id, day: date }),
  z.object({ kind: z.literal("seal-return"), roundId: id, fairId: id }),
  z.object({ kind: z.literal("close-round"), roundId: id }),
  z.object({
    kind: z.literal("reopen-round"),
    roundId: id,
    reason: z.string().trim().min(3).max(300),
  }),
  z.object({
    kind: z.literal("expense"),
    roundId: id,
    expenseId: id.optional(),
    fairId: z.string().max(80).default(""),
    date,
    description: z.string().trim().min(1).max(200),
    amount: money,
    category: z.enum(["Insumos", "Equipe", "Transporte", "Outros"]),
    ...correction,
  }),
  z.object({
    kind: z.literal("expense-cancel"),
    roundId: id,
    expenseId: id,
    reason: z.string().trim().min(3).max(300),
  }),
  z.object({
    kind: z.literal("settings"),
    settings: stateSchema._def.schema.shape.settings,
  }),
  z.object({
    kind: z.literal("catalog"),
    flavors: z.array(flavorSchema).min(1).max(100),
  }),
]);
export type Operation = z.infer<typeof operationSchema>;
export function localClock(now: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const p = Object.fromEntries(parts.map((v) => [v.type, v.value]));
  return {
    day: `${p.year}-${p.month}-${p.day}`,
    minutes: Number(p.hour) * 60 + Number(p.minute),
    time: `${p.hour}:${p.minute}`,
    weekday: new Date(`${p.year}-${p.month}-${p.day}T12:00:00Z`).getUTCDay(),
  };
}
const minutes = (t: string) =>
  Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
export function hasStarted(f: Fair, now: Date) {
  const c = localClock(now);
  return (
    c.day > f.date ||
    (c.day === f.date &&
      f.startTime !== null &&
      c.minutes >= minutes(f.startTime))
  );
}
export function closingOpen(f: Fair, now: Date) {
  return localClock(now).day >= f.date;
}
export function loadLocked(f: Fair, now: Date) {
  return f.returnSealed || f.cash.closed || hasStarted(f, now);
}
export function fairPhase(f: Fair, now: Date) {
  if (f.returnSealed && f.cash.closed) return "concluida";
  if (f.returnSealed) return "fechamento";
  const c = localClock(now);
  if (
    c.day > f.date ||
    (c.day === f.date &&
      f.closeTime !== null &&
      c.minutes >= minutes(f.closeTime))
  )
    return "fechamento";
  if (c.day === f.date && f.loadConfirmed) return "em_feira";
  return f.loadConfirmed ? "preparacao" : "carga_pendente";
}
export function productionOpen(r: Round, now: Date) {
  const day = r.productionDay || r.start;
  return (
    r.status === "aberta" && !r.productionClosed && localClock(now).day >= day
  );
}
export const keyFor = (
  roundId: string,
  kind: string,
  day: string,
  flavorId = "",
  fairId = "",
) => [roundId, kind, day, flavorId, fairId].join("|");
export const baseFlavors = (s: State) =>
  s.flavors.filter((f) => f.active && f.prepKind === "base");
export const daySealed = (s: State, r: Round, day: string) =>
  r.productionClosed ||
  s.records.some((e) => e.key === keyFor(r.id, "seal-production", day));
export const requiredReturns = (f: Fair, s?: State) =>
  f.lines.filter(
    (l) =>
      l.taken > 0 ||
      l.adjustment !== 0 ||
      l.returned > 0 ||
      !!s?.flavors.some(
        (x) => x.id === l.flavorId && x.active && x.prepKind === "na_feira",
      ),
  );
export function taskFor(
  s: State,
  r: Round | undefined,
  now: Date,
): {
  kind:
    | "production"
    | "allocation"
    | "return"
    | "cash"
    | "consult"
    | "done"
    | "waiting";
  fairId?: string;
  title: string;
  subtitle: string;
} {
  if (!r)
    return {
      kind: "waiting",
      title: "Prepare a próxima semana.",
      subtitle: "Escolha o dia de produção e organize as três feiras.",
    };
  if (r.status === "concluida") {
    const cash = r.fairs.find((f) => !f.cash.closed);
    return cash
      ? {
          kind: "cash",
          fairId: cash.id,
          title: "A operação está concluída.",
          subtitle: `O caixa da ${cash.name} pode ser registrado agora.`,
        }
      : {
          kind: "done",
          title: "Semana concluída.",
          subtitle: "Produção, retornos e caixas guardados no histórico.",
        };
  }
  const c = localClock(now),
    f =
      r.fairs.find((f) => f.date === c.day) ||
      r.fairs.find((f) => f.date < c.day && !f.returnSealed);
  if (f) {
    if (!f.returnSealed && closingOpen(f, now))
      return {
        kind: "return",
        fairId: f.id,
        title: "Registre o retorno da feira.",
        subtitle: f.name,
      };
    if (!f.cash.closed)
      return {
        kind: "cash",
        fairId: f.id,
        title: "Registre os recebimentos.",
        subtitle: f.name,
      };
    return {
      kind: "done",
      fairId: f.id,
      title: "Feira registrada.",
      subtitle: f.name,
    };
  }
  if (!daySealed(s, r, r.productionDay || r.start) && productionOpen(r, now))
    return {
      kind: "production",
      title: "Um sabor por vez.",
      subtitle: "Conte o que foi produzido, separe para as feiras e confirme.",
    };
  const future = r.fairs.find((f) => f.date >= c.day && !f.loadConfirmed);
  if (future)
    return {
      kind: "allocation",
      fairId: future.id,
      title: "Confira a próxima carga.",
      subtitle: future.name,
    };
  const cash = r.fairs.find((f) => f.date < c.day && !f.cash.closed);
  if (cash)
    return {
      kind: "cash",
      fairId: cash.id,
      title: "O caixa pode ficar em dia.",
      subtitle: cash.name,
    };
  if (r.fairs.every((f) => f.returnSealed))
    return {
      kind: "done",
      title: "Os três retornos estão salvos.",
      subtitle: "Você já pode concluir a operação desta rodada.",
    };
  return {
    kind: "waiting",
    title: "Sua semana está organizada.",
    subtitle: "Confira as cargas e acompanhe as próximas feiras.",
  };
}
function refuse(message: string): never {
  throw new Error(message);
}
function admin(c: Context) {
  if (c.role !== "admin")
    refuse("Essa configuração é exclusiva do administrador.");
}
function record(
  s: State,
  c: Context,
  r: Round,
  kind: "production" | "allocation" | "return" | "cash" | "seal",
  key: string,
  day: string,
  flavorId: string,
  fairId: string,
  values: Record<string, unknown>,
) {
  const old = s.records.find((e) => e.key === key);
  const next = {
    id: old?.id || uid(),
    key,
    kind,
    roundId: r.id,
    flavorId,
    fairId,
    day,
    savedAt: c.now.toISOString(),
    savedBy: c.name,
    revision: (old?.revision || 0) + 1,
    values,
  };
  s.records = old
    ? s.records.map((e) => (e.key === key ? next : e))
    : [...s.records, next];
  return next;
}
function checkCorrection(
  op: { correction?: boolean; reason?: string },
  allowed: boolean,
  c: Context,
) {
  if (!op.correction || !op.reason || op.reason.trim().length < 3)
    refuse("Abra uma correção e informe o motivo.");
  if (!allowed && c.role !== "admin")
    refuse("Peça ao administrador a correção desta feira encerrada.");
}
export function applyOperation(
  input: State,
  raw: unknown,
  c: Context,
): { state: State; action: string; receipt?: State["records"][number] } {
  const op = operationSchema.parse(raw),
    s = stateSchema.parse(structuredClone(input)),
    clock = localClock(c.now);
  let action = "",
    receipt: State["records"][number] | undefined;
  if (op.kind === "round") {
    const start = weekStart(op.start),
      day = op.productionDay || op.start;
    if (day !== start && day !== addDays(start, 1))
      refuse("Escolha quarta ou quinta para a produção.");
    if (s.rounds.some((r) => r.start === start))
      refuse("Já existe uma rodada nesta semana.");
    const r = newRound(s.flavors, start, undefined, day);
    for (const t of s.settings.schedules) {
      const offset = { sexta: 2, sabado: 3, domingo: 4 }[t.key];
      const f = newFair(r, s.flavors, t.name, addDays(start, offset), t.key);
      f.transport = t.region;
      f.team = "Robson e Erly";
      f.startTime = t.startTime;
      f.closeTime = t.closeTime;
      r.fairs.push(f);
    }
    s.rounds.push(r);
    action = "Abrir rodada";
  } else if (op.kind === "settings") {
    admin(c);
    if (new Set(op.settings.schedules.map((f) => f.key)).size !== 3)
      refuse("Configure as três feiras.");
    for (const f of op.settings.schedules) {
      if (f.startTime && f.closeTime && f.closeTime <= f.startTime)
        refuse("O encerramento deve ser depois do início.");
      f.offset = { sexta: 2, sabado: 3, domingo: 4 }[f.key];
    }
    s.settings = op.settings;
    for (const r of s.rounds.filter((r) => r.status === "aberta"))
      for (const f of r.fairs) {
        const t = s.settings.schedules.find((t) => t.key === f.scheduleKey);
        if (t && !hasStarted(f, c.now)) {
          f.startTime = t.startTime;
          f.closeTime = t.closeTime;
        }
      }
    action = "Configurar horários";
  } else if (op.kind === "catalog") {
    admin(c);
    for (const old of s.flavors)
      if (!op.flavors.some((f) => f.id === old.id))
        refuse("Inative o sabor para preservar o histórico.");
    s.flavors = op.flavors;
    for (const r of s.rounds.filter((r) => r.status === "aberta"))
      for (const flavor of s.flavors.filter((f) => f.active)) {
        if (!r.production.some((p) => p.flavorId === flavor.id))
          r.production.push({ flavorId: flavor.id, planned: 0, produced: 0 });
        for (const f of r.fairs.filter((f) => !loadLocked(f, c.now)))
          if (!f.lines.some((l) => l.flavorId === flavor.id))
            f.lines.push({
              flavorId: flavor.id,
              planned: 0,
              taken: 0,
              returned: 0,
              reusable: 0,
              loss: 0,
              adjustment: 0,
              soldOut: false,
              price: f.scheduleKey
                ? (flavor.prices[f.scheduleKey] ?? flavor.price)
                : flavor.price,
            });
      }
    action = "Atualizar sabores e preços";
  } else {
    const r = s.rounds.find((r) => r.id === op.roundId);
    if (!r) refuse("Rodada não encontrada.");
    if (op.kind === "reopen-round") {
      admin(c);
      r.status = "aberta";
      action = "Reabrir rodada: " + op.reason;
    } else {
      if (
        r.status === "concluida" &&
        !["cash", "expense", "expense-cancel"].includes(op.kind)
      )
        refuse(
          "A operação está concluída. Peça a reabertura ao administrador.",
        );
      if (op.kind === "production-day") {
        admin(c);
        if (
          s.records.some((e) => e.roundId === r.id && e.kind === "production")
        )
          refuse(
            "A produção já tem registros. Preserve o dia e faça uma correção.",
          );
        if (op.day !== r.start && op.day !== addDays(r.start, 1))
          refuse("Escolha quarta ou quinta.");
        r.productionDay = op.day;
        r.legacyProduction = false;
        action = "Escolher dia de produção";
      } else if (op.kind === "production") {
        if (op.day > clock.day) refuse("O dia de produção ainda não chegou.");
        if (
          op.day < r.start ||
          op.day > r.end ||
          ![3, 4].includes(new Date(op.day + "T12:00:00Z").getUTCDay())
        )
          refuse("Use o dia de produção da rodada.");
        if (!r.legacyProduction && op.day !== r.productionDay)
          refuse("Esta rodada tem um único dia de produção.");
        if (daySealed(s, r, op.day) || r.legacyProduction)
          checkCorrection(op, clock.day <= r.end, c);
        const p = r.production.find((p) => p.flavorId === op.flavorId);
        if (!p) refuse("Sabor não faz parte da rodada.");
        if (s.flavors.find((f) => f.id === op.flavorId)?.prepKind !== "base")
          refuse("Este sabor é preparado na feira.");
        const existing = s.records.find(
          (e) => e.key === keyFor(r.id, "production", op.day, op.flavorId),
        );
        p.produced =
          p.produced - Number(existing?.values.produced || 0) + op.produced;
        p.planned = op.planned;
        receipt = record(
          s,
          c,
          r,
          "production",
          keyFor(r.id, "production", op.day, op.flavorId),
          op.day,
          op.flavorId,
          "",
          { produced: op.produced, planned: op.planned },
        );
        action = "Salvar produção";
      } else if (op.kind === "allocation") {
        if (op.day !== (r.productionDay || r.start))
          refuse("Use o dia de produção escolhido.");
        if (op.day > clock.day) refuse("O dia de produção ainda não chegou.");
        if (daySealed(s, r, op.day)) checkCorrection(op, clock.day <= r.end, c);
        if (
          new Set(op.allocations.map((a) => a.fairId)).size !== r.fairs.length
        )
          refuse("Informe as três feiras, incluindo zero.");
        for (const a of op.allocations) {
          const f = r.fairs.find((f) => f.id === a.fairId);
          if (!f) refuse("Feira inexistente.");
          const l = f.lines.find((l) => l.flavorId === op.flavorId);
          if (!l) refuse("Sabor não encontrado.");
          if (l.taken !== a.quantity && loadLocked(f, c.now))
            checkCorrection(op, false, c);
          if (
            !s.records.some(
              (e) =>
                e.kind === "allocation" &&
                e.flavorId === op.flavorId &&
                e.roundId === r.id,
            )
          ) {
            const flavor = s.flavors.find((v) => v.id === op.flavorId)!;
            l.price = f.scheduleKey
              ? (flavor.prices[f.scheduleKey] ?? flavor.price)
              : flavor.price;
          }
          l.taken = a.quantity;
          l.planned = a.quantity;
        }
        receipt = record(
          s,
          c,
          r,
          "allocation",
          keyFor(r.id, "allocation", op.day, op.flavorId),
          op.day,
          op.flavorId,
          "",
          { allocations: op.allocations },
        );
        action = "Salvar separação";
      } else if (op.kind === "seal-production") {
        if (op.day !== (r.productionDay || r.start) || op.day > clock.day)
          refuse("Use o dia de produção escolhido.");
        if (daySealed(s, r, op.day)) refuse("A produção já está concluída.");
        for (const flavor of baseFlavors(s))
          for (const kind of ["production", "allocation"])
            if (
              !s.records.some(
                (e) => e.key === keyFor(r.id, kind, op.day, flavor.id),
              )
            )
              refuse(
                "Salve contagem e separação de todos os sabores, incluindo zero.",
              );
        r.productionClosed = true;
        receipt = record(
          s,
          c,
          r,
          "seal",
          keyFor(r.id, "seal-production", op.day),
          op.day,
          "",
          "",
          { phase: "production", count: baseFlavors(s).length },
        );
        action = "Concluir produção";
      } else if (op.kind === "close-round") {
        if (r.fairs.some((f) => !f.returnSealed))
          refuse("Conclua os três retornos primeiro.");
        r.status = "concluida";
        receipt = record(
          s,
          c,
          r,
          "seal",
          keyFor(r.id, "seal-round", r.start),
          clock.day,
          "",
          "",
          {
            phase: "round",
            pendingCash: r.fairs.filter((f) => !f.cash.closed).length,
          },
        );
        action = "Concluir operação da rodada";
      } else if (op.kind === "expense") {
        if (op.fairId && !r.fairs.some((f) => f.id === op.fairId))
          refuse("Feira não encontrada.");
        const old = op.expenseId
          ? s.expenses.find((e) => e.id === op.expenseId && e.roundId === r.id)
          : undefined;
        if (op.expenseId && !old) refuse("Gasto não encontrado.");
        if (old) checkCorrection(op, true, c);
        const expense = {
          id: old?.id || uid(),
          roundId: r.id,
          fairId: op.fairId,
          date: op.date,
          category: op.category,
          description: op.description,
          amount: op.amount,
        };
        s.expenses = old
          ? s.expenses.map((e) => (e.id === old.id ? expense : e))
          : [...s.expenses, expense];
        action =
          (old ? "Corrigir gasto: " : "Registrar gasto: ") + op.description;
      } else if (op.kind === "expense-cancel") {
        if (
          !s.expenses.some((e) => e.id === op.expenseId && e.roundId === r.id)
        )
          refuse("Gasto não encontrado.");
        s.expenses = s.expenses.filter((e) => e.id !== op.expenseId);
        action = "Cancelar gasto: " + op.reason;
      } else {
        const f = r.fairs.find((f) => f.id === op.fairId);
        if (!f) refuse("Feira não encontrada.");
        if (op.kind === "load") {
          const l = f.lines.find((l) => l.flavorId === op.flavorId);
          if (!l) refuse("Sabor não encontrado.");
          if (loadLocked(f, c.now)) checkCorrection(op, false, c);
          l.taken = op.taken;
          if (op.price !== undefined) l.price = op.price;
          f.loadConfirmed = false;
          receipt = record(
            s,
            c,
            r,
            "allocation",
            keyFor(r.id, "load", f.date, op.flavorId, f.id),
            f.date,
            op.flavorId,
            f.id,
            { taken: op.taken, price: l.price, planned: l.planned },
          );
          action = "Conferir carga da " + f.name;
        } else if (op.kind === "confirm-load") {
          if (loadLocked(f, c.now))
            refuse("Esta feira já foi encerrada ou iniciada.");
          f.loadConfirmed = true;
          receipt = record(
            s,
            c,
            r,
            "seal",
            keyFor(r.id, "confirm-load", f.date, "", f.id),
            f.date,
            "",
            f.id,
            { phase: "load" },
          );
          action = "Confirmar carga da " + f.name;
        } else {
          if (!closingOpen(f, c.now))
            refuse("Registre o retorno ou caixa a partir do dia desta feira.");
          if (op.kind === "return") {
            if (f.returnSealed) checkCorrection(op, clock.day <= r.end, c);
            const l = f.lines.find((l) => l.flavorId === op.flavorId);
            if (!l) refuse("Sabor não encontrado.");
            if (op.reusable > op.returned)
              refuse("Reaproveitamento maior que o retorno.");
            f.status = "em_feira";
            Object.assign(l, {
              returned: op.returned,
              reusable: op.reusable,
              loss: op.loss,
              adjustment: op.adjustment,
              soldOut: op.soldOut,
            });
            receipt = record(
              s,
              c,
              r,
              "return",
              keyFor(r.id, "return", f.date, op.flavorId, f.id),
              f.date,
              op.flavorId,
              f.id,
              {
                returned: op.returned,
                reusable: op.reusable,
                loss: op.loss,
                adjustment: op.adjustment,
                soldOut: op.soldOut,
              },
            );
            if (f.returnSealed) f.status = "retorno";
            action = "Salvar retorno";
          } else if (op.kind === "cash") {
            if (f.cash.closed) checkCorrection(op, true, c);
            if (f.status === "planejada") f.status = "em_feira";
            f.cash = {
              closed: true,
              float: op.float,
              cash: op.cash,
              pix: op.pix,
              card: op.card,
              withdrawal: op.withdrawal,
            };
            receipt = record(
              s,
              c,
              r,
              "cash",
              keyFor(r.id, "cash", f.date, "", f.id),
              f.date,
              "",
              f.id,
              { ...f.cash },
            );
            action = "Salvar caixa";
          } else if (op.kind === "seal-return") {
            if (f.returnSealed) refuse("Retorno já concluído.");
            for (const l of requiredReturns(f, s))
              if (
                !s.records.some(
                  (e) =>
                    e.key === keyFor(r.id, "return", f.date, l.flavorId, f.id),
                )
              )
                refuse(
                  "Registre todos os sabores levados ou preparados na feira, incluindo zero.",
                );
            f.status = "retorno";
            f.returnSealed = true;
            receipt = record(
              s,
              c,
              r,
              "seal",
              keyFor(r.id, "seal-return", f.date, "", f.id),
              f.date,
              "",
              f.id,
              { phase: "return", count: requiredReturns(f, s).length },
            );
            action = "Concluir retorno";
          }
        }
      }
    }
  }
  if ("correction" in op && op.correction)
    action += " · correção: " + op.reason;
  return { state: stateSchema.parse(s), action, receipt };
}
