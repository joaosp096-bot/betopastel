"use client";
import { useEffect, useState, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Check,
  ChevronLeft,
  X,
  LockKeyhole,
  Minus,
  Plus,
  LoaderCircle,
  Truck,
  ClipboardCheck,
  ArrowRight,
} from "lucide-react";
import { Dialog as RadixDialog } from "radix-ui";
import { Checkbox } from "@/components/ui/checkbox";
import {
  State,
  Round,
  Flavor,
  Line,
  available,
  estimated,
  dateText,
} from "@/lib/model";
import { keyFor, Operation } from "@/lib/workflow";
import { identity } from "@/lib/flavor-identity";
import { FoodFace } from "./FoodCard";
export type FlavorTaskSpec = {
  flavorId: string;
  kind: "production" | "allocation" | "return" | "consult" | "load";
  day: string;
  fairId?: string;
  correction?: boolean;
  reason?: string;
};
export function Quantity({
  value,
  onChange,
  label,
  step = 10,
}: {
  value: number;
  onChange: (n: number) => void;
  label: string;
  step?: number;
}) {
  return (
    <div className="quantity big">
      <button
        type="button"
        aria-label={"Diminuir " + label}
        onClick={() => onChange(Math.max(0, value - step))}
      >
        <Minus size={21} />
      </button>
      <input
        aria-label={label}
        inputMode="numeric"
        type="number"
        min="0"
        max="1000000"
        step="1"
        value={value}
        onChange={(e) =>
          onChange(Math.max(0, Math.min(1000000, Number(e.target.value) || 0)))
        }
      />
      <button
        type="button"
        aria-label={"Aumentar " + label}
        onClick={() => onChange(Math.min(1000000, value + step))}
      >
        <Plus size={21} />
      </button>
    </div>
  );
}
export function FlavorTask({
  task,
  state,
  round,
  onClose,
  onSave,
  onNext,
  busy,
  error,
}: {
  task: FlavorTaskSpec | null;
  state: State;
  round: Round | undefined;
  onClose: () => void;
  onSave: (op: Operation) => Promise<boolean>;
  onNext: (t: FlavorTaskSpec) => void;
  busy: boolean;
  error?: string;
}) {
  const last = useRef<FlavorTaskSpec | null>(task);
  if (task) last.current = task;
  const t = task || last.current;
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0),
    [produced, setProduced] = useState(0),
    [planned, setPlanned] = useState(0),
    [loads, setLoads] = useState<Record<string, number>>({}),
    [ret, setRet] = useState({
      returned: 0,
      reusable: 0,
      loss: 0,
      adjustment: 0,
      soldOut: false,
    }),
    [confirmed, setConfirmed] = useState(false),
    [taken, setTaken] = useState(0),
    [price, setPrice] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const f = state.flavors.find((f) => f.id === t?.flavorId),
    index = state.flavors.findIndex((f) => f.id === t?.flavorId),
    fair = round?.fairs.find((f) => f.id === t?.fairId),
    line = fair?.lines.find((l) => l.flavorId === f?.id),
    style = identity(index);
  useEffect(() => {
    if (!task || !round) return;
    setStep(task.kind === "allocation" ? 1 : 0);
    setConfirmed(false);
    const rec = state.records.find(
      (e) => e.key === keyFor(round.id, "production", task.day, task.flavorId),
    );
    setProduced(Number(rec?.values.produced || 0));
    setPlanned(
      round.production.find((p) => p.flavorId === task.flavorId)?.planned || 0,
    );
    setLoads(
      Object.fromEntries(
        round.fairs.map((f) => [
          f.id,
          f.lines.find((l) => l.flavorId === task.flavorId)?.taken || 0,
        ]),
      ),
    );
    const l = round.fairs
      .find((f) => f.id === task.fairId)
      ?.lines.find((l) => l.flavorId === task.flavorId);
    setTaken(l?.taken || 0);
    setPrice(l?.price || 0);
    setRet({
      returned: l?.returned || 0,
      reusable: l?.reusable || 0,
      loss: l?.loss || 0,
      adjustment: l?.adjustment || 0,
      soldOut: l?.soldOut || false,
    });
    if (timer.current) clearTimeout(timer.current);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [task?.flavorId, task?.kind, task?.fairId, task?.day, task?.correction]);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!task || !round || !f || busy) return;
    let op: Operation;
    const correction = { correction: task.correction, reason: task.reason };
    if (task.kind === "load") {
      if (!fair) return;
      op = {
        kind: "load",
        roundId: round.id,
        fairId: fair.id,
        flavorId: f.id,
        taken,
        price,
        ...correction,
      };
    } else if (task.kind === "return") {
      if (!fair) return;
      op = {
        kind: "return",
        roundId: round.id,
        fairId: fair.id,
        flavorId: f.id,
        ...ret,
        ...correction,
      };
    } else if (step === 0)
      op = {
        kind: "production",
        roundId: round.id,
        flavorId: f.id,
        day: task.day,
        planned,
        produced,
        ...correction,
      };
    else
      op = {
        kind: "allocation",
        roundId: round.id,
        flavorId: f.id,
        day: task.day,
        allocations: round.fairs.map((fair) => ({
          fairId: fair.id,
          quantity: loads[fair.id] || 0,
        })),
        ...correction,
      };
    if (await onSave(op)) {
      if (step === 0 && task.kind === "production") {
        setStep(1);
        return;
      }
      setConfirmed(true);
      timer.current = setTimeout(() => onNext(task), reduce ? 300 : 800);
    }
  }
  return (
    <RadixDialog.Root
      open={!!task}
      onOpenChange={(v) => {
        if (!v && !busy) onClose();
      }}
    >
      <AnimatePresence>
        {task && f && round && (
          <RadixDialog.Portal forceMount>
            <RadixDialog.Overlay forceMount className="taskoverlay" />
            <RadixDialog.Content forceMount className="taskdialog">
              <RadixDialog.Title className="sr-only">
                {f?.name || "Sabor"}
              </RadixDialog.Title>
              <RadixDialog.Description className="sr-only">
                Registro de{" "}
                {t?.kind === "return"
                  ? "retorno"
                  : step === 1
                    ? "separação"
                    : "produção"}{" "}
                por sabor
              </RadixDialog.Description>
              <motion.section
                layoutId={"flavor-" + f.id}
                key={f.id}
                className="flavorfullscreen"
                style={{ background: "#fff", borderRadius: 0 }}
                transition={{ type: "spring", stiffness: 340, damping: 32 }}
                exit={{
                  opacity: 0,
                  transition: { duration: reduce ? 0 : 0.18 },
                }}
              >
                <div className="tasktop">
                  <button
                    type="button"
                    className="taskback"
                    onClick={onClose}
                    disabled={busy}
                  >
                    <ChevronLeft size={19} />
                    Voltar
                  </button>
                  <span>
                    {task.correction
                      ? "Correção registrada"
                      : task.kind === "consult"
                        ? "Consulta"
                        : task.kind === "return"
                          ? "Retorno da feira"
                          : task.kind === "load"
                            ? "Conferência da carga"
                            : step === 1
                              ? "Separação por feira"
                              : "Produção do dia"}
                  </span>
                  <button
                    type="button"
                    aria-label="Fechar sabor"
                    className="taskclose"
                    disabled={busy}
                    onClick={onClose}
                  >
                    <X size={21} />
                  </button>
                </div>
                <div className="tasklayout">
                  <div
                    className="taskidentity"
                    style={{ background: style.tint, color: style.accent }}
                  >
                    <FoodFace flavor={f} index={index} large />
                    <div className="taskflavorname">
                      <motion.h1 layoutId={"title-" + f.id}>{f.name}</motion.h1>
                      <span>
                        {f.prepKind === "na_feira"
                          ? "Feito na feira"
                          : "Preparado na base"}
                      </span>
                    </div>
                    <div className="taskcontext">
                      <span>
                        {task.kind === "return"
                          ? fair?.name
                          : dateText(task.day)}
                      </span>
                      {task.correction && <p>Motivo: {task.reason}</p>}
                    </div>
                  </div>
                  <div className="taskwork">
                    <div className="microtimeline">
                      {(task.kind === "return"
                        ? ["Retorno", "Registrado"]
                        : task.kind === "load"
                          ? ["Carga", "Registrado"]
                          : task.kind === "consult"
                            ? ["Registro", "Consulta"]
                            : ["Contagem", "Separação", "Registrado"]
                      ).map((label, i) => (
                        <span
                          key={label}
                          className={
                            (confirmed || i < step
                              ? "complete "
                              : i === step
                                ? "current "
                                : "") + "microitem"
                          }
                        >
                          <i>
                            {confirmed || i < step ? (
                              <Check size={13} />
                            ) : (
                              i + 1
                            )}
                          </i>
                          {label}
                        </span>
                      ))}
                    </div>
                    <AnimatePresence mode="wait" initial={false}>
                      {confirmed ? (
                        <motion.div
                          className="successreceipt"
                          key="success"
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                        >
                          <motion.div
                            className="bigcheck"
                            initial={{ scale: 0.7 }}
                            animate={{ scale: 1 }}
                          >
                            <Check size={36} />
                          </motion.div>
                          <h2>Registrado.</h2>
                          <p>{f.name}</p>
                          <span>
                            {task.kind === "load"
                              ? "Carga confirmada pelo sistema."
                              : "Seguindo para o próximo sabor…"}
                          </span>
                          <button
                            type="button"
                            className="btn"
                            onClick={() => {
                              if (timer.current) clearTimeout(timer.current);
                              onNext(task);
                            }}
                          >
                            Continuar <ArrowRight size={18} />
                          </button>
                        </motion.div>
                      ) : task.kind === "consult" ? (
                        <motion.div
                          key="consult"
                          className="consulttask"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <div className="readonlylabel">
                            <LockKeyhole size={16} />
                            Registro salvo
                          </div>
                          <h2>Números do sabor</h2>
                          <div className="readnumbers">
                            <div>
                              <span>Produzido na base</span>
                              <strong>
                                {round.production.find(
                                  (p) => p.flavorId === f.id,
                                )?.produced || 0}
                              </strong>
                            </div>
                            <div>
                              <span>Saldo não alocado</span>
                              <strong>{available(round, f.id)}</strong>
                            </div>
                          </div>
                          {round.fairs.map((fair) => {
                            const l = fair.lines.find(
                              (l) => l.flavorId === f.id,
                            );
                            return (
                              <article className="readfair" key={fair.id}>
                                <b>{fair.name}</b>
                                <span>
                                  {l?.taken || 0} levados{" "}
                                  {fair.returnSealed
                                    ? "· " + (l?.returned || 0) + " retorno"
                                    : ""}
                                </span>
                              </article>
                            );
                          })}
                        </motion.div>
                      ) : (
                        <motion.form
                          key={task.kind + "-" + step}
                          className="taskform"
                          onSubmit={save}
                          initial={{ opacity: 0, x: reduce ? 0 : 18 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: reduce ? 0 : -18 }}
                          transition={{ duration: 0.2 }}
                        >
                          {task.kind === "load" ? (
                            <>
                              <div className="taskquestion">
                                <h2>Confira esta carga.</h2>
                                <span>
                                  {fair?.name} · {dateText(task.day)}
                                </span>
                              </div>
                              <label className="subtaskfield">
                                <span>Quantidade na carga</span>
                                <Quantity
                                  label="Quantidade na carga"
                                  value={taken}
                                  step={1}
                                  onChange={setTaken}
                                />
                              </label>
                              <label className="field">
                                <span>Preço por pastel nesta feira</span>
                                <div className="moneyinput">
                                  <span>R$</span>
                                  <input
                                    aria-label="Preço nesta feira"
                                    type="number"
                                    min="0"
                                    max="1000000"
                                    step="0.01"
                                    value={price / 100}
                                    onChange={(e) =>
                                      setPrice(
                                        Math.max(
                                          0,
                                          Math.round(
                                            Number(e.target.value) * 100,
                                          ),
                                        ),
                                      )
                                    }
                                  />
                                </div>
                              </label>
                              <p className="sectionhint">
                                Previsto: {line?.planned || 0} unidades. Esta
                                alteração mantém as outras feiras.
                              </p>
                              <div className="tasktotal">
                                <span>Saldo para esta carga</span>
                                <strong>
                                  {fair ? available(round, f.id, fair.id) : 0}
                                </strong>
                              </div>
                              {fair &&
                                taken > available(round, f.id, fair.id) && (
                                  <p className="warn">
                                    Carga acima do saldo informado. Confira a
                                    produção e os retornos concluídos.
                                  </p>
                                )}
                            </>
                          ) : task.kind === "return" ? (
                            <>
                              {f.prepKind === "na_feira" && (
                                <label className="subtaskfield">
                                  <span>Quantidade preparada na feira</span>
                                  <Quantity
                                    label="Preparados na feira"
                                    value={Math.max(0, ret.adjustment)}
                                    step={1}
                                    onChange={(n) =>
                                      setRet((v) => ({ ...v, adjustment: n }))
                                    }
                                  />
                                </label>
                              )}
                              <div className="taskquestion">
                                <h2>Quanto voltou?</h2>
                                <span>
                                  {line?.taken || 0} unidades na carga
                                </span>
                              </div>
                              <Quantity
                                label="Quantidade retornada"
                                value={ret.returned}
                                step={1}
                                onChange={(n) =>
                                  setRet((v) => ({
                                    ...v,
                                    returned: n,
                                    reusable: Math.min(v.reusable, n),
                                  }))
                                }
                              />
                              <label className="subtaskfield">
                                <span>Quantidade para reaproveitar</span>
                                <Quantity
                                  label="Quantidade reaproveitável"
                                  value={ret.reusable}
                                  step={1}
                                  onChange={(n) =>
                                    setRet((v) => ({
                                      ...v,
                                      reusable: Math.min(v.returned, n),
                                    }))
                                  }
                                />
                              </label>
                              <label className="checkfield">
                                <Checkbox
                                  checked={ret.soldOut}
                                  onCheckedChange={(v) =>
                                    setRet((x) => ({ ...x, soldOut: !!v }))
                                  }
                                />
                                Esgotou na feira
                              </label>
                              <details className="adjustments">
                                <summary>Perdas e ajustes (opcional)</summary>
                                <label className="field">
                                  <span>Perdas fora do retorno / consumo</span>
                                  <Quantity
                                    label="Perdas ou consumo"
                                    step={1}
                                    value={ret.loss}
                                    onChange={(n) =>
                                      setRet((v) => ({ ...v, loss: n }))
                                    }
                                  />
                                </label>
                                <p className="sectionhint">
                                  Conte apenas unidades que não entraram no
                                  retorno. O retorno não deve ser descontado
                                  duas vezes.
                                </p>
                                {f.prepKind === "base" && (
                                  <label className="field">
                                    <span>Ajuste da saída (+/−)</span>
                                    <input
                                      aria-label="Ajuste da saída"
                                      type="number"
                                      step="1"
                                      value={ret.adjustment}
                                      onChange={(e) =>
                                        setRet((v) => ({
                                          ...v,
                                          adjustment:
                                            Number(e.target.value) || 0,
                                        }))
                                      }
                                    />
                                  </label>
                                )}
                              </details>
                              <div className="tasktotal">
                                <span>Saída estimada</span>
                                <strong>
                                  {line ? estimated({ ...line, ...ret }) : 0}
                                </strong>
                              </div>
                              {line &&
                                (ret.returned >
                                  line.taken + Math.max(0, ret.adjustment) ||
                                  estimated({ ...line, ...ret }) < 0) && (
                                  <p className="warn">
                                    Confira a carga e os ajustes.
                                  </p>
                                )}
                            </>
                          ) : step === 0 ? (
                            <>
                              <div className="taskquestion">
                                <h2>Quantos foram produzidos?</h2>
                                <span>
                                  {dateText(task.day)} · produção na base
                                </span>
                              </div>
                              <Quantity
                                label="Quantidade produzida"
                                value={produced}
                                onChange={setProduced}
                              />
                              <div className="quickcounts">
                                {[0, 20, 50, 100].map((n) => (
                                  <button
                                    key={n}
                                    type="button"
                                    onClick={() => setProduced(n)}
                                  >
                                    {n === 0 ? "Nenhum" : n}
                                  </button>
                                ))}
                              </div>
                              <details className="adjustments">
                                <summary>Meta de produção (opcional)</summary>
                                <label className="subtaskfield">
                                  <span>Meta da semana</span>
                                  <input
                                    aria-label="Meta da semana"
                                    type="number"
                                    min="0"
                                    max="1000000"
                                    value={planned}
                                    onChange={(e) =>
                                      setPlanned(
                                        Math.max(
                                          0,
                                          Number(e.target.value) || 0,
                                        ),
                                      )
                                    }
                                  />
                                </label>
                              </details>
                              <div className="tasktotal">
                                <span>Produzido na base nesta rodada</span>
                                <strong>
                                  {round.production.find(
                                    (p) => p.flavorId === f.id,
                                  )?.produced || 0}
                                </strong>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="taskquestion">
                                <h2>Separe para cada feira.</h2>
                              </div>
                              <div className="allocations">
                                {round.fairs.map((fair) => (
                                  <label
                                    className="allocationrow"
                                    key={fair.id}
                                  >
                                    <div>
                                      <strong>{fair.name}</strong>
                                      <span>
                                        {dateText(fair.date)} · {fair.transport}
                                      </span>
                                    </div>
                                    <Quantity
                                      label={"Separado para " + fair.name}
                                      value={loads[fair.id] || 0}
                                      onChange={(n) =>
                                        setLoads((v) => ({
                                          ...v,
                                          [fair.id]: n,
                                        }))
                                      }
                                    />
                                  </label>
                                ))}
                              </div>
                              <div className="tasktotal">
                                <span>Total separado</span>
                                <strong>
                                  {Object.values(loads).reduce(
                                    (a, n) => a + n,
                                    0,
                                  )}
                                </strong>
                              </div>
                              {Object.values(loads).reduce((a, n) => a + n, 0) >
                                (round.production.find(
                                  (p) => p.flavorId === f.id,
                                )?.produced || 0) +
                                  round.fairs.reduce(
                                    (a, fa) =>
                                      a +
                                      (fa.returnSealed
                                        ? fa.lines.find(
                                            (l) => l.flavorId === f.id,
                                          )?.reusable || 0
                                        : 0),
                                    0,
                                  ) && (
                                <p className="warn">
                                  A separação está acima do disponível. Confira
                                  as quantidades.
                                </p>
                              )}
                            </>
                          )}
                          {error && (
                            <div className="formerror" role="alert">
                              {error}
                              {error.includes("Outra pessoa") && (
                                <button
                                  className="textbtn"
                                  type="button"
                                  onClick={() =>
                                    window.dispatchEvent(
                                      new Event("beto:authenticated"),
                                    )
                                  }
                                >
                                  Atualizar registros
                                </button>
                              )}
                            </div>
                          )}
                          <div className="taskfooter">
                            {step === 1 && task.kind === "production" && (
                              <button
                                type="button"
                                className="textbtn"
                                onClick={() => setStep(0)}
                              >
                                Voltar à contagem
                              </button>
                            )}
                            <button
                              type="submit"
                              className="btn"
                              disabled={busy}
                            >
                              {busy ? (
                                <>
                                  <LoaderCircle className="spin" size={18} />
                                  Confirmando…
                                </>
                              ) : (
                                <>
                                  <Check size={18} />
                                  {task.kind === "load"
                                    ? "Salvar carga"
                                    : task.kind === "return"
                                      ? "Salvar e próximo sabor"
                                      : step === 0
                                        ? "Salvar e separar"
                                        : "Salvar e próximo sabor"}
                                </>
                              )}
                            </button>
                            <small>
                              Avançamos depois da confirmação do registro.
                            </small>
                          </div>
                        </motion.form>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.section>
            </RadixDialog.Content>
          </RadixDialog.Portal>
        )}
      </AnimatePresence>
    </RadixDialog.Root>
  );
}
