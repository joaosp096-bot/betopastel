"use client";
import { useState, useEffect } from "react";
import { Paperclip, ExternalLink, Check, ReceiptText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { State, Round, uid, moneyText } from "@/lib/model";
import type { Operation } from "@/lib/workflow";
import { localClock } from "@/lib/workflow";
type FileInfo = {
  id: string;
  name: string;
  size: number;
  mime: string;
  created: string;
  created_by: string;
};
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
async function compactPhoto(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.size <= 768 * 1024) return file;
  const bitmap = await createImageBitmap(file),
    canvas = document.createElement("canvas"),
    scale = Math.min(1, 1500 / Math.max(bitmap.width, bitmap.height));
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx)
    throw Error("Não conseguimos preparar a foto. Tente um arquivo menor.");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.78),
  );
  if (!blob) throw Error("Não conseguimos preparar a foto.");
  return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", {
    type: "image/jpeg",
  });
}
export function ExpenseEntry({
  entry,
  onClose,
  state,
  round,
  save,
  busy,
  now,
  error,
  previewOnly,
  onDirty,
}: {
  entry: {
    id?: string;
    fairId?: string;
    roundId?: string;
    category?: string;
  } | null;
  onClose: () => void;
  state: State;
  round: Round | undefined;
  save: (op: Operation) => Promise<boolean>;
  busy: boolean;
  now: Date;
  error: string;
  previewOnly: boolean;
  onDirty: (dirty: boolean) => void;
}) {
  const [draft, setDraft] = useState({
      description: "",
      amount: "",
      date: "",
      category: "Insumos",
      roundId: "",
      fairId: "",
      status: "pago",
      paidOn: "",
      supplier: "",
      reason: "",
    }),
    [expenseId, setExpenseId] = useState(""),
    [createdId, setCreatedId] = useState(""),
    [editing, setEditing] = useState(false),
    [files, setFiles] = useState<FileInfo[]>([]),
    [file, setFile] = useState<File | null>(null),
    [fileBusy, setFileBusy] = useState(false),
    [fileError, setFileError] = useState(""),
    [localError, setLocalError] = useState(""),
    [fileLoadError, setFileLoadError] = useState("");
  const existing = state.expenses.find((e) => e.id === expenseId),
    clock = localClock(now),
    fairOptions = state.rounds.find((r) => r.id === draft.roundId)?.fairs || [];
  async function loadFiles(id: string) {
    if (previewOnly) return;
    try {
      const r = await fetch(
        "/api/receipts?expenseId=" + encodeURIComponent(id),
        { cache: "no-store" },
      );
      if (r.status === 401)
        window.dispatchEvent(new Event("beto:session-expired"));
      const v: any = await r.json();
      if (!r.ok) throw Error(v.error);
      setFiles(v.files);
      setFileLoadError("");
    } catch {
      setFileLoadError(
        "Não conseguimos consultar os comprovantes. Tente abrir novamente.",
      );
    }
  }
  useEffect(() => {
    if (!entry) return;
    const e = state.expenses.find((e) => e.id === entry.id);
    setDraft({
      description: e?.description || "",
      amount: e ? String((e.amount / 100).toFixed(2)).replace(".", ",") : "",
      date: e?.date || clock.day,
      category: e?.category || entry.category || "Insumos",
      roundId:
        e?.roundId ||
        entry.roundId ||
        (round && clock.day >= round.start && clock.day <= round.end
          ? round.id
          : ""),
      fairId: e?.fairId || entry.fairId || "",
      status: e?.status || "pago",
      paidOn: e?.paidOn || "",
      supplier: e?.supplier || "",
      reason: "",
    });
    setExpenseId(e?.id || "");
    setCreatedId(uid());
    setEditing(!e);
    setFiles([]);
    setFile(null);
    setFileError("");
    setLocalError("");
    setFileLoadError("");
    if (e) void loadFiles(e.id);
  }, [entry]);
  const set = (key: keyof typeof draft, value: string) => {
    setDraft((a) => ({ ...a, [key]: value }));
    onDirty(true);
  };
  async function upload(id: string) {
    if (!file) return true;
    setFileBusy(true);
    setFileError("");
    try {
      const form = new FormData();
      form.set("expenseId", id);
      form.set("file", file);
      const r = await fetch("/api/receipts", { method: "POST", body: form });
      if (r.status === 401)
        window.dispatchEvent(new Event("beto:session-expired"));
      const v: any = await r.json();
      if (!r.ok) throw Error(v.error);
      setFile(null);
      await loadFiles(id);
      return true;
    } catch (e) {
      setFileError(
        e instanceof TypeError
          ? "O gasto está salvo. Confira a conexão para tentar anexar novamente."
          : (e as Error).message,
      );
      return false;
    } finally {
      setFileBusy(false);
    }
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError("");
    if (!editing && expenseId) {
      await upload(expenseId);
      return;
    }
    const normalized = draft.amount.replace(/\./g, "").replace(",", ".");
    if (!/^\d+(\.\d{1,2})?$/.test(normalized) || Number(normalized) <= 0) {
      setLocalError("Informe um valor maior que zero, como 120,00.");
      return;
    }
    const ok = await save({
      kind: "expense",
      roundId: draft.roundId,
      expenseId: expenseId || undefined,
      newExpenseId: expenseId ? undefined : createdId,
      fairId: draft.fairId,
      date: draft.date,
      category: draft.category as
        | "Insumos"
        | "Equipe"
        | "Transporte"
        | "Outros",
      description: draft.description,
      amount: Math.round(Number(normalized) * 100),
      status: draft.status as "pago" | "pendente",
      paidOn: draft.status === "pago" ? draft.paidOn || draft.date : null,
      supplier: draft.supplier,
      correction: !!expenseId,
      reason: draft.reason,
    });
    if (ok) {
      const id = expenseId || createdId;
      setExpenseId(id);
      setEditing(false);
      onDirty(false);
      if (file) {
        if (await upload(id)) onClose();
      } else onClose();
    }
  }
  return (
    <Dialog
      open={!!entry}
      onOpenChange={(v) => {
        if (!v && !busy && !fileBusy) {
          onDirty(false);
          onClose();
        }
      }}
    >
      <DialogContent className="beto-dialog m-expense-dialog">
        <DialogTitle>
          {expenseId ? "Detalhes do gasto" : "Registrar gasto"}
        </DialogTitle>
        <DialogDescription>
          {expenseId
            ? "Consulte o registro e os comprovantes. Toda correção guarda seu motivo."
            : "Valor, descrição e data. A nota é opcional."}
        </DialogDescription>
        <form onSubmit={submit}>
          {editing ? (
            <>
              <Field label="Valor">
                <div className="moneyinput">
                  <span>R$</span>
                  <input
                    inputMode="decimal"
                    aria-label="Valor do gasto"
                    placeholder="0,00"
                    required
                    value={draft.amount}
                    onChange={(e) => set("amount", e.target.value)}
                    autoFocus
                  />
                </div>
              </Field>
              <Field label="Com o que foi gasto?">
                <input
                  required
                  maxLength={200}
                  placeholder="Ex.: gás, frango, óleo"
                  value={draft.description}
                  onChange={(e) => set("description", e.target.value)}
                />
              </Field>
              <div className="m-two-fields">
                <Field label="Data do gasto">
                  <input
                    required
                    type="date"
                    max={clock.day}
                    value={draft.date}
                    onChange={(e) => set("date", e.target.value)}
                  />
                </Field>
                <Field label="Situação">
                  <select
                    value={draft.status}
                    onChange={(e) => set("status", e.target.value)}
                  >
                    <option value="pago">Pago</option>
                    <option value="pendente">A pagar</option>
                  </select>
                </Field>
              </div>
              <details className="m-expense-context">
                <summary>Categoria, fornecedor e vínculo com a feira</summary>
                <Field label="Categoria">
                  <select
                    value={draft.category}
                    onChange={(e) => set("category", e.target.value)}
                  >
                    {["Insumos", "Equipe", "Transporte", "Outros"].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </Field>
                <Field
                  label={
                    draft.category === "Equipe"
                      ? "Nome do colaborador (opcional)"
                      : "Fornecedor (opcional)"
                  }
                >
                  <input
                    maxLength={100}
                    list="beto-suppliers"
                    value={draft.supplier}
                    onChange={(e) => set("supplier", e.target.value)}
                  />
                  <datalist id="beto-suppliers">
                    {[
                      ...new Set(
                        state.expenses.map((e) => e.supplier).filter(Boolean),
                      ),
                    ].map((n) => (
                      <option key={n} value={n} />
                    ))}
                  </datalist>
                </Field>
                <Field label="Semana (opcional)">
                  <select
                    value={draft.roundId}
                    onChange={(e) => {
                      set("roundId", e.target.value);
                      set("fairId", "");
                    }}
                  >
                    <option value="">Sem vínculo com semana</option>
                    {[...state.rounds].reverse().map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.start.split("-").reverse().join("/")} a{" "}
                        {r.end.split("-").reverse().join("/")}
                      </option>
                    ))}
                  </select>
                </Field>
                {fairOptions.length > 0 && (
                  <Field label="Feira (opcional)">
                    <select
                      value={draft.fairId}
                      onChange={(e) => set("fairId", e.target.value)}
                    >
                      <option value="">Gasto geral da semana</option>
                      {fairOptions.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                )}
                {draft.status === "pago" && (
                  <Field label="Data do pagamento">
                    <input
                      type="date"
                      max={clock.day}
                      value={draft.paidOn}
                      onChange={(e) => set("paidOn", e.target.value)}
                    />
                  </Field>
                )}
              </details>
              {expenseId && (
                <Field label="Motivo da correção">
                  <input
                    required
                    minLength={3}
                    maxLength={300}
                    value={draft.reason}
                    onChange={(e) => set("reason", e.target.value)}
                  />
                </Field>
              )}
            </>
          ) : (
            <div className="m-expense-detail">
              <strong>
                {moneyText(
                  existing?.amount ||
                    Math.round(Number(draft.amount.replace(",", ".")) * 100),
                )}
              </strong>
              <h3>{existing?.description || draft.description}</h3>
              <p>
                {draft.date.split("-").reverse().join("/")} · {draft.category} ·{" "}
                {draft.status === "pago" ? "Pago" : "A pagar"}
              </p>
              {existing?.createdBy && (
                <small>Registrado por {existing.createdBy}</small>
              )}
              <button
                type="button"
                className="textbtn"
                onClick={() => setEditing(true)}
              >
                Corrigir registro
              </button>
            </div>
          )}
          <section className="m-receipt-section">
            <h3>
              <Paperclip size={17} />
              Nota ou comprovante <span>opcional</span>
            </h3>
            {previewOnly ? (
              <p>
                Os anexos privados ficam disponíveis no aplicativo com acesso.
              </p>
            ) : (
              <>
                <label className="m-file-label">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    disabled={fileBusy || busy}
                    onChange={async (e) => {
                      const picked = e.target.files?.[0];
                      if (!picked) return;
                      setFileError("");
                      setFileBusy(true);
                      try {
                        const photo = await compactPhoto(picked);
                        if (photo.size > 768 * 1024)
                          throw Error(
                            "Use um PDF de até 768 KB ou uma foto menor.",
                          );
                        setFile(photo);
                      } catch (err) {
                        setFileError((err as Error).message);
                      } finally {
                        setFileBusy(false);
                      }
                    }}
                  />
                  <Paperclip size={17} />
                  {fileBusy
                    ? "Preparando arquivo…"
                    : file
                      ? file.name
                      : "Anexar nota (opcional)"}
                </label>
                <p>
                  Foto ou PDF. Fotos grandes são reduzidas para envio. Até três
                  arquivos por gasto.
                </p>
                {file && (
                  <button
                    type="button"
                    className="textbtn"
                    onClick={() => setFile(null)}
                  >
                    Remover arquivo selecionado
                  </button>
                )}
                {files.map((f) => (
                  <a
                    className="m-file-link"
                    key={f.id}
                    target="_blank"
                    rel="noopener noreferrer"
                    href={"/api/receipts?id=" + encodeURIComponent(f.id)}
                  >
                    <ReceiptText size={17} />
                    <span>
                      {f.name}
                      <small>
                        {Math.ceil(f.size / 1024)} KB · {f.created_by}
                      </small>
                    </span>
                    <ExternalLink size={15} />
                  </a>
                ))}
                {fileLoadError && (
                  <p role="alert" className="formerror">
                    {fileLoadError}
                  </p>
                )}
              </>
            )}
            {fileError && (
              <p role="alert" className="formerror">
                {fileError}
              </p>
            )}
          </section>
          {(localError || error) && (
            <p className="formerror" role="alert">
              {localError || error}
            </p>
          )}
          <div className="m-save-row">
            <button
              className="btn secondary"
              type="button"
              disabled={busy || fileBusy}
              onClick={() => {
                onDirty(false);
                onClose();
              }}
            >
              {editing ? "Cancelar" : "Fechar"}
            </button>
            {(editing || file) && (
              <button className="btn" disabled={busy || fileBusy}>
                {busy
                  ? "Salvando…"
                  : fileBusy
                    ? "Enviando…"
                    : !editing
                      ? "Salvar comprovante"
                      : expenseId
                        ? "Salvar correção"
                        : "Registrar gasto"}
              </button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
