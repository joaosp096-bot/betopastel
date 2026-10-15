"use client";
import { useState, useEffect, type ReactNode } from "react";
import {
  ArrowRight,
  Check,
  ChevronRight,
  ChefHat,
  Store,
  Wallet,
  Plus,
  ReceiptText,
  Paperclip,
  ExternalLink,
  Trash2,
  CalendarDays,
  Users,
  Info,
  Settings,
  TrendingUp,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  State,
  Round,
  Flavor,
  stats,
  moneyText,
  dateText,
  addDays,
  cashTotal,
} from "@/lib/model";
import type { Operation, Actor } from "@/lib/workflow";
import { localClock } from "@/lib/workflow";
import { FoodFace } from "./FoodCard";
import { descriptions, flavorIndex } from "@/lib/flavor-identity";

type Save = (op: Operation) => Promise<boolean>;
type Common = {
  state: State;
  round: Round | undefined;
  save: Save;
  busy: boolean;
  now: Date;
  error: string;
  onDirty: (dirty: boolean, source?: string) => void;
};
export type Destination =
  | "hoje"
  | "producao"
  | "feiras"
  | "caixa"
  | "historico"
  | "configurar";
const num = (v: string) => (v === "" ? null : Number(v));
const sum = (a: number[]) => a.reduce((n, v) => n + v, 0);
function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
function Count({
  label,
  value,
  onChange,
  required = true,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  required?: boolean;
}) {
  return (
    <input
      aria-label={label}
      type="number"
      inputMode="numeric"
      min="0"
      max="1000000"
      step="1"
      required={required}
      value={value ?? ""}
      onChange={(e) => onChange(num(e.target.value))}
    />
  );
}
function Amount({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label}>
      <div className="moneyinput">
        <span>R$</span>
        <input
          aria-label={label}
          inputMode="decimal"
          required
          value={value}
          placeholder="0,00"
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </Field>
  );
}
function cents(v: string) {
  const normalized = v.trim().replace(/\./g, "").replace(",", ".");
  return /^\d+(\.\d{1,2})?$/.test(normalized)
    ? Math.round(Number(normalized) * 100)
    : NaN;
}
const cashString = (n: number) => ((n || 0) / 100).toFixed(2).replace(".", ",");
function Status({ done, children }: { done: boolean; children: ReactNode }) {
  return (
    <span className={"m-status " + (done ? "is-done" : "")}>
      {done && <Check size={13} />} {children}
    </span>
  );
}
function InlineError({ message }: { message: string }) {
  return message ? (
    <p className="formerror" role="alert">
      {message}
    </p>
  ) : null;
}
export function Management({
  screen,
  onNavigate,
  onNewWeek,
  onExpense,
  onSelectWeek,
  ...p
}: Common & {
  screen: Destination;
  onNavigate: (s: Destination) => void;
  onNewWeek: () => void;
  onExpense: (id?: string) => void;
  onSelectWeek: (id: string) => void;
}) {
  return (
    <div className="management" data-area={screen}>
      <div data-panel="hoje" hidden={screen !== "hoje"}>
        <Dashboard
          {...p}
          onNavigate={onNavigate}
          onNewWeek={onNewWeek}
          onExpense={onExpense}
          onSelectWeek={onSelectWeek}
        />
      </div>
      <div data-panel="producao" hidden={screen !== "producao"}>
        <Production
          {...p}
          onConfigure={() => onNavigate("configurar")}
          onDirty={(dirty) => p.onDirty(dirty, "production")}
          onNewWeek={onNewWeek}
        />
      </div>
      <div data-panel="caixa" hidden={screen !== "caixa"}>
        <Finance
          {...p}
          onDirty={(dirty) => p.onDirty(dirty, "finance")}
          onExpense={onExpense}
        />
      </div>
    </div>
  );
}
function Dashboard({
  state,
  round,
  onNavigate,
  onNewWeek,
  onExpense,
  onSelectWeek,
}: Common & {
  onNavigate: (s: Destination) => void;
  onNewWeek: () => void;
  onExpense: () => void;
  onSelectWeek: (id: string) => void;
}) {
  const m = stats(round, state),
    done =
      round?.weeklyReturn?.closed || round?.fairs.every((f) => f.returnSealed),
    cashDone =
      round?.weeklyCash?.closed || round?.fairs.every((f) => f.cash.closed),
    next = !round
      ? "start"
      : !round.productionClosed
        ? "production"
        : !done
          ? "return"
          : !cashDone
            ? "cash"
            : "done";
  const title = {
    start: "Vamos preparar a semana?",
    production: state.flavors
      .filter((f) => f.active && f.prepKind === "base")
      .every((f) =>
        state.settings.productionTemplate.some((t) => t.flavorId === f.id),
      )
      ? "O padrão está pronto para conferir."
      : "Vamos conferir a produção?",
    return: "Três feiras. Uma contagem final.",
    cash: "Falta conferir o caixa.",
    done: "Semana guardada no histórico.",
  }[next];
  const action = {
    start: "Iniciar semana",
    production: "Conferir produção",
    return: "Consultar feiras e sobras",
    cash: "Fechar caixa",
    done: "Ver histórico",
  }[next];
  const expenses = state.expenses.filter(
      (e) => !e.cancelled && (round ? e.roundId === round.id : true),
    ),
    pending = expenses.filter((e) => e.status === "pendente");
  const completed = state.rounds
      .filter((r) => r.weeklyReturn?.closed)
      .sort((a, b) => a.start.localeCompare(b.start))
      .slice(-8),
    max = Math.max(1, ...completed.map((r) => stats(r, state).produced));
  const days = [
    {
      label: "Produção",
      date: round?.productionDay,
      done: !!round?.productionClosed,
      icon: ChefHat,
      target: "producao",
    },
    ...state.settings.schedules.map((f, i) => ({
      label: f.name.replace("Feira dos ", "").replace("Feira de ", ""),
      date: round?.fairs.find((x) => x.scheduleKey === f.key)?.date,
      done: !!done,
      icon: Store,
      target: "feiras",
    })),
  ];
  return (
    <>
      <section className="m-hero" aria-label="Próximo passo da semana">
        <div className="m-hero-copy">
          <h2>{title}</h2>
          <p>
            {!round
              ? "Um dia de produção, três feiras e os registros do seu negócio."
              : next === "production"
                ? "Confirme as quantidades e quem participou. Ajuste só o que mudou."
                : next === "return"
                  ? "Consulte as cargas durante as feiras. Conte as sobras no domingo ou na segunda."
                  : next === "cash"
                    ? "Registre dinheiro, Pix, débito e crédito quando estiver com os totais em mãos."
                    : "Produção e contagem concluídas. Os gastos continuam disponíveis."}
          </p>
          <button
            className="btn"
            onClick={() =>
              !round
                ? onNewWeek()
                : onNavigate(
                    next === "production"
                      ? "producao"
                      : next === "return"
                        ? "feiras"
                        : next === "cash"
                          ? "caixa"
                          : "historico",
                  )
            }
          >
            {action}
            <ArrowRight size={18} />
          </button>
        </div>
        <figure>
          <img
            src="/images/sabores/carne-queijo.webp"
            width="900"
            height="900"
            alt="Pastel de carne com queijo aberto ao meio"
          />
          <figcaption>Imagem ilustrativa</figcaption>
        </figure>
      </section>
      <div className="m-weekpath" aria-label="Rotina da semana">
        {days.map((d) => (
          <button
            key={d.label}
            onClick={() => onNavigate(d.target as Destination)}
          >
            <d.icon size={19} />
            <span>
              <strong>{d.label}</strong>
              <small>
                {d.date
                  ? new Date(d.date + "T12:00:00Z").toLocaleDateString(
                      "pt-BR",
                      { weekday: "short", day: "2-digit", month: "2-digit" },
                    )
                  : d.target === "producao"
                    ? "Quarta ou quinta"
                    : ["Amarais", "Nova Odessa", "Morungaba"].indexOf(
                          d.label,
                        ) === 0
                      ? "Sexta"
                      : d.label === "Nova Odessa"
                        ? "Sábado"
                        : "Domingo"}
              </small>
            </span>
            {d.done ? (
              <Check className="m-check" size={17} />
            ) : (
              <ChevronRight size={16} />
            )}
          </button>
        ))}
      </div>
      <section className="m-numbers" aria-label="Resumo da semana">
        <div>
          <span>Produção confirmada</span>
          <strong>
            {round?.productionClosed ? m.produced.toLocaleString("pt-BR") : "—"}
            <small>pastéis da base</small>
          </strong>
        </div>
        <div>
          <span>Sobras da semana</span>
          <strong>
            {done ? m.returned.toLocaleString("pt-BR") : "—"}
            <small>
              {done ? "contagem registrada" : "aguardando contagem"}
            </small>
          </strong>
        </div>
        <div>
          <span>Movimentação informada</span>
          <strong>
            {m.cashCount ? moneyText(m.gross) : "—"}
            <small>
              {cashDone
                ? "caixa completo"
                : m.cashCount
                  ? "caixa parcial"
                  : "caixa a registrar"}
            </small>
          </strong>
        </div>
      </section>
      <div className="m-dashboard-columns">
        <section>
          <div className="sectionhead">
            <h2>As três feiras</h2>
            <button className="textbtn" onClick={() => onNavigate("feiras")}>
              Consultar
              <ArrowRight size={16} />
            </button>
          </div>
          <div className="m-market-list">
            {state.settings.schedules.map((f) => {
              const fair = round?.fairs.find((x) => x.scheduleKey === f.key);
              return (
                <button key={f.key} onClick={() => onNavigate("feiras")}>
                  <span className="m-market-day">
                    {f.key === "sexta"
                      ? "Sex"
                      : f.key === "sabado"
                        ? "Sáb"
                        : "Dom"}
                  </span>
                  <span>
                    <strong>{f.name}</strong>
                    <small>{f.region}</small>
                  </span>
                  <Status done={!!fair?.loadConfirmed}>
                    {fair?.loadConfirmed
                      ? "Carga conferida"
                      : round?.productionClosed
                        ? "Separação registrada"
                        : "A preparar"}
                  </Status>
                </button>
              );
            })}
          </div>
        </section>
        <section className="m-spending">
          <div className="sectionhead">
            <h2>Gastos em dia</h2>
            <ReceiptText size={20} />
          </div>
          <strong className="m-spending-total">
            {moneyText(sum(expenses.map((e) => e.amount)))}
          </strong>
          <p>
            {round
              ? "Gastos vinculados à semana selecionada."
              : "Gastos registrados, mesmo sem produção aberta."}
          </p>
          {pending.length > 0 && (
            <p className="m-payable">
              {moneyText(sum(pending.map((e) => e.amount)))} a pagar
            </p>
          )}
          <button className="btn secondary" onClick={() => onExpense()}>
            <Plus size={17} />
            Registrar gasto
          </button>
        </section>
      </div>
      <section className="m-evolution">
        <div className="sectionhead">
          <h2>O ritmo das semanas</h2>
          <button className="textbtn" onClick={() => onNavigate("historico")}>
            Abrir histórico
            <ArrowRight size={16} />
          </button>
        </div>
        {completed.length ? (
          <>
            <p className="sectionhint">
              Produção da base e sobras finais. Apenas semanas com contagem
              consolidada.
            </p>
            <div
              className="m-chart"
              role="list"
              aria-label="Produção e sobras por semana"
            >
              {completed.map((r) => {
                const v = stats(r, state);
                return (
                  <button
                    key={r.id}
                    role="listitem"
                    onClick={() => onSelectWeek(r.id)}
                    aria-label={`Semana de ${dateText(r.start)}: ${v.produced} produzidos na base, ${v.returned} sobras totais. Abrir semana.`}
                  >
                    <span>{dateText(r.start)}</span>
                    <span className="m-bars">
                      <span style={{ width: (100 * v.produced) / max + "%" }} />
                      <span
                        className="m-leftover-bar"
                        style={{
                          width: Math.min(100, (100 * v.returned) / max) + "%",
                        }}
                      />
                    </span>
                    <strong>
                      {v.produced}
                      <small>{v.returned} sobras</small>
                    </strong>
                  </button>
                );
              })}
            </div>
            <p className="m-chart-key">
              <span />
              Produção da base <span />
              Sobras totais, incluindo preparo na feira
            </p>
          </>
        ) : (
          <div className="m-empty-chart">
            <TrendingUp size={28} />
            <div>
              <h3>O histórico começa com a primeira contagem.</h3>
              <p>
                Quando as semanas forem fechadas, compare produção e sobras
                aqui.
              </p>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
type Template = State["settings"]["productionTemplate"];
function makeProduction(state: State, r?: Round): Template {
  return state.flavors
    .filter((f) => f.active && f.prepKind === "base")
    .map((f) => {
      const p = r?.production.find((p) => p.flavorId === f.id),
        t = state.settings.productionTemplate.find((t) => t.flavorId === f.id);
      const allocation = (key: "sexta" | "sabado" | "domingo") => {
        const l = r?.fairs
          .find((x) => x.scheduleKey === key)
          ?.lines.find((l) => l.flavorId === f.id);
        return r
          ? r.productionClosed
            ? l?.taken || 0
            : l?.planned || 0
          : t?.allocations[key] || 0;
      };
      return {
        flavorId: f.id,
        quantity: r
          ? r.productionClosed
            ? p?.produced || 0
            : p?.planned || 0
          : t?.quantity || 0,
        allocations: {
          sexta: allocation("sexta"),
          sabado: allocation("sabado"),
          domingo: allocation("domingo"),
        },
      };
    });
}
function Production({
  state,
  round,
  save,
  busy,
  error,
  now,
  onDirty,
  onConfigure,
  onNewWeek,
}: Common & { onConfigure: () => void; onNewWeek: () => void }) {
  const [lines, setLines] = useState<Template>([]),
    [contributors, setContributors] = useState(""),
    [edit, setEdit] = useState(false),
    [reason, setReason] = useState(""),
    [localError, setLocalError] = useState(""),
    [dirty, setDirty] = useState(false);
  useEffect(() => {
    setLines(makeProduction(state, round));
    setContributors(round?.contributors.join(", ") || "");
    setDirty(false);
    setEdit(false);
    setReason("");
  }, [round?.id]);
  useEffect(() => {
    if (!dirty && !edit) setLines(makeProduction(state, round));
  }, [state.settings.productionTemplate, round?.productionClosed]);
  const configured = state.flavors
      .filter((f) => f.active && f.prepKind === "base")
      .every((f) =>
        state.settings.productionTemplate.some((t) => t.flavorId === f.id),
      ),
    confirmed = !!round?.productionClosed;
  const change = (fn: (a: Template) => Template) => {
    setLines(fn);
    setDirty(true);
    onDirty(true);
  };
  if (!round)
    return (
      <div className="empty">
        <ChefHat size={35} />
        <h2>Comece pela semana de produção.</h2>
        <p>Quarta ou quinta: o mesmo padrão, uma confirmação.</p>
        <button className="btn" onClick={onNewWeek}>
          Iniciar semana
        </button>
      </div>
    );
  return (
    <form
      className="m-production"
      onSubmit={async (e) => {
        e.preventDefault();
        setLocalError("");
        const names = contributors
          .split(/[,;\n]/)
          .map((n) => n.trim())
          .filter(Boolean);
        if (!names.length) {
          setLocalError("Informe quem participou da produção.");
          return;
        }
        if (!configured && !confirmed) {
          setLocalError(
            "Defina as quantidades reais em Configurações antes de confirmar a primeira produção.",
          );
          return;
        }
        if (
          await save({
            kind: "production-confirm",
            roundId: round.id,
            day: round.productionDay || round.start,
            contributors: names,
            lines,
            correction: confirmed,
            reason,
          })
        ) {
          setEdit(false);
          setDirty(false);
          onDirty(false);
        }
      }}
    >
      <div className="m-production-head">
        <div>
          <Status done={confirmed}>
            {confirmed ? "Produção confirmada" : "Conferência da produção"}
          </Status>
          <h2>
            {sum(lines.map((l) => l.quantity)).toLocaleString("pt-BR")}{" "}
            <span>pastéis na base</span>
          </h2>
          <p>
            {dateText(round.productionDay || round.start)} ·{" "}
            {confirmed
              ? "Quantidade realizada e registrada."
              : "Confira o padrão. A previsão de preparo na feira fica separada."}
          </p>
        </div>
        <div className="m-production-actions">
          {!confirmed && configured && (
            <button
              className="textbtn"
              type="button"
              onClick={() => {
                setLines(
                  state.settings.productionTemplate.filter((t) =>
                    state.flavors.some(
                      (f) =>
                        f.id === t.flavorId &&
                        f.active &&
                        f.prepKind === "base",
                    ),
                  ),
                );
                setDirty(true);
                onDirty(true);
              }}
            >
              Usar padrão atual nesta semana
            </button>
          )}
          <button
            className="btn secondary"
            type="button"
            onClick={() => setEdit(!edit)}
          >
            {edit
              ? "Voltar à conferência"
              : confirmed
                ? "Corrigir produção"
                : "Ajustar esta semana"}
          </button>
        </div>
      </div>
      {!configured && !confirmed && (
        <div className="m-notice">
          <Info size={20} />
          <div>
            <strong>Falta definir o padrão real.</strong>
            <p>
              Cadastre as quantidades uma vez. Nas próximas semanas, será só
              conferir e confirmar.
            </p>
            <button type="button" className="textbtn" onClick={onConfigure}>
              Definir padrão
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}
      <div className="m-production-list">
        {lines.map((l, i) => {
          const f = state.flavors.find((f) => f.id === l.flavorId)!;
          return (
            <article key={l.flavorId}>
              <FoodFace
                flavor={f}
                shared={false}
                index={flavorIndex(f.id, state.flavors.indexOf(f))}
              />
              <div className="m-production-name">
                <h3>{f.name}</h3>
                <p>
                  {descriptions[flavorIndex(f.id, state.flavors.indexOf(f))] ||
                    f.name}
                </p>
                {!edit && (
                  <small>
                    Sex {l.allocations.sexta} · Sáb {l.allocations.sabado} · Dom{" "}
                    {l.allocations.domingo}
                  </small>
                )}
              </div>
              <div className="m-production-qty">
                {edit ? (
                  <Field label="Quantidade">
                    <Count
                      label={"Quantidade de " + f.name}
                      value={l.quantity}
                      onChange={(v) =>
                        change((a) =>
                          a.map((x, j) =>
                            j === i ? { ...x, quantity: v ?? 0 } : x,
                          ),
                        )
                      }
                    />
                  </Field>
                ) : (
                  <strong>
                    {l.quantity}
                    <small>un.</small>
                  </strong>
                )}
              </div>
              {edit && (
                <div className="m-allocations">
                  {(["sexta", "sabado", "domingo"] as const).map((key) => (
                    <Field
                      key={key}
                      label={
                        key === "sexta"
                          ? "Amarais"
                          : key === "sabado"
                            ? "Nova Odessa"
                            : "Morungaba"
                      }
                    >
                      <Count
                        label={f.name + " para " + key}
                        value={l.allocations[key]}
                        onChange={(v) =>
                          change((a) =>
                            a.map((x, j) =>
                              j === i
                                ? {
                                    ...x,
                                    allocations: {
                                      ...x.allocations,
                                      [key]: v ?? 0,
                                    },
                                  }
                                : x,
                            ),
                          )
                        }
                      />
                    </Field>
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </div>
      <div className="m-production-team">
        <Users size={22} />
        <Field
          label="Quem participou?"
          hint="Separe os nomes por vírgula. Não é necessário criar contas."
        >
          <input
            value={contributors}
            readOnly={confirmed && !edit}
            onChange={(e) => {
              setContributors(e.target.value);
              setDirty(true);
              onDirty(true);
            }}
            placeholder="Ex.: Robson, Erly"
            required
          />
        </Field>
      </div>
      {confirmed && edit && (
        <Field label="Motivo da correção">
          <input
            required
            minLength={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </Field>
      )}
      <InlineError message={localError || error} />
      {dirty && (
        <button
          className="textbtn"
          type="button"
          onClick={() => {
            setLines(makeProduction(state, round));
            setContributors(round.contributors.join(", "));
            setReason("");
            setDirty(false);
            setEdit(false);
            onDirty(false);
          }}
        >
          Descartar alterações desta produção
        </button>
      )}
      {(!confirmed || edit) && (
        <div className="m-save-row">
          <p>
            Confirmação única das quantidades e da separação para as três
            feiras.
          </p>
          <button
            className="btn"
            disabled={
              busy || localClock(now).day < (round.productionDay || round.start)
            }
          >
            {busy
              ? "Salvando…"
              : confirmed
                ? "Salvar correção"
                : "Confirmar produção"}
            <Check size={18} />
          </button>
        </div>
      )}
      <section className="m-at-fair">
        <div className="sectionhead">
          <h2>Preparados na feira</h2>
          <Store size={20} />
        </div>
        <p className="sectionhint">
          Médias previstas. A quantidade realmente preparada é confirmada no
          fechamento. Todas as imagens de sabores são ilustrativas.
        </p>
        <div className="m-at-fair-grid">
          {state.flavors
            .filter((f) => f.active && f.prepKind === "na_feira")
            .map((f) => (
              <article key={f.id}>
                <FoodFace
                  flavor={f}
                  index={flavorIndex(f.id, state.flavors.indexOf(f))}
                  shared={false}
                />
                <div>
                  <h3>{f.name}</h3>
                  <p>
                    {descriptions[flavorIndex(f.id, state.flavors.indexOf(f))]}
                  </p>
                  <small>
                    {round?.production.find((p) => p.flavorId === f.id)
                      ?.planned || 0}{" "}
                    previstos na semana
                  </small>
                </div>
              </article>
            ))}
        </div>
      </section>
    </form>
  );
}
export function ProductionTemplate({
  state,
  save,
  busy,
  onDirty,
  error,
}: Omit<Common, "round" | "now"> & { round?: Round; now?: Date }) {
  const [lines, setLines] = useState<Template>([]),
    [dirty, setDirty] = useState(false);
  useEffect(() => {
    if (!dirty)
      setLines(
        state.flavors
          .filter((f) => f.active)
          .map(
            (f) =>
              state.settings.productionTemplate.find(
                (t) => t.flavorId === f.id,
              ) || {
                flavorId: f.id,
                quantity: 0,
                allocations: { sexta: 0, sabado: 0, domingo: 0 },
              },
          ),
      );
  }, [state.flavors, state.settings.productionTemplate, dirty]);
  return (
    <form
      className="m-template"
      onSubmit={async (e) => {
        e.preventDefault();
        if (await save({ kind: "production-template", lines })) {
          setDirty(false);
          onDirty(false);
        }
      }}
    >
      <div className="sectionhead">
        <h2>Padrão de produção</h2>
        <Settings size={20} />
      </div>
      <p className="sectionhint">
        Um padrão para quarta ou quinta. Alterar aqui vale para novas semanas;
        semanas já abertas mantêm sua previsão. Nos sabores de feira, informe a
        média prevista.
      </p>
      <div className="m-template-scroll">
        <table>
          <thead>
            <tr>
              <th>Sabor</th>
              <th>Total</th>
              <th>Amarais</th>
              <th>Nova Odessa</th>
              <th>Morungaba</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => {
              const f = state.flavors.find((f) => f.id === l.flavorId)!;
              return (
                <tr key={l.flavorId}>
                  <th scope="row">
                    {f.name}
                    <small>
                      {f.prepKind === "na_feira"
                        ? "Média na feira"
                        : "Produção na base"}
                    </small>
                  </th>
                  {(["quantity", "sexta", "sabado", "domingo"] as const).map(
                    (k) => (
                      <td key={k}>
                        <Count
                          label={`${f.name}: ${k === "quantity" ? "total" : k}`}
                          value={
                            k === "quantity" ? l.quantity : l.allocations[k]
                          }
                          onChange={(v) => {
                            setDirty(true);
                            onDirty(true);
                            setLines((a) =>
                              a.map((x, j) =>
                                j === i
                                  ? k === "quantity"
                                    ? { ...x, quantity: v ?? 0 }
                                    : {
                                        ...x,
                                        allocations: {
                                          ...x.allocations,
                                          [k]: v ?? 0,
                                        },
                                      }
                                  : x,
                              ),
                            );
                          }}
                        />
                      </td>
                    ),
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <InlineError message={error} />
      <div className="m-save-row">
        <span>
          {sum(
            lines
              .filter(
                (l) =>
                  state.flavors.find((f) => f.id === l.flavorId)?.prepKind ===
                  "base",
              )
              .map((l) => l.quantity),
          )}{" "}
          pastéis na base
        </span>
        {dirty && (
          <button
            className="btn secondary"
            type="button"
            disabled={busy}
            onClick={() => {
              setDirty(false);
              onDirty(false);
            }}
          >
            Cancelar alterações do padrão
          </button>
        )}
        <button className="btn" disabled={busy || !dirty}>
          {busy ? "Salvando…" : "Salvar padrão"}
        </button>
      </div>
    </form>
  );
}
export function WeeklyReturns({
  state,
  round,
  save,
  busy,
  error,
  now,
  onDirty,
}: Common) {
  const [editing, setEditing] = useState(false),
    [rows, setRows] = useState<
      {
        flavorId: string;
        returned: number | null;
        loss: number | null;
        fairProduced: number | null;
      }[]
    >([]),
    [reason, setReason] = useState(""),
    [localError, setLocalError] = useState("");
  useEffect(() => {
    setEditing(false);
    setReason("");
    setRows(
      state.flavors
        .filter((f) =>
          round?.production.some(
            (p) => p.flavorId === f.id && (f.active || p.produced > 0),
          ),
        )
        .map((f) => {
          const old = round?.weeklyReturn?.lines.find(
            (l) => l.flavorId === f.id,
          );
          return {
            flavorId: f.id,
            returned: old?.returned ?? null,
            loss: old?.loss ?? 0,
            fairProduced: old?.fairProduced ?? null,
          };
        }),
    );
  }, [round?.id, round?.weeklyReturn]);
  if (!round || round.returnMode === "feira") return null;
  const closed = !!round.weeklyReturn?.closed,
    last =
      round.fairs
        .map((f) => f.date)
        .sort()
        .at(-1) || round.end,
    can = localClock(now).day >= last;
  return (
    <section className="m-weekly-return">
      <div className="sectionhead">
        <h2>Sobras da semana</h2>
        <Status done={closed}>
          {closed ? "Contagem fechada" : "Domingo ou segunda"}
        </Status>
      </div>
      <p className="sectionhint">
        Uma contagem final por sabor, depois das três feiras. Campo vazio
        continua pendente; zero significa que não sobrou.
      </p>
      {!editing ? (
        <div className="m-return-intro">
          <div>
            <strong>
              {closed
                ? sum(round.weeklyReturn!.lines.map((l) => l.returned)) +
                  " pastéis sobraram"
                : "Conte uma vez, no fim da semana."}
            </strong>
            <p>
              {closed
                ? "Fechamento de " +
                  dateText(round.weeklyReturn!.day) +
                  ". O caixa pode ser fechado em outro momento."
                : can
                  ? "Separe as sobras e informe o que foi preparado na feira."
                  : "As cargas ficam disponíveis para consulta. A contagem abre no domingo."}
            </p>
          </div>
          <button
            className="btn"
            disabled={busy || !can || !round.productionClosed}
            onClick={() => setEditing(true)}
          >
            {closed ? "Corrigir contagem" : "Contar sobras"}
            <ArrowRight size={17} />
          </button>
        </div>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setLocalError("");
            if (rows.some((l) => l.returned === null)) {
              setLocalError("Confira cada sabor. Use zero quando não sobrou.");
              return;
            }
            if (
              await save({
                kind: "weekly-return",
                roundId: round.id,
                day: localClock(now).day,
                lines: rows.map((l) => ({
                  ...l,
                  returned: l.returned!,
                  loss: l.loss || 0,
                })),
                correction: closed,
                reason,
              })
            ) {
              setEditing(false);
              onDirty(false);
            }
          }}
        >
          <div className="m-returns-head">
            <span>Sabor</span>
            <span>Sobrou</span>
            <span>Perdas</span>
          </div>
          {rows.map((l, i) => {
            const f = state.flavors.find((f) => f.id === l.flavorId)!;
            const update = (
              key: "returned" | "loss" | "fairProduced",
              value: number | null,
            ) => {
              setRows((a) =>
                a.map((x, j) => (j === i ? { ...x, [key]: value } : x)),
              );
              onDirty(true);
            };
            return (
              <div className="m-return-row" key={l.flavorId}>
                <div>
                  <strong>{f.name}</strong>
                  <small>
                    {f.prepKind === "base"
                      ? (round.production.find((p) => p.flavorId === f.id)
                          ?.produced || 0) + " produzidos na base"
                      : "Preparado na feira"}
                  </small>
                </div>
                <Count
                  label={"Sobra de " + f.name}
                  value={l.returned}
                  onChange={(v) => update("returned", v)}
                />
                <Count
                  label={"Perda de " + f.name}
                  value={l.loss}
                  onChange={(v) => update("loss", v)}
                />
                {f.prepKind === "na_feira" && (
                  <Field label="Quantidade realmente preparada">
                    <Count
                      label={"Preparados na feira: " + f.name}
                      value={l.fairProduced}
                      onChange={(v) => update("fairProduced", v)}
                    />
                  </Field>
                )}
              </div>
            );
          })}
          <button
            className="textbtn"
            type="button"
            onClick={() => {
              setRows((a) => a.map((l) => ({ ...l, returned: 0 })));
              onDirty(true);
            }}
          >
            Não sobrou nenhum pastel
          </button>
          {closed && (
            <Field label="Motivo da correção">
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                minLength={3}
                required
              />
            </Field>
          )}
          <InlineError message={localError || error} />
          <div className="m-save-row">
            <button
              className="btn secondary"
              type="button"
              onClick={() => {
                setEditing(false);
                onDirty(false);
              }}
            >
              Voltar à consulta
            </button>
            <button className="btn" disabled={busy}>
              {busy
                ? "Salvando…"
                : closed
                  ? "Salvar correção"
                  : "Confirmar contagem semanal"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
function pastelEstimate(state: State, round?: Round) {
  if (!round?.weeklyReturn?.closed) return null;
  let min = 0,
    max = 0,
    missing = false;
  for (const l of round.weeklyReturn.lines) {
    const total =
        l.fairProduced ??
        round.production.find((p) => p.flavorId === l.flavorId)?.produced ??
        0,
      quantity = total - l.returned - l.loss;
    if (!quantity) continue;
    const prices = round.fairs.map(
      (f) => f.lines.find((x) => x.flavorId === l.flavorId)?.price || 0,
    );
    if (prices.some((p) => !p)) {
      missing = true;
      continue;
    }
    min += quantity * Math.min(...prices);
    max += quantity * Math.max(...prices);
  }
  return { min, max, missing };
}
function Finance({
  state,
  round,
  save,
  busy,
  error,
  now,
  onDirty,
  onExpense,
}: Common & { onExpense: (id?: string) => void }) {
  const [tab, setTab] = useState("resumo"),
    [filter, setFilter] = useState("periodo"),
    [category, setCategory] = useState("Todas"),
    [search, setSearch] = useState(""),
    [payId, setPayId] = useState(""),
    [payDate, setPayDate] = useState(localClock(now).day),
    [cancelId, setCancelId] = useState(""),
    [reason, setReason] = useState("");
  const month = localClock(now).day.slice(0, 7),
    expenses = state.expenses
      .filter(
        (e) =>
          !e.cancelled &&
          (filter === "semana"
            ? !!round && e.roundId === round.id
            : filter === "todos"
              ? true
              : e.date.startsWith(month)),
      )
      .filter(
        (e) =>
          (category === "Todas" || e.category === category) &&
          (!search ||
            (e.description + " " + e.supplier)
              .toLocaleLowerCase("pt-BR")
              .includes(search.toLocaleLowerCase("pt-BR"))),
      )
      .sort(
        (a, b) =>
          b.date.localeCompare(a.date) ||
          b.createdAt.localeCompare(a.createdAt),
      );
  const m = stats(round, state),
    est = pastelEstimate(state, round),
    weekExpenses = state.expenses.filter(
      (e) => !e.cancelled && e.roundId === round?.id,
    ),
    byCategory = ["Insumos", "Equipe", "Transporte", "Outros"].map((name) => ({
      name,
      total: sum(
        weekExpenses.filter((e) => e.category === name).map((e) => e.amount),
      ),
    })),
    max = Math.max(1, ...byCategory.map((c) => c.total));
  useEffect(() => {
    const read = () => {
      const part = new URLSearchParams(location.hash.split("?")[1] || "").get(
        "aba",
      );
      if (part && ["resumo", "caixa", "gastos"].includes(part)) setTab(part);
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);
  const changeTab = (t: string) => {
    setTab(t);
    location.hash = "caixa?aba=" + t;
  };
  return (
    <>
      <div className="m-tabs" role="tablist" aria-label="Áreas do financeiro">
        {[
          ["resumo", "Resumo"],
          ["caixa", "Caixa"],
          ["gastos", "Gastos"],
        ].map(([id, label]) => (
          <button
            type="button"
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => changeTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <div hidden={tab !== "resumo"}>
        {!round ? (
          <div className="m-notice">
            <Wallet size={22} />
            <div>
              <h2>Registre o primeiro gasto.</h2>
              <p>
                Você pode começar pelas compras, mesmo sem abrir uma semana de
                produção.
              </p>
              <button className="btn" onClick={() => onExpense()}>
                Registrar gasto
              </button>
            </div>
          </div>
        ) : (
          <>
            <section className="m-finance-summary">
              <div>
                <span>Movimentação informada</span>
                <strong>
                  {m.cashCount ? moneyText(m.gross) : "A registrar"}
                </strong>
                <small>
                  {round.cashMode === "semanal"
                    ? round.weeklyCash?.closed
                      ? "Caixa semanal registrado"
                      : "Caixa semanal a registrar"
                    : m.cashCount === 3
                      ? "Fechamento completo"
                      : m.cashCount + "/3 caixas registrados"}{" "}
                  · não é saldo bancário
                </small>
              </div>
              <div>
                <span>Gastos registrados</span>
                <strong>{moneyText(m.cost)}</strong>
                <small>
                  {moneyText(
                    sum(
                      weekExpenses
                        .filter((e) => e.status === "pendente")
                        .map((e) => e.amount),
                    ),
                  )}{" "}
                  a pagar
                </small>
              </div>
              <div>
                <span>Diferença parcial</span>
                <strong>{m.cashCount ? moneyText(m.net) : "—"}</strong>
                <small>Entradas menos gastos informados</small>
              </div>
            </section>
            <p className="m-financial-note">
              <Info size={17} />
              As entradas podem incluir bebidas e salgados. A diferença depende
              dos registros e não representa o lucro completo dos pastéis.
            </p>
            <div className="m-dashboard-columns">
              <section>
                <div className="sectionhead">
                  <h2>Onde estamos gastando</h2>
                </div>
                {weekExpenses.length ? (
                  <div className="m-category-bars">
                    {byCategory.map((c) => (
                      <button
                        key={c.name}
                        onClick={() => {
                          setFilter("semana");
                          setCategory(c.name);
                          changeTab("gastos");
                        }}
                      >
                        <span>
                          {c.name}
                          <strong>{moneyText(c.total)}</strong>
                        </span>
                        <span className="m-category-track">
                          <span
                            style={{ width: (100 * c.total) / max + "%" }}
                          />
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="inlineempty">
                    Os gastos desta semana aparecerão aqui por categoria.
                  </div>
                )}
              </section>
              <section className="m-estimate">
                <h2>Referência dos pastéis</h2>
                {est && !est.missing ? (
                  <>
                    <strong>
                      {est.min === est.max
                        ? moneyText(est.min)
                        : moneyText(est.min) + " a " + moneyText(est.max)}
                    </strong>
                    <p>
                      Faturamento estimado pela produção e pelas sobras. A faixa
                      usa os preços das três feiras; não há venda exata por
                      feira na contagem semanal.
                    </p>
                  </>
                ) : (
                  <p>
                    {est?.missing
                      ? "Faltam preços na semana para calcular uma referência confiável."
                      : "Confirme a produção e a contagem final para ver a referência de faturamento."}
                  </p>
                )}
                <small>Não soma às entradas reais. Não representa lucro.</small>
              </section>
            </div>
          </>
        )}
      </div>
      <div hidden={tab !== "caixa"}>
        <CashForm
          state={state}
          round={round}
          save={save}
          busy={busy}
          error={error}
          now={now}
          onDirty={onDirty}
        />
      </div>
      <div hidden={tab !== "gastos"}>
        <div className="sectionhead">
          <h2>Gastos do negócio</h2>
          <button className="btn" onClick={() => onExpense()}>
            <Plus size={18} />
            Registrar gasto
          </button>
        </div>
        <div className="m-expense-filters">
          <Field label="Período">
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="periodo">
                Mês atual · {month.split("-").reverse().join("/")}
              </option>
              {round && <option value="semana">Semana selecionada</option>}
              <option value="todos">Todo o histórico</option>
            </select>
          </Field>
          <Field label="Categoria">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {["Todas", "Insumos", "Equipe", "Transporte", "Outros"].map(
                (c) => (
                  <option key={c}>{c}</option>
                ),
              )}
            </select>
          </Field>
          <Field label="Buscar gasto">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Descrição ou fornecedor"
            />
          </Field>
        </div>
        <div className="m-expense-totals">
          <span>{expenses.length} registros</span>
          <strong>{moneyText(sum(expenses.map((e) => e.amount)))}</strong>
          <span>
            {moneyText(
              sum(
                expenses
                  .filter((e) => e.status === "pendente")
                  .map((e) => e.amount),
              ),
            )}{" "}
            a pagar
          </span>
        </div>
        <div className="m-expense-list">
          {expenses.map((e) => (
            <article key={e.id}>
              <span className="m-expense-icon">
                <ReceiptText size={21} />
              </span>
              <div className="m-expense-name">
                <h3>{e.description}</h3>
                <small>
                  {dateText(e.date)} · {e.category}
                  {e.supplier ? " · " + e.supplier : ""}
                  {e.createdBy ? " · " + e.createdBy : ""}
                </small>
                {e.status === "pago" && e.paidOn && e.paidOn !== e.date && (
                  <small>Pago em {dateText(e.paidOn)}</small>
                )}
              </div>
              <div className="m-expense-value">
                <strong>{moneyText(e.amount)}</strong>
                <Status done={e.status === "pago"}>
                  {e.status === "pago" ? "Pago" : "A pagar"}
                </Status>
              </div>
              <div className="m-expense-actions">
                {e.status === "pendente" && (
                  <button
                    className="textbtn"
                    onClick={() => {
                      setPayId(e.id);
                      setPayDate(localClock(now).day);
                    }}
                  >
                    Registrar pagamento
                  </button>
                )}
                <button className="textbtn" onClick={() => onExpense(e.id)}>
                  Detalhes e nota
                </button>
                <button
                  className="iconbutton"
                  aria-label={"Cancelar gasto " + e.description}
                  onClick={() => {
                    setCancelId(e.id);
                    setReason("");
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          ))}
        </div>
        {!expenses.length && (
          <div className="m-empty-chart">
            <ReceiptText size={28} />
            <div>
              <h3>Nenhum gasto neste filtro.</h3>
              <p>
                Gás, frango, óleo, equipe: valor, descrição e data já são
                suficientes.
              </p>
            </div>
          </div>
        )}
      </div>
      <Dialog
        open={!!payId || !!cancelId}
        onOpenChange={(v) => {
          if (!v && !busy) {
            setPayId("");
            setCancelId("");
          }
        }}
      >
        <DialogContent className="beto-dialog">
          <DialogTitle>
            {payId ? "Registrar pagamento" : "Cancelar gasto"}
          </DialogTitle>
          <DialogDescription>
            {payId
              ? "O pagamento atualiza o mesmo gasto, sem duplicar a despesa."
              : "O gasto sai dos totais e permanece no histórico de alterações."}
          </DialogDescription>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (
                await save(
                  payId
                    ? {
                        kind: "expense-payment",
                        expenseId: payId,
                        date: payDate,
                      }
                    : {
                        kind: "expense-cancel",
                        roundId: "",
                        expenseId: cancelId,
                        reason,
                      },
                )
              ) {
                setPayId("");
                setCancelId("");
              }
            }}
          >
            {payId ? (
              <Field label="Data do pagamento">
                <input
                  required
                  type="date"
                  value={payDate}
                  max={localClock(now).day}
                  onChange={(e) => setPayDate(e.target.value)}
                />
              </Field>
            ) : (
              <Field label="Motivo do cancelamento">
                <input
                  required
                  minLength={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </Field>
            )}
            <InlineError message={error} />
            <button className="btn" disabled={busy}>
              {busy
                ? "Salvando…"
                : payId
                  ? "Confirmar pagamento"
                  : "Confirmar cancelamento"}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
function CashForm({ state, round, save, busy, error, now, onDirty }: Common) {
  const [fairId, setFairId] = useState(""),
    [values, setValues] = useState<Record<string, string>>({}),
    [reason, setReason] = useState(""),
    [localError, setLocalError] = useState(""),
    [editing, setEditing] = useState(false);
  const fair = round?.fairs.find((f) => f.id === fairId) || round?.fairs[0],
    weekly = round?.cashMode === "semanal",
    current = weekly ? round?.weeklyCash : fair?.cash;
  useEffect(() => {
    setValues(
      Object.fromEntries(
        ["cash", "pix", "debit", "credit", "float", "withdrawal", "card"].map(
          (k) => [
            k,
            cashString((current?.[k as keyof typeof current] as number) || 0),
          ],
        ),
      ),
    );
    setReason("");
    setEditing(false);
  }, [round?.id, fair?.id, weekly, current?.closed]);
  if (!round)
    return (
      <div className="inlineempty">
        O caixa acompanha as semanas de feira. Os gastos podem ser registrados a
        qualquer momento.
      </div>
    );
  const last =
      round.fairs
        .map((f) => f.date)
        .sort()
        .at(-1) || round.end,
    can = localClock(now).day >= (weekly ? last : fair!.date),
    fields = [
      ["cash", "Dinheiro contado"],
      ["pix", "Pix"],
      ["debit", "Débito"],
      ["credit", "Crédito"],
      ["float", "Troco levado"],
      ["withdrawal", "Retiradas de dinheiro"],
    ];
  const visibleLegacyCard = !weekly && !!fair?.cash.card;
  return (
    <form
      className="m-cash-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setLocalError("");
        const v = Object.fromEntries(
          Object.entries(values).map(([k, v]) => [k, cents(v)]),
        );
        if (Object.values(v).some((n) => !Number.isFinite(n))) {
          setLocalError("Confira os valores. Use, por exemplo, 150,00.");
          return;
        }
        const amounts = {
          cash: v.cash,
          pix: v.pix,
          debit: v.debit,
          credit: v.credit,
          float: v.float,
          withdrawal: v.withdrawal,
        };
        const ok = await save(
          weekly
            ? {
                kind: "weekly-cash",
                roundId: round.id,
                ...amounts,
                correction: !!current?.closed,
                reason,
              }
            : {
                kind: "cash",
                roundId: round.id,
                fairId: fair!.id,
                ...amounts,
                card: v.card,
                correction: !!current?.closed,
                reason,
              },
        );
        if (ok) {
          setEditing(false);
          onDirty(false);
        }
      }}
    >
      <div className="sectionhead">
        <h2>{weekly ? "Caixa da semana" : "Caixa por feira"}</h2>
        <Status done={!!current?.closed}>
          {current?.closed ? "Caixa registrado" : "A registrar"}
        </Status>
      </div>
      <p className="sectionhint">
        Dinheiro, Pix e vendas nas máquinas. O valor do cartão é movimentação de
        vendas, mesmo quando o depósito ainda não caiu.
      </p>
      {!round.weeklyCash?.closed && !round.fairs.some((f) => f.cash.closed) && (
        <Field label="Como deseja fechar?">
          <select
            value={round.cashMode}
            disabled={busy}
            onChange={(e) =>
              void save({
                kind: "cash-method",
                roundId: round.id,
                mode: e.target.value as "diario" | "semanal",
              })
            }
          >
            <option value="semanal">Uma vez · sexta, sábado e domingo</option>
            <option value="diario">Separado · uma feira por vez</option>
          </select>
        </Field>
      )}
      {!weekly && (
        <Field label="Feira">
          <select value={fair?.id} onChange={(e) => setFairId(e.target.value)}>
            {round.fairs.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} · {dateText(f.date)}
              </option>
            ))}
          </select>
        </Field>
      )}
      {current?.closed && !editing ? (
        <div className="m-return-intro">
          <div>
            <strong>{moneyText(cashTotal(current))}</strong>
            <p>
              Dinheiro + Pix + débito + crédito + retiradas − troco.
              {visibleLegacyCard
                ? " Inclui cartão sem detalhamento no registro anterior."
                : ""}
            </p>
          </div>
          <button
            type="button"
            className="btn secondary"
            onClick={() => setEditing(true)}
          >
            Corrigir caixa
          </button>
        </div>
      ) : (
        <>
          <div className="m-money-grid">
            {[
              ...fields,
              ...(visibleLegacyCard
                ? [["card", "Cartão sem detalhamento (anterior)"]]
                : []),
            ].map(([key, label]) => (
              <Amount
                key={key}
                label={label}
                value={values[key] || "0,00"}
                onChange={(v) => {
                  setValues((a) => ({ ...a, [key]: v }));
                  onDirty(true);
                }}
              />
            ))}
          </div>
          <p className="sectionhint">
            O dinheiro contado inclui o troco inicial. As retiradas são valores
            tirados do caixa durante as feiras.
          </p>
          {current?.closed && (
            <Field label="Motivo da correção">
              <input
                minLength={3}
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </Field>
          )}
          <InlineError message={localError || error} />
          <div className="m-save-row">
            <p>
              {can
                ? "Pode ser registrado mesmo com a contagem de pastéis pendente."
                : "Disponível a partir de " +
                  dateText(weekly ? last : fair!.date) +
                  "."}
            </p>
            <button className="btn" disabled={busy || !can}>
              {busy
                ? "Salvando…"
                : current?.closed
                  ? "Salvar correção"
                  : weekly
                    ? "Fechar caixa semanal"
                    : "Fechar caixa da feira"}
            </button>
          </div>
        </>
      )}
    </form>
  );
}
export function Markets({
  state,
  round,
  save,
  busy,
  error,
  now,
  onDirty,
  onNewWeek,
  onLoad,
  onConfirmLoad,
  onTeamExpense,
}: {
  onNewWeek: () => void;
  onLoad: (flavor: Flavor, fairId: string) => void;
  onConfirmLoad: (fairId: string) => void;
  onTeamExpense: (fairId: string) => void;
} & Common) {
  if (!round)
    return (
      <div className="empty">
        <Store size={34} />
        <h2>As feiras começam com a semana.</h2>
        <p>Amarais na sexta, Nova Odessa no sábado e Morungaba no domingo.</p>
        <button className="btn" onClick={onNewWeek}>
          Iniciar semana
        </button>
      </div>
    );
  return (
    <>
      <section className="m-market-overview">
        <h2>Da base às três feiras.</h2>
        <p>
          Consulte a separação e os preços. Durante a feira, não é preciso
          registrar venda por venda.
        </p>
      </section>
      <div className="m-fair-details">
        {round.fairs.map((f) => {
          const expenses = state.expenses.filter(
            (e) => !e.cancelled && e.fairId === f.id && e.category === "Equipe",
          );
          return (
            <details key={f.id}>
              <summary>
                <span className="m-date-block">
                  <strong>
                    {new Date(f.date + "T12:00:00Z")
                      .toLocaleDateString("pt-BR", { weekday: "short" })
                      .replace(".", "")}
                  </strong>
                  {dateText(f.date)}
                </span>
                <span>
                  <strong>{f.name}</strong>
                  <small>{f.transport}</small>
                </span>
                <Status done={f.loadConfirmed}>
                  {f.loadConfirmed ? "Carga conferida" : "Consultar carga"}
                </Status>
                <ChevronRight size={20} />
              </summary>
              <div className="m-fair-inner">
                <div className="m-fair-context">
                  <p>
                    {f.startTime
                      ? "Saída/início: " + f.startTime
                      : "Horários ainda não definidos"}
                    {f.closeTime ? " · encerramento " + f.closeTime : ""}
                  </p>
                  <button
                    className="btn secondary"
                    disabled={
                      busy ||
                      f.loadConfirmed ||
                      !round.productionClosed ||
                      localClock(now).day > f.date
                    }
                    onClick={() => onConfirmLoad(f.id)}
                  >
                    {f.loadConfirmed ? (
                      <>
                        <Check size={16} />
                        Carga conferida
                      </>
                    ) : (
                      "Confirmar conferência da carga"
                    )}
                  </button>
                </div>
                <div className="m-load-table">
                  <div className="m-load-head">
                    <span>Sabor</span>
                    <span>Quantidade</span>
                    <span>Preço</span>
                  </div>
                  {f.lines
                    .filter(
                      (l) =>
                        state.flavors.find((x) => x.id === l.flavorId)
                          ?.active || l.taken > 0,
                    )
                    .map((l) => {
                      const flavor = state.flavors.find(
                        (x) => x.id === l.flavorId,
                      )!;
                      return (
                        <div className="m-load-line" key={l.flavorId}>
                          <div>
                            <strong>{flavor.name}</strong>
                            {flavor.prepKind === "na_feira" && (
                              <small>Média prevista na feira</small>
                            )}
                          </div>
                          <span>
                            {round.productionClosed &&
                            flavor.prepKind === "base"
                              ? l.taken
                              : l.planned}
                            <small>
                              {flavor.prepKind === "na_feira" ||
                              !round.productionClosed
                                ? "previstos"
                                : "separados"}
                            </small>
                          </span>
                          <span>
                            {l.price ? moneyText(l.price) : "A definir"}
                          </span>
                          {flavor.prepKind === "base" &&
                            round.status !== "concluida" && (
                              <button
                                type="button"
                                className="textbtn"
                                onClick={() => onLoad(flavor, f.id)}
                              >
                                Conferir
                              </button>
                            )}
                        </div>
                      );
                    })}
                </div>
                <div className="sectionhead">
                  <h3>Equipe desta feira</h3>
                  <button
                    className="textbtn"
                    onClick={() => onTeamExpense(f.id)}
                  >
                    <Plus size={16} />
                    Registrar gasto de equipe
                  </button>
                </div>
                {expenses.length ? (
                  <ul className="m-team-costs">
                    {expenses.map((e) => (
                      <li key={e.id}>
                        <span>{e.supplier || e.description}</span>
                        <strong>{moneyText(e.amount)}</strong>
                        <small>
                          {e.status === "pago" ? "Pago" : "A pagar"}
                        </small>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="sectionhint">
                    Registre cada colaborador e o valor combinado. Cada pessoa
                    pode receber um valor diferente.
                  </p>
                )}
              </div>
            </details>
          );
        })}
      </div>
      <WeeklyReturns
        state={state}
        round={round}
        save={save}
        busy={busy}
        error={error}
        now={now}
        onDirty={onDirty}
      />
    </>
  );
}
