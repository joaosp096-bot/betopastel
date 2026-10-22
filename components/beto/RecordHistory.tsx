"use client";
import { useState } from "react";
import { State, moneyText, dateText } from "@/lib/model";
const names: Record<string, string> = {
  production: "Produção",
  allocation: "Separação e carga",
  return: "Contagem de sobras",
  cash: "Caixa",
  seal: "Confirmação",
  expense: "Gasto e pagamento",
  template: "Padrão de produção",
};
const fields: Record<string, string> = {
  before: "Antes da alteração",
  after: "Registro confirmado",
  produced: "Produzidos",
  planned: "Previstos",
  returned: "Sobras",
  loss: "Perdas",
  fairProduced: "Preparados na feira",
  taken: "Carga",
  quantity: "Quantidade",
  allocations: "Separação",
  contributors: "Quem participou",
  reason: "Motivo",
  amount: "Valor",
  description: "Descrição",
  category: "Categoria",
  status: "Situação",
  supplier: "Fornecedor / colaborador",
  paidOn: "Data do pagamento",
  date: "Data do gasto",
  cash: "Dinheiro",
  pix: "Pix",
  debit: "Débito",
  credit: "Crédito",
  card: "Cartão sem detalhamento",
  float: "Troco levado",
  withdrawal: "Retiradas",
  price: "Preço",
  closed: "Confirmado",
  cancelled: "Cancelado",
  event: "Tipo de alteração",
  sexta: "Amarais",
  sabado: "Nova Odessa",
  domingo: "Morungaba",
  count: "Sabores conferidos",
  reusable: "Reaproveitáveis",
  adjustment: "Ajuste",
  soldOut: "Esgotado",
  savedBy: "Registrado por",
  createdBy: "Registrado por",
  updatedBy: "Atualizado por",
  createdAt: "Registro em",
  updatedAt: "Atualização em",
  day: "Dia",
  phase: "Etapa",
  pendingCash: "Caixas pendentes",
  carry: "Revisão do saldo anterior",
  ready: "Pastéis prontos aproveitados",
  discarded: "Descartados",
  dismantled: "Desmontados",
  flourKg: "Massa batida (kg de farinha)",
  margin: "Margem de saídas sem venda",
  nonSale: "Saídas sem venda informadas",
  extras: "Extras feitos na feira",
  values: "Conferência por feira",
  mode: "Tipo da informação",
  note: "Contexto da feira",
  notes: "Observações",
  prices: "Preços",
  unitPrice: "Preço unitário",
  purchased: "Comprados",
  remaining: "Sobra final",
  observation: "Conferência do lote",
  confirmedOn: "Conferido em",
  endedOn: "Dia exato em que acabou",
  soldByFair: "Distribuição informada",
  opening: "Saldo anterior",
  lines: "Itens conferidos",
};
const moneyFields = new Set([
  "amount",
  "cash",
  "pix",
  "debit",
  "credit",
  "card",
  "float",
  "withdrawal",
  "price",
  "unitPrice",
]);
const hiddenFields = new Set(["id", "key", "roundId", "flavorId", "fairId", "kind", "methodology"]);
export function RecordValues({
  value,
  state,
  field = "",
}: {
  value: unknown;
  state: State;
  field?: string;
}) {
  if (value === null || value === undefined) return <span>—</span>;
  if (Array.isArray(value))
    return (
      <div className="m-record-array">
        {value.map((v, i) => (
          <div key={i}>
            {typeof v === "object" && v && "flavorId" in v ? (
              <strong>
                {state.flavors.find((f) => f.id === v.flavorId)?.name ||
                  "Sabor"}
              </strong>
            ) : typeof v === "object" && v && "fairId" in v ? (
              <strong>
                {state.rounds
                  .flatMap((r) => r.fairs)
                  .find((f) => f.id === v.fairId)?.name || "Feira"}
              </strong>
            ) : null}
            <RecordValues value={v} state={state} />
          </div>
        ))}
      </div>
    );
  if (typeof value === "object")
    return (
      <dl className="m-record-values">
        {Object.entries(value)
          .filter(([k]) => !hiddenFields.has(k))
          .map(([key, v]) => (
            <div key={key}>
              <dt>{fields[key] || key}</dt>
              <dd>
                <RecordValues value={v} state={state} field={key} />
              </dd>
            </div>
          ))}
      </dl>
    );
  if (typeof value === "boolean") return <span>{value ? "Sim" : "Não"}</span>;
  if (typeof value === "number")
    return (
      <span>
        {moneyFields.has(field)
          ? moneyText(value)
          : value.toLocaleString("pt-BR")}
      </span>
    );
  const text = String(value),
    translations: Record<string, string> = {
      pago: "Pago",
      pendente: "A pagar",
      payment: "Pagamento",
      cancel: "Cancelamento",
      aberta: "Em aberto",
      concluida: "Concluída",
      production: "Produção",
      return: "Sobras",
      round: "Semana",
      load: "Carga",
      "week-prepare": "Conferência da produção",
      "week-close": "Fechamento semanal",
      "week-fair": "Situação da feira",
      "week-reopen": "Reabertura e revisão dos saldos seguintes",
      "week-pattern": "Padrão carregado para conferência",
      "week-prices": "Preços históricos corrigidos",
      "snack-count": "Conferência dos salgados",
      "dough-batch": "Lote de massinhas",
      "dough-observe": "Contagem do lote",
      "photo-template": "Padrão da foto conferido",
      pending: "Pendente",
      count: "Contagem informada",
      estimate: "Estimativa informada",
    };
  return <span>{translations[text] || text}</span>;
}
export function RecordHistory({
  state,
  roundId,
}: {
  state: State;
  roundId?: string;
}) {
  const [kind, setKind] = useState("todos"),
    [scope, setScope] = useState("todos"),
    [author, setAuthor] = useState("todos"),
    [flavor, setFlavor] = useState("todos"),
    [limit, setLimit] = useState(50);
  const records = [...state.records]
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
    .filter(
      (e) =>
        (scope !== "semana" || e.roundId === roundId) &&
        (kind === "todos" || e.kind === kind) &&
        (author === "todos" || e.savedBy === author) &&
        (flavor === "todos" ||
          e.flavorId === flavor ||
          (Array.isArray(e.values.lines) &&
            e.values.lines.some((l: any) => l.flavorId === flavor))),
    );
  return (
    <section className="m-record-history">
      <div className="sectionhead">
        <h2>Registros e confirmações</h2>
      </div>
      <div className="m-history-filters">
        <label className="field">
          <span>Período</span>
          <select
            value={scope}
            onChange={(e) => {
              setScope(e.target.value);
              setLimit(50);
            }}
          >
            <option value="todos">Todo o histórico</option>
            {roundId && <option value="semana">Semana selecionada</option>}
          </select>
        </label>
        <label className="field">
          <span>Registro</span>
          <select
            value={kind}
            onChange={(e) => {
              setKind(e.target.value);
              setLimit(50);
            }}
          >
            <option value="todos">Todos os tipos</option>
            {Object.entries(names).map(([key, name]) => (
              <option key={key} value={key}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Responsável</span>
          <select value={author} onChange={(e) => setAuthor(e.target.value)}>
            <option value="todos">Todas as pessoas</option>
            {[...new Set(state.records.map((e) => e.savedBy))].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Sabor</span>
          <select value={flavor} onChange={(e) => setFlavor(e.target.value)}>
            <option value="todos">Todos os sabores</option>
            {state.flavors.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="m-record-feed">
        {records.slice(0, limit).map((e) => (
          <details key={e.id}>
            <summary>
              <div>
                <strong>
                  {names[e.kind]}
                  {e.flavorId
                    ? " · " +
                      state.flavors.find((f) => f.id === e.flavorId)?.name
                    : ""}
                </strong>
                <small>
                  {e.savedBy} ·{" "}
                  {new Date(e.savedAt).toLocaleString("pt-BR", {
                    timeZone: "America/Sao_Paulo",
                  })}{" "}
                  ·{" "}
                  {e.revision > 1
                    ? "corrigido " + (e.revision - 1) + " vez(es)"
                    : "primeiro registro"}
                </small>
              </div>
              <span>Ver registro</span>
            </summary>
            <div className="m-record-content">
              <p>
                Data da operação: {dateText(e.day)} · responsável pelo registro:{" "}
                {e.savedBy}
              </p>
              <RecordValues value={e.values} state={state} />
            </div>
          </details>
        ))}
      </div>
      {!records.length && (
        <div className="inlineempty">
          Nenhum registro neste filtro. As confirmações aparecem aqui com
          autoria e data.
        </div>
      )}
      {records.length > limit && (
        <button
          className="btn secondary"
          onClick={() => setLimit((n) => n + 50)}
        >
          Mostrar mais registros
        </button>
      )}
    </section>
  );
}
