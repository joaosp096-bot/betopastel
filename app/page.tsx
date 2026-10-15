"use client";
import { useState, useEffect, useRef } from "react";
import { LayoutGroup, MotionConfig } from "framer-motion";
import {
  Home,
  ChefHat,
  Store,
  Wallet,
  History,
  Settings,
  Plus,
  Check,
  ChevronRight,
  Download,
  RefreshCw,
  MapPin,
  LogOut,
  CalendarDays,
  ArrowRight,
  ClipboardCheck,
  SquarePen,
  Trash2,
  Info,
} from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import {
  State,
  Round,
  Fair,
  Flavor,
  emptyState,
  demoState,
  stats,
  estimated,
  revenue,
  available,
  uid,
  weekStart,
  dateText,
  addDays,
  moneyText,
} from "@/lib/model";
import {
  Actor,
  Operation,
  applyOperation,
  taskFor,
  localClock,
  productionOpen,
  fairPhase,
  closingOpen,
  loadLocked,
  keyFor,
  baseFlavors,
  daySealed,
  requiredReturns,
} from "@/lib/workflow";
import { FoodCard } from "@/components/beto/FoodCard";
import { FlavorTask, FlavorTaskSpec } from "@/components/beto/FlavorTask";
import { DayTimeline } from "@/components/beto/DayTimeline";
import { AuthGate, useBetoAuth } from "@/components/beto/AuthGate";
import { AccountSettings } from "@/components/beto/AccountSettings";
type Screen =
  | "hoje"
  | "producao"
  | "feiras"
  | "caixa"
  | "historico"
  | "configurar";
const nav = [
  { id: "hoje", label: "Hoje", icon: Home },
  { id: "producao", label: "Produção", icon: ChefHat },
  { id: "feiras", label: "Feiras", icon: Store },
  { id: "caixa", label: "Caixa", icon: Wallet },
  { id: "historico", label: "Histórico", icon: History },
  { id: "configurar", label: "Configurar", icon: Settings },
] as const;
type Modal = {
  kind:
    | "round"
    | "production-day"
    | "expense"
    | "expense-cancel"
    | "cash"
    | "receipt"
    | "seal-production"
    | "seal-return"
    | "confirm-load"
    | "close-round"
    | "correction"
    | "reopen-round"
    | "revision";
  fairId?: string;
  expenseId?: string;
  target?: FlavorTaskSpec;
};
const phaseLabels = {
  preparacao: "Carga confirmada",
  em_feira: "Dia de feira",
  fechamento: "Retorno / caixa",
  concluida: "Registrada",
  horario_pendente: "Horário a confirmar",
  carga_pendente: "Conferir carga",
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
function Currency({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <Field label={label}>
      <div className="moneyinput">
        <span>R$</span>
        <input
          type="number"
          step="0.01"
          min="0"
          max="1000000"
          aria-label={label}
          value={value / 100}
          onChange={(e) =>
            onChange(Math.max(0, Math.round(Number(e.target.value) * 100)))
          }
        />
      </div>
    </Field>
  );
}
function Summary({
  label,
  value,
  detail,
}: {
  label: string;
  value: React.ReactNode;
  detail?: string;
}) {
  return (
    <div className="summaryitem">
      <span>{label}</span>
      <strong>{value}</strong>
      {detail && <small>{detail}</small>}
    </div>
  );
}
function Filter({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="groupfilter" role="group" aria-label="Local de preparo">
      <button
        type="button"
        aria-pressed={value === "base"}
        onClick={() => onChange("base")}
      >
        Na base
      </button>
      <button
        type="button"
        aria-pressed={value === "na_feira"}
        onClick={() => onChange("na_feira")}
      >
        Na feira
      </button>
    </div>
  );
}
function AppNavigation({
  screen,
  onNavigate,
}: {
  screen: Screen;
  onNavigate: (s: Screen) => void;
}) {
  const { setOpenMobile } = useSidebar();
  return (
    <SidebarMenu>
      {nav.map((n) => (
        <SidebarMenuItem key={n.id}>
          <SidebarMenuButton
            className="navitem"
            isActive={screen === n.id}
            onClick={() => {
              onNavigate(n.id);
              setOpenMobile(false);
            }}
          >
            <n.icon size={20} />
            <span>{n.label}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
export default function App({
  previewOnly = false,
}: {
  previewOnly?: boolean;
}) {
  return previewOnly ? (
    <BetoApp previewOnly />
  ) : (
    <AuthGate>
      <BetoApp />
    </AuthGate>
  );
}
function BetoApp({ previewOnly = false }: { previewOnly?: boolean }) {
  const auth = useBetoAuth();
  const [data, setData] = useState<State>(emptyState),
    [version, setVersion] = useState(0),
    [loaded, setLoaded] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [screen, setScreen] = useState<Screen>("hoje"),
    [roundId, setRoundId] = useState(""),
    [fairId, setFairId] = useState(""),
    [group, setGroup] = useState("base"),
    [task, setTask] = useState<FlavorTaskSpec | null>(null),
    [modal, setModal] = useState<Modal | null>(null),
    [draft, setDraft] = useState<any>({}),
    [cashStep, setCashStep] = useState(0),
    [audit, setAudit] = useState<any[]>([]),
    [saved, setSaved] = useState<string | null>(null),
    [receipt, setReceipt] = useState<State["records"][number] | null>(null),
    [actor, setActor] = useState<Actor>({
      userId: "",
      name: "Equipe",
      role: "operador",
    }),
    [now, setNow] = useState(new Date()),
    [previewMoment, setPreviewMoment] = useState("quarta"),
    [catalog, setCatalog] = useState<Flavor[]>([]),
    [settings, setSettings] = useState<State["settings"] | null>(null),
    [configDirty, setConfigDirty] = useState(false),
    [newName, setNewName] = useState(""),
    [newKind, setNewKind] = useState<"base" | "na_feira">("base"),
    [revision, setRevision] = useState<any>(null),
    [formError, setFormError] = useState("");
  const dataRef = useRef(data),
    versionRef = useRef(version),
    lock = useRef(false),
    pending = useRef<{ id: string; body: string } | null>(null),
    timeRef = useRef({ server: Date.now(), received: Date.now() });
  const round = data.rounds.find((r) => r.id === roundId) || data.rounds.at(-1),
    clock = localClock(now),
    productionDay = round?.productionDay || round?.start || clock.day,
    next = taskFor(data, round, now),
    fair =
      round?.fairs.find((f) => f.id === fairId) ||
      round?.fairs.find((f) => f.id === next.fairId) ||
      round?.fairs.find((f) => f.date === clock.day) ||
      round?.fairs[0],
    metrics = stats(round, data),
    admin = actor.role === "admin",
    closed = round?.status === "concluida",
    base = baseFlavors(data);
  const recorded = (
    kind: string,
    flavorId: string,
    day = productionDay,
    fa = fair,
  ) =>
    !!round &&
    data.records.some(
      (e) =>
        e.key ===
        keyFor(
          round.id,
          kind,
          day,
          flavorId,
          kind === "return" || kind === "load" ? fa?.id || "" : "",
        ),
    );
  const prodDone = base.filter((f) => recorded("production", f.id)).length,
    allocationDone = base.filter((f) => recorded("allocation", f.id)).length,
    sealed = round ? daySealed(data, round, productionDay) : false;
  const returnLines = fair ? requiredReturns(fair, data) : [],
    returnDone = returnLines.filter((l) =>
      recorded("return", l.flavorId, fair!.date, fair),
    ).length;
  const groupItems = data.flavors.filter(
    (f) =>
      f.active && f.prepKind === (group === "na_feira" ? "na_feira" : "base"),
  );
  const steps = [
    {
      label: "Contar sabores",
      done: prodDone === base.length,
      detail: `${prodDone}/${base.length} salvos`,
    },
    {
      label: "Separar feiras",
      done: allocationDone === base.length,
      detail: `${allocationDone}/${base.length} salvos`,
    },
    {
      label: "Concluir produção",
      done: sealed,
      detail: sealed ? "Confirmada" : "Revisar e confirmar",
    },
  ];
  function applyData(s: State, v: number, updated: string | null) {
    dataRef.current = s;
    versionRef.current = v;
    setData(s);
    setVersion(v);
    setSaved(updated);
  }
  async function load(preserve = false) {
    if (previewOnly) {
      const s = demoState();
      applyData(s, 0, null);
      setRoundId(s.rounds[0].id);
      setActor({ userId: "preview-robson", name: "Robson", role: "operador" });
      setNow(new Date(s.rounds[0].start + "T09:00:00-03:00"));
      setLoaded(true);
      return;
    }
    try {
      const r = await fetch("/api/state", { cache: "no-store" }),
        v: any = await r.json();
      if (r.status === 401) {
        window.dispatchEvent(new Event("beto:session-expired"));
        setLoaded(true);
        return;
      }
      if (!r.ok) throw Error(v.error);
      applyData(v.state, v.version, v.updated);
      setActor(v.actor);
      setAudit(v.audit);
      timeRef.current = {
        server: Date.parse(v.serverTime),
        received: Date.now(),
      };
      setNow(new Date(v.serverTime));
      setLoaded(true);
      setError("");
    } catch (e) {
      if (preserve) toast.error((e as Error).message);
      else {
        setError((e as Error).message);
        setLoaded(true);
      }
    }
  }
  useEffect(() => {
    void load();
    const read = () => {
      const s = location.hash.slice(1);
      if (nav.some((n) => n.id === s)) setScreen(s as Screen);
    };
    read();
    window.addEventListener("hashchange", read);
    const authenticated = () => void load(true);
    window.addEventListener("beto:authenticated", authenticated);
    return () => {
      window.removeEventListener("hashchange", read);
      window.removeEventListener("beto:authenticated", authenticated);
    };
  }, []);
  useEffect(() => {
    if (previewOnly) return;
    const timer = setInterval(
      () =>
        setNow(
          new Date(
            timeRef.current.server + Date.now() - timeRef.current.received,
          ),
        ),
      15000,
    );
    return () => clearInterval(timer);
  }, [previewOnly]);
  useEffect(() => {
    if (previewOnly) return;
    const timer = setInterval(() => {
      if (!task && !modal && !busy && !configDirty) void load(true);
    }, 180000);
    return () => clearInterval(timer);
  }, [task, modal, busy, configDirty, previewOnly]);
  useEffect(() => {
    if (screen === "configurar" && !configDirty) {
      setCatalog(structuredClone(data.flavors));
      setSettings(structuredClone(data.settings));
    }
  }, [screen, data.flavors, data.settings]);
  useEffect(() => {
    const prevent = (e: BeforeUnloadEvent) => {
      if (task || modal || configDirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", prevent);
    return () => window.removeEventListener("beforeunload", prevent);
  }, [task, modal, configDirty]);
  function go(s: Screen) {
    if (configDirty) {
      toast.warning("Salve ou cancele as alterações antes de sair.");
      return;
    }
    setScreen(s);
    location.hash = s;
    setGroup("base");
  }
  function setMoment(v: string) {
    if (task || modal) {
      toast.warning("Feche o formulário antes de mudar o dia.");
      return;
    }
    setPreviewMoment(v);
    const map: Record<string, [number, string]> = {
      quarta: [0, "09:00"],
      quinta: [1, "09:00"],
      sexta: [2, "13:00"],
      sabado: [3, "13:00"],
      domingo: [4, "13:00"],
      segunda: [5, "10:00"],
    };
    if (round) {
      const [offset, time] = map[v];
      setNow(new Date(addDays(round.start, offset) + "T" + time + ":00-03:00"));
    }
  }
  async function save(op: Operation) {
    if (lock.current) return false;
    lock.current = true;
    setBusy(true);
    setFormError("");
    try {
      let v: any;
      if (previewOnly) {
        const result = applyOperation(dataRef.current, op, { ...actor, now });
        v = {
          ...result,
          version: versionRef.current + 1,
          updated: now.toISOString(),
          serverTime: now.toISOString(),
        };
      } else {
        const body = JSON.stringify(op);
        if (!pending.current || pending.current.body !== body)
          pending.current = { id: uid(), body };
        const r = await fetch("/api/state", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            operation: op,
            version: versionRef.current,
            requestId: pending.current.id,
          }),
        });
        v = await r.json();
        if (r.status === 401) {
          window.dispatchEvent(new Event("beto:session-expired"));
          return false;
        }
        if (!r.ok) {
          if (v.conflict) {
            pending.current = null;
            setFormError(v.error);
            toast.error(v.error, {
              duration: 10000,
              action: { label: "Atualizar", onClick: () => void load(true) },
            });
            return false;
          }
          throw Error(v.error);
        }
      }
      applyData(v.state, v.version, v.updated);
      setReceipt(v.receipt || null);
      if (!v.idempotent)
        setAudit((a) =>
          [
            {
              id: uid(),
              version: v.version,
              action: actor.name + " · " + v.action,
              created: v.updated,
            },
            ...a,
          ].slice(0, 40),
        );
      if (!previewOnly) {
        timeRef.current = {
          server: Date.parse(v.serverTime),
          received: Date.now(),
        };
        setNow(new Date(v.serverTime));
      }
      pending.current = null;
      toast.success(
        previewOnly ? "Salvo na demonstração" : "Registro confirmado",
      );
      return true;
    } catch (e) {
      const message =
        e instanceof TypeError || e instanceof SyntaxError
          ? "Não conseguimos confirmar o registro. Confira a conexão e tente novamente."
          : (e as Error).message || "Não conseguimos salvar. Tente novamente.";
      setFormError(message);
      toast.error(message, { duration: 8000 });
      return false;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  function openTask(
    f: Flavor,
    kind: FlavorTaskSpec["kind"] = "production",
    fa = fair,
  ) {
    if (!round) return;
    setFormError("");
    setTask({
      flavorId: f.id,
      kind,
      day:
        kind === "return" || kind === "load"
          ? fa?.date || productionDay
          : productionDay,
      fairId: kind === "return" || kind === "load" ? fa?.id : undefined,
    });
  }
  function nextFlavor(t: FlavorTaskSpec) {
    const s = dataRef.current,
      r = s.rounds.find((r) => r.id === round?.id);
    if (!r) {
      setTask(null);
      return;
    }
    const fa = r.fairs.find((f) => f.id === t.fairId);
    if (t.kind === "load" || t.correction) {
      setTask(null);
      return;
    }
    const items =
      t.kind === "return"
        ? s.flavors.filter((f) =>
            requiredReturns(fa!, s).some((l) => l.flavorId === f.id),
          )
        : baseFlavors(s);
    const f = items.find((f) =>
      t.kind === "return"
        ? !s.records.some(
            (e) => e.key === keyFor(r.id, "return", fa!.date, f.id, fa!.id),
          )
        : !s.records.some(
            (e) => e.key === keyFor(r.id, "allocation", t.day, f.id),
          ) ||
          !s.records.some(
            (e) => e.key === keyFor(r.id, "production", t.day, f.id),
          ),
    );
    if (f) setTask({ ...t, flavorId: f.id });
    else {
      setTask(null);
      toast.success("Todos os sabores salvos. Revise e conclua o processo.");
    }
  }
  function open(m: Modal) {
    if (!round && m.kind !== "round") return;
    setFormError("");
    setModal(m);
    setCashStep(0);
    if (m.kind === "round") {
      const start = weekStart(clock.day);
      setDraft({
        start,
        productionDay: clock.weekday === 4 ? addDays(start, 1) : start,
      });
    } else if (m.kind === "production-day") {
      setDraft({
        start: round!.start,
        productionDay: round!.productionDay || round!.start,
      });
    } else if (m.kind === "expense") {
      const e = data.expenses.find((e) => e.id === m.expenseId);
      setDraft(
        e
          ? { ...e, expenseId: e.id, reason: "", correction: true }
          : {
              description: "",
              category: "Insumos",
              date: clock.day,
              amount: 0,
              fairId: "",
            },
      );
    } else if (m.kind === "cash") {
      const f = round?.fairs.find((f) => f.id === m.fairId);
      setDraft({ ...f?.cash, reason: "", correction: !!f?.cash.closed });
    } else if (
      ["correction", "reopen-round", "expense-cancel"].includes(m.kind)
    )
      setDraft({ reason: "" });
    else setDraft({});
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!modal) return;
    if (modal.kind === "cash" && cashStep < 2) {
      setCashStep((v) => v + 1);
      return;
    }
    if (modal.kind === "correction") {
      if (draft.reason.trim().length < 3) {
        setFormError("Informe um motivo curto.");
        return;
      }
      if (modal.target)
        setTask({ ...modal.target, correction: true, reason: draft.reason });
      setModal(null);
      return;
    }
    let op: Operation | null = null;
    if (modal.kind === "round")
      op = {
        kind: "round",
        start: draft.start,
        productionDay: draft.productionDay,
      };
    if (modal.kind === "production-day" && round)
      op = {
        kind: "production-day",
        roundId: round.id,
        day: draft.productionDay,
      };
    if (modal.kind === "expense" && round)
      op = {
        kind: "expense",
        roundId: round.id,
        expenseId: draft.expenseId,
        fairId: draft.fairId || "",
        date: draft.date,
        description: draft.description,
        amount: draft.amount,
        category: draft.category,
        correction: draft.correction,
        reason: draft.reason,
      };
    if (modal.kind === "expense-cancel" && round)
      op = {
        kind: "expense-cancel",
        roundId: round.id,
        expenseId: modal.expenseId!,
        reason: draft.reason,
      };
    if (modal.kind === "cash" && round)
      op = {
        kind: "cash",
        roundId: round.id,
        fairId: modal.fairId!,
        float: draft.float,
        cash: draft.cash,
        pix: draft.pix,
        card: draft.card,
        withdrawal: draft.withdrawal,
        correction: draft.correction,
        reason: draft.reason,
      };
    if (modal.kind === "seal-production" && round)
      op = { kind: "seal-production", roundId: round.id, day: productionDay };
    if (modal.kind === "seal-return" && round)
      op = { kind: "seal-return", roundId: round.id, fairId: modal.fairId! };
    if (modal.kind === "confirm-load" && round)
      op = { kind: "confirm-load", roundId: round.id, fairId: modal.fairId! };
    if (modal.kind === "close-round" && round)
      op = { kind: "close-round", roundId: round.id };
    if (modal.kind === "reopen-round" && round)
      op = { kind: "reopen-round", roundId: round.id, reason: draft.reason };
    if (op && (await save(op))) {
      setModal(null);
      if (op.kind === "round") {
        setRoundId(dataRef.current.rounds.at(-1)!.id);
        go("producao");
      } else if (
        [
          "seal-production",
          "seal-return",
          "cash",
          "close-round",
          "confirm-load",
        ].includes(op.kind)
      )
        setModal({ kind: "receipt", fairId: modal.fairId });
    }
  }
  function primary() {
    if (!round) {
      open({ kind: "round" });
      return;
    }
    if (next.kind === "production") {
      go("producao");
      const f = base.find(
        (f) => !recorded("production", f.id) || !recorded("allocation", f.id),
      );
      if (f) openTask(f);
      else open({ kind: "seal-production" });
    } else if (next.kind === "allocation") {
      setFairId(next.fairId!);
      go("feiras");
    } else if (next.kind === "return") {
      const fa = round.fairs.find((f) => f.id === next.fairId)!;
      setFairId(fa.id);
      go("feiras");
      const f = data.flavors.find(
        (f) =>
          requiredReturns(fa, data).some((l) => l.flavorId === f.id) &&
          !recorded("return", f.id, fa.date, fa),
      );
      if (f) openTask(f, "return", fa);
      else open({ kind: "seal-return", fairId: fa.id });
    } else if (next.kind === "cash")
      open({ kind: "cash", fairId: next.fairId });
    else if (round.fairs.every((f) => f.returnSealed) && !closed)
      open({ kind: "close-round" });
    else go(next.kind === "done" ? "historico" : "feiras");
  }
  function download() {
    const blob = new Blob(
        [
          JSON.stringify(
            {
              app: "Beto Pastel",
              version: 3,
              exportedAt: new Date().toISOString(),
              state: data,
            },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      ),
      a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "Beto_Pastel_Registros_" + clock.day + ".json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  async function showRevision(v: number) {
    if (previewOnly) {
      toast.info(
        "A demonstração guarda o estado atual na sessão. As revisões completas ficam no aplicativo com banco.",
      );
      return;
    }
    setRevision(null);
    setModal({ kind: "revision" });
    setFormError("");
    try {
      const r = await fetch("/api/history?version=" + v),
        d: any = await r.json();
      if (!r.ok) throw Error(d.error);
      setRevision(d);
    } catch (e) {
      setFormError((e as Error).message);
    }
  }
  async function logout() {
    if (configDirty || task || modal) {
      toast.warning("Salve ou cancele o formulário antes de sair.");
      return;
    }
    try {
      await auth.logout();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }
  const currentCash = round?.fairs.find((f) => f.id === modal?.fairId);
  const modalTitle =
    modal?.kind === "production-day"
      ? "Dia de produção"
      : modal?.kind === "round"
        ? "Nova rodada"
        : modal?.kind === "cash"
          ? "Caixa da feira"
          : modal?.kind === "expense"
            ? "Gasto da rodada"
            : modal?.kind === "expense-cancel"
              ? "Cancelar gasto"
              : modal?.kind === "correction"
                ? "Corrigir registro"
                : modal?.kind === "receipt"
                  ? "Registro confirmado"
                  : modal?.kind === "close-round"
                    ? "Concluir a operação"
                    : modal?.kind === "reopen-round"
                      ? "Reabrir a operação"
                      : modal?.kind === "revision"
                        ? "Revisão do histórico"
                        : modal?.kind === "confirm-load"
                          ? "Confirmar a carga"
                          : modal?.kind === "seal-return"
                            ? "Concluir o retorno"
                            : "Concluir a produção";
  return (
    <MotionConfig
      reducedMotion="user"
      transition={{ type: "spring", stiffness: 380, damping: 38 }}
    >
      <LayoutGroup id="beto">
        <SidebarProvider>
          <a href="#conteudo" className="skiplink">
            Ir para o conteúdo
          </a>
          <Sidebar className="appsidebar">
            <SidebarHeader>
              <a
                className="brand"
                href="#hoje"
                onClick={(e) => {
                  e.preventDefault();
                  go("hoje");
                }}
              >
                Beto
                <span>
                  Pastel<span className="branddot">.</span>
                </span>
              </a>
              <p className="brandcaption">Nossa semana, organizada.</p>
            </SidebarHeader>
            <SidebarContent>
              <AppNavigation screen={screen} onNavigate={go} />
            </SidebarContent>
            <SidebarFooter>
              <div className="usercard">
                <span>{actor.name.slice(0, 1)}</span>
                <div>
                  <strong>{actor.name}</strong>
                  <small>{admin ? "Administrador" : "Operação"}</small>
                </div>
              </div>
              <button
                className="sidebarbutton"
                onClick={download}
                disabled={!loaded || !!error}
              >
                <Download size={18} />
                Exportar registros
              </button>
              {!previewOnly && (
                <button className="sidebarbutton" onClick={() => void logout()}>
                  <LogOut size={18} />
                  Sair
                </button>
              )}
            </SidebarFooter>
          </Sidebar>
          <div className="workspace">
            <header className="topbar">
              <div className="mobilebrand">
                <SidebarTrigger aria-label="Abrir menu" />
                <strong>Beto Pastel</strong>
              </div>
              <div className="topcontext">
                <Store size={18} />
                <span>Produção e feiras</span>
              </div>
              <div className="saveState" aria-live="polite">
                {busy ? (
                  "Confirmando registro…"
                ) : saved ? (
                  <>
                    <Check size={17} />
                    Registros salvos
                  </>
                ) : (
                  "Tudo pronto para começar"
                )}
              </div>
              <span className="topavatar">{actor.name.slice(0, 1)}</span>
            </header>
            {previewOnly && (
              <section
                className="previewbar"
                aria-label="Controles da demonstração"
              >
                <strong>Demonstração · dados de teste</strong>
                <label>
                  <span className="sr-only">Simular dia</span>
                  <select
                    aria-label="Simular dia"
                    value={previewMoment}
                    onChange={(e) => setMoment(e.target.value)}
                  >
                    {[
                      ["quarta", "Quarta · produção"],
                      ["quinta", "Quinta · produção"],
                      ["sexta", "Sexta · retorno"],
                      ["sabado", "Sábado · retorno"],
                      ["domingo", "Domingo · retorno"],
                      ["segunda", "Segunda · pendências"],
                    ].map(([v, label]) => (
                      <option key={v} value={v}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="sr-only">Simular pessoa</span>
                  <select
                    aria-label="Simular pessoa"
                    value={actor.name}
                    onChange={(e) => {
                      if (task || modal) {
                        toast.warning(
                          "Feche o formulário antes de mudar a pessoa.",
                        );
                        return;
                      }
                      const name = e.target.value;
                      setActor({
                        userId: "preview-" + name,
                        name,
                        role: name === "João" ? "admin" : "operador",
                      });
                    }}
                  >
                    {["Robson", "Erly", "João"].map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </select>
                </label>
                <span>Os dados reiniciam ao recarregar.</span>
              </section>
            )}
            <main id="conteudo" tabIndex={-1}>
              <div className="pagehead">
                <div>
                  <h1>
                    {screen === "hoje"
                      ? "Sua semana, no ponto."
                      : nav.find((n) => n.id === screen)?.label}
                  </h1>
                  <p>
                    {screen === "hoje"
                      ? "Produção, carga e retorno no mesmo lugar."
                      : screen === "producao"
                        ? `Um dia na base: ${round ? new Date(productionDay + "T12:00:00Z").toLocaleDateString("pt-BR", { weekday: "long" }) + " · " + dateText(productionDay) : "quarta ou quinta"}.`
                        : screen === "feiras"
                          ? "Confira cada carga e registre o que voltou."
                          : screen === "caixa"
                            ? "Recebimentos e gastos, sem registrar venda por venda."
                            : screen === "historico"
                              ? "Cada confirmação e correção tem seu lugar."
                              : "Preços, horários e acesso da equipe."}
                  </p>
                </div>
                <div className="headcontrols">
                  {data.rounds.length > 0 && (
                    <label className="roundselect">
                      <CalendarDays size={18} />
                      <span className="sr-only">Selecionar rodada</span>
                      <select
                        aria-label="Selecionar rodada"
                        value={round?.id || ""}
                        onChange={(e) => {
                          setRoundId(e.target.value);
                          setFairId("");
                          setGroup("base");
                        }}
                      >
                        {[...data.rounds].reverse().map((r) => (
                          <option value={r.id} key={r.id}>
                            {dateText(r.start)} — {dateText(r.end)}
                            {r.status === "concluida"
                              ? " · operação concluída"
                              : ""}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  <button
                    className="refreshbutton"
                    aria-label="Atualizar registros"
                    disabled={busy || !!task || !!modal || configDirty}
                    onClick={() => void load(true)}
                  >
                    <RefreshCw size={19} />
                  </button>
                </div>
              </div>
              {!loaded ? (
                <div
                  className="loadingsurface"
                  aria-label="Carregando registros"
                >
                  <div className="skeleton title" />
                  <div className="skeleton block" />
                  <div className="skeleton line" />
                </div>
              ) : error ? (
                <div className="empty">
                  <h2>Não conseguimos abrir os registros.</h2>
                  <p>{error}</p>
                  <button className="btn" onClick={() => void load()}>
                    Tentar novamente
                  </button>
                </div>
              ) : (
                <>
                  {closed && (
                    <div className="closedbar">
                      <Check size={18} />
                      <span>
                        Operação concluída ·{" "}
                        {round!.fairs.filter((f) => !f.cash.closed).length
                          ? `${round!.fairs.filter((f) => !f.cash.closed).length} caixas podem ser registrados depois`
                          : "retornos e caixas salvos"}
                      </span>
                      {admin && (
                        <button
                          className="textbtn"
                          onClick={() => open({ kind: "reopen-round" })}
                        >
                          Reabrir com motivo
                        </button>
                      )}
                    </div>
                  )}
                  {screen === "hoje" && (
                    <>
                      <section className="todayfocus">
                        <div className="focuscopy">
                          <h2>{next.title}</h2>
                          <p>{next.subtitle}</p>
                          <button
                            className="btn"
                            onClick={primary}
                            disabled={busy}
                          >
                            {!round
                              ? "Iniciar rodada"
                              : next.kind === "production"
                                ? "Continuar produção"
                                : next.kind === "return"
                                  ? "Registrar retorno"
                                  : next.kind === "cash"
                                    ? "Registrar caixa"
                                    : next.kind === "allocation"
                                      ? "Conferir carga"
                                      : round.fairs.every(
                                            (f) => f.returnSealed,
                                          ) && !closed
                                        ? "Concluir operação"
                                        : "Ver minha semana"}
                            <ArrowRight size={19} />
                          </button>
                        </div>
                        <div className="focusprocess">
                          {round ? (
                            <>
                              <h3>
                                {sealed
                                  ? "Produção confirmada"
                                  : "Próximos passos"}
                              </h3>
                              <DayTimeline steps={steps} />
                              <p>
                                Produção na base em {dateText(productionDay)}.
                                As feiras continuam sexta, sábado e domingo.
                              </p>
                            </>
                          ) : (
                            <>
                              <img
                                src="/images/pastel.png"
                                alt="Pastel de carne com queijo, imagem ilustrativa"
                                width="340"
                                height="255"
                              />
                              <small>Imagem ilustrativa</small>
                            </>
                          )}
                        </div>
                      </section>
                      <section
                        className="summarystrip"
                        aria-label="Resumo da rodada"
                      >
                        <Summary
                          label="Produzidos na base"
                          value={metrics.produced}
                        />
                        <Summary
                          label="Saída estimada"
                          value={
                            round?.fairs.some((f) => f.returnSealed)
                              ? metrics.output
                              : "—"
                          }
                          detail={`${round?.fairs.filter((f) => f.returnSealed).length || 0}/3 retornos concluídos`}
                        />
                        <Summary
                          label="Taxa de retorno"
                          value={
                            metrics.returnRate === null
                              ? "—"
                              : metrics.returnRate
                                  .toFixed(1)
                                  .replace(".", ",") + "%"
                          }
                          detail="Retorno não é todo desperdício"
                        />
                        <Summary
                          label="Resultado parcial"
                          value={moneyText(metrics.net)}
                          detail={`${metrics.cashCount}/3 caixas registrados`}
                        />
                      </section>
                      <div className="sectionhead">
                        <h2>As três feiras</h2>
                        {round ? (
                          <button
                            className="textbtn"
                            onClick={() => go("feiras")}
                          >
                            Abrir feiras <ChevronRight size={17} />
                          </button>
                        ) : null}
                      </div>
                      {round ? (
                        <div className="fairgrid">
                          {round.fairs.map((f) => (
                            <article className="scheduledfair" key={f.id}>
                              <div className="scheduledday">
                                <span>
                                  {new Date(
                                    f.date + "T12:00:00Z",
                                  ).toLocaleDateString("pt-BR", {
                                    weekday: "long",
                                  })}
                                </span>
                                <b>{dateText(f.date)}</b>
                              </div>
                              <h3>{f.name}</h3>
                              <p>
                                <MapPin size={15} />
                                {f.transport}
                              </p>
                              <span className="pill neutral">
                                {f.returnSealed
                                  ? "Retorno salvo"
                                  : phaseLabels[fairPhase(f, now)]}
                              </span>
                              <div className="scheduledfooter">
                                <span>
                                  {f.lines.reduce((a, l) => a + l.taken, 0)} na
                                  carga
                                </span>
                                <button
                                  className="textbtn"
                                  onClick={() => {
                                    setFairId(f.id);
                                    go("feiras");
                                  }}
                                >
                                  Ver feira <ChevronRight size={16} />
                                </button>
                              </div>
                            </article>
                          ))}
                        </div>
                      ) : (
                        <div className="weekpreview">
                          <article>
                            <strong>Sexta</strong>
                            <h3>Feira dos Amarais</h3>
                            <p>Campinas · Santa Mônica / Chácara dos Amarais</p>
                          </article>
                          <article>
                            <strong>Sábado</strong>
                            <h3>Nova Odessa</h3>
                            <p>Produção e retorno da mesma rodada</p>
                          </article>
                          <article>
                            <strong>Domingo</strong>
                            <h3>Morungaba</h3>
                            <p>Retorno salvo, caixa no seu tempo</p>
                          </article>
                        </div>
                      )}
                      <div className="sectionhead">
                        <h2>Sabores da base</h2>
                        <button
                          className="textbtn"
                          onClick={() => go("producao")}
                        >
                          Ver sabores <ChevronRight size={17} />
                        </button>
                      </div>
                      <div className="foodgrid">
                        {base.slice(0, 4).map((f) => (
                          <FoodCard
                            key={f.id}
                            flavor={f}
                            index={data.flavors.indexOf(f)}
                            value={
                              round?.production.find((p) => p.flavorId === f.id)
                                ?.produced || 0
                            }
                            detail="produzidos na base"
                            done={
                              recorded("production", f.id) &&
                              recorded("allocation", f.id)
                            }
                            locked={
                              !round || sealed || !productionOpen(round, now)
                            }
                            onClick={() =>
                              round
                                ? openTask(
                                    f,
                                    sealed || !productionOpen(round, now)
                                      ? "consult"
                                      : "production",
                                  )
                                : open({ kind: "round" })
                            }
                          />
                        ))}
                      </div>
                    </>
                  )}
                  {screen === "producao" &&
                    (!round ? (
                      <div className="empty">
                        <ChefHat size={35} />
                        <h2>Comece pela rodada.</h2>
                        <p>
                          Escolha quarta ou quinta e conte os sabores produzidos
                          na base.
                        </p>
                        <button
                          className="btn"
                          onClick={() => open({ kind: "round" })}
                        >
                          Iniciar rodada <Plus size={18} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <section className="processsurface">
                          <div>
                            <h2>
                              {sealed
                                ? "Produção confirmada."
                                : "Um sabor por vez."}
                            </h2>
                            <p>
                              {dateText(productionDay)} · {metrics.produced}{" "}
                              produzidos na base
                              {round.legacyProduction
                                ? " · registro de versão anterior"
                                : ""}
                            </p>
                          </div>
                          <DayTimeline steps={steps} />
                        </section>
                        <div className="sectionhead">
                          <Filter value={group} onChange={setGroup} />
                          {admin &&
                            !sealed &&
                            !data.records.some(
                              (e) =>
                                e.roundId === round.id &&
                                e.kind === "production",
                            ) && (
                              <button
                                className="textbtn"
                                onClick={() => open({ kind: "production-day" })}
                              >
                                Mudar dia de produção
                              </button>
                            )}
                          <span className="muted">
                            {groupItems.length} sabores
                          </span>
                        </div>
                        {group === "na_feira" && (
                          <p className="infoinline">
                            <Info size={18} />
                            Esses sabores são informados no retorno da feira.
                            Você não precisa registrar cada venda.
                          </p>
                        )}
                        <div className="foodgrid">
                          {groupItems.map((f) => (
                            <FoodCard
                              key={f.id}
                              flavor={f}
                              index={data.flavors.indexOf(f)}
                              value={
                                round.production.find(
                                  (p) => p.flavorId === f.id,
                                )?.produced || 0
                              }
                              detail={
                                f.prepKind === "na_feira"
                                  ? "preparo informado no retorno"
                                  : "produzidos na base"
                              }
                              done={
                                recorded("production", f.id) &&
                                recorded("allocation", f.id)
                              }
                              locked={
                                sealed ||
                                closed ||
                                !productionOpen(round, now) ||
                                f.prepKind === "na_feira"
                              }
                              onClick={() =>
                                openTask(
                                  f,
                                  sealed ||
                                    closed ||
                                    !productionOpen(round, now) ||
                                    f.prepKind === "na_feira"
                                    ? "consult"
                                    : "production",
                                )
                              }
                            />
                          ))}
                        </div>
                        <div className="stickyactions">
                          <span>
                            {sealed
                              ? "Produção registrada"
                              : `${prodDone}/${base.length} contagens · ${allocationDone}/${base.length} separações`}
                          </span>
                          <button
                            className="btn"
                            disabled={
                              busy ||
                              sealed ||
                              closed ||
                              !productionOpen(round, now) ||
                              prodDone !== base.length ||
                              allocationDone !== base.length
                            }
                            onClick={() => open({ kind: "seal-production" })}
                          >
                            Concluir produção <Check size={18} />
                          </button>
                        </div>
                        {sealed && !closed && (
                          <p className="sectionhint">
                            Precisa corrigir? Abra o registro pelo Histórico
                            para escolher o sabor e informar o motivo.
                          </p>
                        )}
                      </>
                    ))}
                  {screen === "feiras" &&
                    (!round ? (
                      <div className="empty">
                        <Store size={35} />
                        <h2>As feiras começam com uma rodada.</h2>
                        <p>
                          Sexta Amarais, sábado Nova Odessa e domingo Morungaba.
                        </p>
                        <button
                          className="btn"
                          onClick={() => open({ kind: "round" })}
                        >
                          Iniciar rodada
                        </button>
                      </div>
                    ) : (
                      <>
                        <div
                          className="fairselector"
                          role="group"
                          aria-label="Escolher feira"
                        >
                          {round.fairs.map((f) => (
                            <button
                              key={f.id}
                              aria-pressed={f.id === fair?.id}
                              className={f.id === fair?.id ? "active" : ""}
                              onClick={() => {
                                setFairId(f.id);
                                setGroup("base");
                              }}
                            >
                              <strong>{f.name}</strong>
                              <span>{dateText(f.date)}</span>
                            </button>
                          ))}
                        </div>
                        {fair && (
                          <>
                            <section className="fairbanner">
                              <div>
                                <h2>{fair.name}</h2>
                                <p>
                                  <MapPin size={17} />
                                  {fair.transport} · {dateText(fair.date)}
                                </p>
                              </div>
                              <div className="fairclock">
                                <span>
                                  Início{" "}
                                  <b>{fair.startTime || "A confirmar"}</b>
                                </span>
                                <span>
                                  Fim das vendas{" "}
                                  <b>{fair.closeTime || "A confirmar"}</b>
                                </span>
                              </div>
                            </section>
                            <DayTimeline
                              steps={[
                                {
                                  label: "Carga",
                                  done: fair.loadConfirmed,
                                  detail: fair.loadConfirmed
                                    ? "Conferida"
                                    : `${fair.lines.reduce((a, l) => a + l.taken, 0)} separados`,
                                },
                                {
                                  label: "Retorno",
                                  done: fair.returnSealed,
                                  detail: `${returnDone}/${returnLines.length} sabores`,
                                },
                                {
                                  label: "Caixa",
                                  done: fair.cash.closed,
                                  detail: fair.cash.closed
                                    ? "Registrado"
                                    : "Pode ficar para depois",
                                },
                              ]}
                            />
                            <div className="fairactionrow">
                              {!fair.returnSealed && !closed && (
                                <button
                                  className="btn secondary"
                                  disabled={busy || loadLocked(fair, now)}
                                  onClick={() =>
                                    open({
                                      kind: "confirm-load",
                                      fairId: fair.id,
                                    })
                                  }
                                >
                                  {fair.loadConfirmed
                                    ? "Reconfirmar carga"
                                    : "Confirmar carga"}
                                </button>
                              )}
                              <button
                                className="btn secondary"
                                disabled={busy || !closingOpen(fair, now)}
                                onClick={() =>
                                  open({ kind: "cash", fairId: fair.id })
                                }
                              >
                                {fair.cash.closed
                                  ? "Ver / corrigir caixa"
                                  : "Registrar caixa depois ou agora"}
                              </button>
                            </div>
                            <div className="sectionhead">
                              <h2>
                                {closingOpen(fair, now)
                                  ? "Retorno por sabor"
                                  : "Carga por sabor"}
                              </h2>
                              <Filter value={group} onChange={setGroup} />
                            </div>
                            {group === "na_feira" && (
                              <p className="infoinline">
                                <Info size={18} />
                                Informe o total preparado e o que voltou,
                                incluindo zero. Esses registros entram na
                                cobertura do retorno.
                              </p>
                            )}
                            <div className="foodgrid">
                              {groupItems
                                .filter(
                                  (f) =>
                                    group === "na_feira" ||
                                    fair.lines.some(
                                      (l) => l.flavorId === f.id && l.taken > 0,
                                    ) ||
                                    !fair.loadConfirmed,
                                )
                                .map((f) => {
                                  const l = fair.lines.find(
                                      (l) => l.flavorId === f.id,
                                    ),
                                    returnMode = closingOpen(fair, now);
                                  return (
                                    <FoodCard
                                      key={f.id}
                                      flavor={f}
                                      index={data.flavors.indexOf(f)}
                                      value={
                                        returnMode
                                          ? recorded(
                                              "return",
                                              f.id,
                                              fair.date,
                                              fair,
                                            )
                                            ? l?.returned || 0
                                            : "—"
                                          : l?.taken || 0
                                      }
                                      detail={
                                        returnMode
                                          ? recorded(
                                              "return",
                                              f.id,
                                              fair.date,
                                              fair,
                                            )
                                            ? "retorno salvo"
                                            : "retorno a informar"
                                          : `${moneyText(l?.price || 0)} por pastel`
                                      }
                                      done={recorded(
                                        "return",
                                        f.id,
                                        fair.date,
                                        fair,
                                      )}
                                      locked={closed || fair.returnSealed}
                                      onClick={() =>
                                        openTask(
                                          f,
                                          closed || fair.returnSealed
                                            ? "consult"
                                            : returnMode
                                              ? "return"
                                              : "load",
                                          fair,
                                        )
                                      }
                                    />
                                  );
                                })}
                            </div>
                            {!closed && (
                              <div className="stickyactions">
                                <span>
                                  {fair.returnSealed
                                    ? "Retorno confirmado"
                                    : `${returnDone}/${returnLines.length} sabores registrados`}
                                </span>
                                <button
                                  className="btn"
                                  disabled={
                                    busy ||
                                    !closingOpen(fair, now) ||
                                    fair.returnSealed ||
                                    returnDone !== returnLines.length
                                  }
                                  onClick={() =>
                                    open({
                                      kind: "seal-return",
                                      fairId: fair.id,
                                    })
                                  }
                                >
                                  Concluir retorno <Check size={18} />
                                </button>
                              </div>
                            )}
                            <div className="sectionhead">
                              <h2>Conferência da carga</h2>
                              <span className="muted">
                                Preço guardado nesta feira
                              </span>
                            </div>
                            <div className="loadlist">
                              {fair.lines
                                .filter(
                                  (l) => l.taken > 0 || !fair.loadConfirmed,
                                )
                                .map((l) => {
                                  const f = data.flavors.find(
                                    (f) => f.id === l.flavorId,
                                  )!;
                                  return (
                                    <article key={l.flavorId}>
                                      <div>
                                        <strong>{f.name}</strong>
                                        <span>
                                          Previsto {l.planned} · carga {l.taken}{" "}
                                          · {moneyText(l.price)}
                                        </span>
                                      </div>
                                      <button
                                        className="textbtn"
                                        disabled={
                                          closed ||
                                          busy ||
                                          (loadLocked(fair, now) && !admin)
                                        }
                                        onClick={() =>
                                          loadLocked(fair, now)
                                            ? open({
                                                kind: "correction",
                                                target: {
                                                  flavorId: f.id,
                                                  kind: "load",
                                                  day: fair.date,
                                                  fairId: fair.id,
                                                },
                                              })
                                            : openTask(f, "load", fair)
                                        }
                                      >
                                        Conferir carga <SquarePen size={16} />
                                      </button>
                                    </article>
                                  );
                                })}
                            </div>
                            {round.fairs.every((f) => f.returnSealed) &&
                              !closed && (
                                <div className="operationclose">
                                  <div>
                                    <h2>Os três retornos estão salvos.</h2>
                                    <p>
                                      Conclua a operação. Os caixas pendentes
                                      continuam disponíveis.
                                    </p>
                                  </div>
                                  <button
                                    className="btn"
                                    onClick={() =>
                                      open({ kind: "close-round" })
                                    }
                                  >
                                    Concluir operação
                                  </button>
                                </div>
                              )}
                          </>
                        )}
                      </>
                    ))}
                  {screen === "caixa" &&
                    (!round ? (
                      <div className="empty">
                        <Wallet size={35} />
                        <h2>O caixa acompanha cada rodada.</h2>
                        <p>
                          Crie a rodada para registrar dinheiro, Pix, cartão e
                          gastos.
                        </p>
                        <button
                          className="btn"
                          onClick={() => open({ kind: "round" })}
                        >
                          Iniciar rodada
                        </button>
                      </div>
                    ) : (
                      <>
                        <section
                          className="summarystrip"
                          aria-label="Resumo financeiro"
                        >
                          <Summary
                            label="Receita registrada"
                            value={moneyText(metrics.gross)}
                            detail={`${metrics.cashCount}/3 caixas`}
                          />
                          <Summary
                            label="Gastos da rodada"
                            value={moneyText(metrics.cost)}
                          />
                          <Summary
                            label="Resultado parcial"
                            value={moneyText(metrics.net)}
                            detail="Depende dos caixas e gastos registrados"
                          />
                          <Summary
                            label="Caixas pendentes"
                            value={
                              round.fairs.filter((f) => !f.cash.closed).length
                            }
                          />
                        </section>
                        <div className="sectionhead">
                          <h2>Recebimentos de cada feira</h2>
                        </div>
                        <div className="cashlist">
                          {round.fairs.map((f) => (
                            <article className="cashrow" key={f.id}>
                              <div>
                                <h3>{f.name}</h3>
                                <span>
                                  {dateText(f.date)} ·{" "}
                                  {f.cash.closed
                                    ? "Caixa registrado"
                                    : closingOpen(f, now)
                                      ? "Pode registrar"
                                      : "Aguardando dia da feira"}
                                </span>
                              </div>
                              <strong>
                                {f.cash.closed ? moneyText(revenue(f)) : "—"}
                              </strong>
                              <button
                                className="btn secondary"
                                disabled={busy || !closingOpen(f, now)}
                                onClick={() =>
                                  open({ kind: "cash", fairId: f.id })
                                }
                              >
                                {f.cash.closed
                                  ? "Corrigir caixa"
                                  : "Registrar caixa"}
                              </button>
                            </article>
                          ))}
                        </div>
                        <p className="sectionhint">
                          Pix e cartão são valores recebidos na feira. Cartão
                          registrado não confirma depósito bancário.
                        </p>
                        <div className="sectionhead">
                          <h2>Gastos da rodada</h2>
                          <button
                            className="btn secondary"
                            onClick={() => open({ kind: "expense" })}
                          >
                            <Plus size={18} />
                            Registrar gasto
                          </button>
                        </div>
                        <div className="expenses">
                          {data.expenses
                            .filter((e) => e.roundId === round.id)
                            .map((e) => (
                              <article key={e.id}>
                                <div>
                                  <span className="expensecategory">
                                    {e.category}
                                    {e.fairId
                                      ? " · " +
                                        round.fairs.find(
                                          (f) => f.id === e.fairId,
                                        )?.name
                                      : " · rodada"}
                                  </span>
                                  <h3>{e.description}</h3>
                                  <small>{dateText(e.date)}</small>
                                </div>
                                <strong>{moneyText(e.amount)}</strong>
                                <div className="expenseactions">
                                  <button
                                    className="textbtn"
                                    onClick={() =>
                                      open({ kind: "expense", expenseId: e.id })
                                    }
                                  >
                                    Corrigir
                                  </button>
                                  <button
                                    className="iconbutton"
                                    aria-label={
                                      "Cancelar gasto " + e.description
                                    }
                                    onClick={() =>
                                      open({
                                        kind: "expense-cancel",
                                        expenseId: e.id,
                                      })
                                    }
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </div>
                              </article>
                            ))}
                        </div>
                        {!data.expenses.some((e) => e.roundId === round.id) && (
                          <div className="inlineempty">
                            Nenhum gasto registrado. Insumos, equipe e
                            transporte podem entrar aqui.
                          </div>
                        )}
                        <div className="operationclose">
                          <p>
                            {closed
                              ? "A operação está concluída; os caixas e gastos continuam disponíveis."
                              : "Você pode concluir a operação após registrar os três retornos, mesmo com caixa pendente."}
                          </p>
                          <button
                            className="btn"
                            disabled={
                              closed ||
                              busy ||
                              round.fairs.some((f) => !f.returnSealed)
                            }
                            onClick={() => open({ kind: "close-round" })}
                          >
                            Concluir operação
                          </button>
                        </div>
                      </>
                    ))}
                  {screen === "historico" && (
                    <>
                      <div className="sectionhead">
                        <h2>Rodadas</h2>
                        <button className="textbtn" onClick={download}>
                          <Download size={18} />
                          Exportar registros
                        </button>
                      </div>
                      <div className="historylist">
                        {[...data.rounds].reverse().map((r) => {
                          const k = stats(r, data);
                          return (
                            <article key={r.id}>
                              <div>
                                <h3>
                                  {dateText(r.start)} — {dateText(r.end)}
                                </h3>
                                <span>
                                  {r.status === "concluida"
                                    ? "Operação concluída"
                                    : "Operação em aberto"}{" "}
                                  ·{" "}
                                  {r.fairs.filter((f) => f.returnSealed).length}
                                  /3 retornos · {k.cashCount}/3 caixas
                                </span>
                              </div>
                              <div className="historynumbers">
                                <strong>
                                  {k.produced}
                                  <small>produzidos</small>
                                </strong>
                                <strong>
                                  {moneyText(k.net)}
                                  <small>resultado parcial</small>
                                </strong>
                              </div>
                              <button
                                className="btn secondary"
                                onClick={() => {
                                  setRoundId(r.id);
                                  go("hoje");
                                }}
                              >
                                Abrir rodada
                              </button>
                            </article>
                          );
                        })}
                      </div>
                      {!data.rounds.length && (
                        <div className="inlineempty">
                          A primeira rodada vai aparecer aqui depois de ser
                          criada.
                        </div>
                      )}
                      <div className="sectionhead">
                        <h2>Registros por sabor</h2>
                      </div>
                      <div className="recordfeed">
                        {[...data.records]
                          .reverse()
                          .filter((e) => !round || e.roundId === round.id)
                          .slice(0, 80)
                          .map((e) => (
                            <article key={e.id}>
                              <span className="recordtick">
                                <Check size={17} />
                              </span>
                              <div>
                                <strong>
                                  {e.kind === "production"
                                    ? "Produção"
                                    : e.kind === "allocation"
                                      ? "Carga / separação"
                                      : e.kind === "return"
                                        ? "Retorno"
                                        : e.kind === "cash"
                                          ? "Caixa"
                                          : "Confirmação"}
                                  {e.flavorId
                                    ? " · " +
                                      data.flavors.find(
                                        (f) => f.id === e.flavorId,
                                      )?.name
                                    : ""}
                                </strong>
                                <small>
                                  {e.savedBy} ·{" "}
                                  {new Date(e.savedAt).toLocaleString("pt-BR", {
                                    timeZone: "America/Sao_Paulo",
                                  })}{" "}
                                  · revisão {e.revision}
                                </small>
                              </div>
                              {e.flavorId && !closed && (
                                <button
                                  className="textbtn"
                                  onClick={() =>
                                    open({
                                      kind: "correction",
                                      target: {
                                        flavorId: e.flavorId,
                                        kind:
                                          e.kind === "return"
                                            ? "return"
                                            : e.kind === "allocation"
                                              ? e.fairId
                                                ? "load"
                                                : "allocation"
                                              : "production",
                                        day: e.day,
                                        fairId: e.fairId || undefined,
                                      },
                                    })
                                  }
                                >
                                  Corrigir
                                </button>
                              )}
                            </article>
                          ))}
                      </div>
                      {!data.records.length && (
                        <div className="inlineempty">
                          Cada confirmação aparece com responsável e revisão.
                        </div>
                      )}
                      <div className="sectionhead">
                        <h2>Histórico de alterações</h2>
                        <span className="muted">Últimas 40 revisões</span>
                      </div>
                      <div className="auditlist">
                        {audit.map((a) => (
                          <article key={a.id}>
                            <div>
                              <strong>{a.action}</strong>
                              <time>
                                {new Date(a.created).toLocaleString("pt-BR", {
                                  timeZone: "America/Sao_Paulo",
                                })}
                              </time>
                            </div>
                            <button
                              className="textbtn"
                              onClick={() => void showRevision(a.version)}
                            >
                              Ver revisão {a.version}
                            </button>
                          </article>
                        ))}
                      </div>
                    </>
                  )}
                  {screen === "configurar" && (
                    <>
                      {admin && settings && (
                        <>
                          <div className="sectionhead">
                            <h2>Horários das feiras</h2>
                          </div>
                          <p className="sectionhint">
                            Use o horário real da equipe. Sem horário definido,
                            o app permite registrar o retorno a partir do dia da
                            feira.
                          </p>
                          <div className="schedulegrid">
                            {settings.schedules.map((f, i) => (
                              <article key={f.key}>
                                <h3>{f.name}</h3>
                                <p>{f.region}</p>
                                <Field label="Início da feira">
                                  <input
                                    type="time"
                                    value={f.startTime || ""}
                                    onChange={(e) => {
                                      setConfigDirty(true);
                                      setSettings((v) =>
                                        v
                                          ? {
                                              ...v,
                                              schedules: v.schedules.map(
                                                (t, j) =>
                                                  i === j
                                                    ? {
                                                        ...t,
                                                        startTime:
                                                          e.target.value ||
                                                          null,
                                                      }
                                                    : t,
                                              ),
                                            }
                                          : v,
                                      );
                                    }}
                                  />
                                </Field>
                                <Field label="Fim das vendas">
                                  <input
                                    type="time"
                                    value={f.closeTime || ""}
                                    onChange={(e) => {
                                      setConfigDirty(true);
                                      setSettings((v) =>
                                        v
                                          ? {
                                              ...v,
                                              schedules: v.schedules.map(
                                                (t, j) =>
                                                  i === j
                                                    ? {
                                                        ...t,
                                                        closeTime:
                                                          e.target.value ||
                                                          null,
                                                      }
                                                    : t,
                                              ),
                                            }
                                          : v,
                                      );
                                    }}
                                  />
                                </Field>
                              </article>
                            ))}
                          </div>
                          <div className="sectionhead">
                            <h2>Sabores e preços por feira</h2>
                          </div>
                          <p className="sectionhint">
                            Uma alteração vale para novas cargas. Preços já
                            guardados continuam no histórico; ajuste uma carga
                            pela tela da feira quando necessário.
                          </p>
                          <div className="catalogeditor">
                            {catalog.map((f, i) => (
                              <article
                                key={f.id}
                                className={!f.active ? "inactive" : ""}
                              >
                                <div className="catalogname">
                                  <label>
                                    <span className="sr-only">
                                      Nome do sabor {i + 1}
                                    </span>
                                    <input
                                      aria-label={"Nome do sabor " + (i + 1)}
                                      value={f.name}
                                      maxLength={80}
                                      onChange={(e) => {
                                        setConfigDirty(true);
                                        setCatalog((v) =>
                                          v.map((x, j) =>
                                            i === j
                                              ? { ...x, name: e.target.value }
                                              : x,
                                          ),
                                        );
                                      }}
                                    />
                                  </label>
                                  <span className="muted">
                                    {f.prepKind === "na_feira"
                                      ? "Preparado na feira"
                                      : "Preparado na base"}
                                  </span>
                                </div>
                                <div className="fairprices">
                                  {settings.schedules.map((t) => (
                                    <Currency
                                      key={t.key}
                                      label={
                                        t.key === "sexta"
                                          ? "Sexta · Amarais"
                                          : t.key === "sabado"
                                            ? "Sábado · Nova Odessa"
                                            : "Domingo · Morungaba"
                                      }
                                      value={f.prices[t.key] ?? f.price}
                                      onChange={(price) => {
                                        setConfigDirty(true);
                                        setCatalog((v) =>
                                          v.map((x, j) =>
                                            i === j
                                              ? {
                                                  ...x,
                                                  prices: {
                                                    ...x.prices,
                                                    [t.key]: price,
                                                  },
                                                }
                                              : x,
                                          ),
                                        );
                                      }}
                                    />
                                  ))}
                                </div>
                                <button
                                  className="textbtn"
                                  onClick={() => {
                                    setConfigDirty(true);
                                    setCatalog((v) =>
                                      v.map((x, j) =>
                                        i === j
                                          ? { ...x, active: !x.active }
                                          : x,
                                      ),
                                    );
                                  }}
                                >
                                  {f.active ? "Inativar" : "Ativar"}
                                </button>
                              </article>
                            ))}
                          </div>
                          <div className="addflavor">
                            <Field label="Novo sabor">
                              <input
                                maxLength={80}
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="Nome do sabor"
                              />
                            </Field>
                            <Field label="Local de preparo">
                              <select
                                value={newKind}
                                onChange={(e) =>
                                  setNewKind(e.target.value as typeof newKind)
                                }
                              >
                                <option value="base">Na base</option>
                                <option value="na_feira">Na feira</option>
                              </select>
                            </Field>
                            <button
                              className="btn secondary"
                              disabled={!newName.trim()}
                              onClick={() => {
                                setCatalog((v) => [
                                  ...v,
                                  {
                                    id: uid(),
                                    name: newName.trim(),
                                    prepKind: newKind,
                                    price: 0,
                                    prices: {},
                                    active: true,
                                  },
                                ]);
                                setNewName("");
                                setConfigDirty(true);
                              }}
                            >
                              Adicionar sabor
                            </button>
                          </div>
                          <div className="stickyactions">
                            <span>
                              {configDirty
                                ? "Alterações ainda não salvas"
                                : "Configurações atualizadas"}
                            </span>
                            <div className="actions">
                              <button
                                className="btn secondary"
                                disabled={!configDirty || busy}
                                onClick={() => {
                                  setSettings(structuredClone(data.settings));
                                  setCatalog(structuredClone(data.flavors));
                                  setConfigDirty(false);
                                }}
                              >
                                Cancelar alterações
                              </button>
                              <button
                                className="btn"
                                disabled={!configDirty || busy}
                                onClick={async () => {
                                  if (
                                    (await save({
                                      kind: "settings",
                                      settings,
                                    })) &&
                                    (await save({
                                      kind: "catalog",
                                      flavors: catalog,
                                    }))
                                  )
                                    setConfigDirty(false);
                                }}
                              >
                                Salvar configurações
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                      {previewOnly ? (
                        <p className="infoinline">
                          <Info size={18} />A prévia simula pessoas. Contas
                          reais e troca de senha ficam no aplicativo com acesso.
                        </p>
                      ) : (
                        <AccountSettings admin={admin} />
                      )}
                    </>
                  )}
                </>
              )}
            </main>
            <nav className="bottomnav" aria-label="Navegação principal">
              {nav.slice(0, 4).map((n) => (
                <button
                  key={n.id}
                  className={screen === n.id ? "active" : ""}
                  aria-current={screen === n.id ? "page" : undefined}
                  onClick={() => go(n.id)}
                >
                  <n.icon size={21} />
                  <span>{n.label}</span>
                </button>
              ))}
              <div className="more">
                <SidebarTrigger aria-label="Abrir mais opções" />
                <span>Mais</span>
              </div>
            </nav>
          </div>
          <FlavorTask
            task={task}
            state={data}
            round={round}
            onClose={() => {
              setTask(null);
              setFormError("");
            }}
            onSave={save}
            onNext={nextFlavor}
            busy={busy}
            error={formError}
          />
          <Dialog
            open={!!modal}
            onOpenChange={(v) => {
              if (!v && !busy) {
                setModal(null);
                setFormError("");
              }
            }}
          >
            <DialogContent
              className={
                "editdialog " +
                (modal?.kind === "cash" ? "cashwizard" : "") +
                (modal?.kind === "revision" ? " revisiondialog" : "")
              }
            >
              <DialogTitle>{modalTitle}</DialogTitle>
              <DialogDescription>
                {modal?.kind === "cash"
                  ? currentCash?.name
                  : modal?.kind === "correction"
                    ? "O registro mantém sua identidade e guarda o estado anterior no histórico."
                    : modal?.kind === "round"
                      ? "Uma produção na base. Três feiras na mesma semana."
                      : modal?.kind === "close-round"
                        ? "O caixa pode ser registrado depois, mesmo com a operação concluída."
                        : modal?.kind === "revision"
                          ? "Estado preservado na confirmação desta versão."
                          : "Confira os dados antes de confirmar."}
              </DialogDescription>
              {modal?.kind === "revision" ? (
                <>
                  {formError ? (
                    <p className="formerror" role="alert">
                      {formError}
                    </p>
                  ) : !revision ? (
                    <div className="skeleton block" />
                  ) : (
                    <>
                      <h3>{revision.action}</h3>
                      <p className="sectionhint">
                        {new Date(revision.created).toLocaleString("pt-BR", {
                          timeZone: "America/Sao_Paulo",
                        })}
                      </p>
                      <div className="revisionnumbers">
                        {revision.state.rounds.map((r: Round) => (
                          <article key={r.id}>
                            <strong>
                              {dateText(r.start)} — {dateText(r.end)}
                            </strong>
                            <span>
                              {r.production.reduce((a, p) => a + p.produced, 0)}{" "}
                              produzidos ·{" "}
                              {r.fairs.filter((f) => f.returnSealed).length}{" "}
                              retornos
                            </span>
                          </article>
                        ))}
                      </div>
                      <details>
                        <summary>Dados completos desta revisão</summary>
                        <pre className="revisionjson">
                          {JSON.stringify(revision.state, null, 2)}
                        </pre>
                      </details>
                    </>
                  )}
                </>
              ) : (
                <form onSubmit={submit}>
                  {modal?.kind === "round" && (
                    <>
                      <Field label="Semana da rodada">
                        <input
                          type="date"
                          required
                          value={draft.start || ""}
                          onChange={(e) => {
                            if (!e.target.value) {
                              setDraft({ start: "", productionDay: "" });
                              return;
                            }
                            const start = weekStart(e.target.value);
                            setDraft({ start, productionDay: start });
                          }}
                        />
                      </Field>
                      <fieldset className="daychoice">
                        <legend>Quando será a produção na base?</legend>
                        {draft.start &&
                          [0, 1].map((offset) => (
                            <label
                              key={offset}
                              className={
                                draft.productionDay ===
                                addDays(draft.start, offset)
                                  ? "selected"
                                  : ""
                              }
                            >
                              <input
                                type="radio"
                                name="production-day"
                                value={offset}
                                checked={
                                  draft.productionDay ===
                                  addDays(draft.start, offset)
                                }
                                onChange={() =>
                                  setDraft({
                                    ...draft,
                                    productionDay: addDays(draft.start, offset),
                                  })
                                }
                              />
                              <strong>
                                {offset === 0 ? "Quarta-feira" : "Quinta-feira"}
                              </strong>
                              <span>
                                {dateText(addDays(draft.start, offset))}
                              </span>
                            </label>
                          ))}
                      </fieldset>
                      <p className="sectionhint">
                        Amarais na sexta, Nova Odessa no sábado e Morungaba no
                        domingo.
                      </p>
                    </>
                  )}
                  {modal?.kind === "production-day" && (
                    <fieldset className="daychoice">
                      <legend>Um dia de produção na base</legend>
                      {[0, 1].map((offset) => (
                        <label
                          key={offset}
                          className={
                            draft.productionDay === addDays(draft.start, offset)
                              ? "selected"
                              : ""
                          }
                        >
                          <input
                            type="radio"
                            name="change-production-day"
                            checked={
                              draft.productionDay ===
                              addDays(draft.start, offset)
                            }
                            onChange={() =>
                              setDraft({
                                ...draft,
                                productionDay: addDays(draft.start, offset),
                              })
                            }
                          />
                          <strong>
                            {offset === 0 ? "Quarta-feira" : "Quinta-feira"}
                          </strong>
                          <span>{dateText(addDays(draft.start, offset))}</span>
                        </label>
                      ))}
                    </fieldset>
                  )}
                  {modal?.kind === "expense" && (
                    <>
                      <Field label="Descrição">
                        <input
                          required
                          maxLength={200}
                          value={draft.description || ""}
                          placeholder="Ex.: massa, óleo ou transporte"
                          onChange={(e) =>
                            setDraft((v: any) => ({
                              ...v,
                              description: e.target.value,
                            }))
                          }
                        />
                      </Field>
                      <div className="formgrid">
                        <Field label="Categoria">
                          <select
                            value={draft.category}
                            onChange={(e) =>
                              setDraft((v: any) => ({
                                ...v,
                                category: e.target.value,
                              }))
                            }
                          >
                            {["Insumos", "Equipe", "Transporte", "Outros"].map(
                              (v) => (
                                <option key={v}>{v}</option>
                              ),
                            )}
                          </select>
                        </Field>
                        <Field label="Data">
                          <input
                            type="date"
                            required
                            value={draft.date || clock.day}
                            onChange={(e) =>
                              setDraft((v: any) => ({
                                ...v,
                                date: e.target.value,
                              }))
                            }
                          />
                        </Field>
                      </div>
                      <Field label="Atribuir à feira (opcional)">
                        <select
                          value={draft.fairId || ""}
                          onChange={(e) =>
                            setDraft((v: any) => ({
                              ...v,
                              fairId: e.target.value,
                            }))
                          }
                        >
                          <option value="">Gasto da rodada</option>
                          {round?.fairs.map((f) => (
                            <option value={f.id} key={f.id}>
                              {f.name}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Currency
                        label="Valor do gasto"
                        value={draft.amount || 0}
                        onChange={(amount) =>
                          setDraft((v: any) => ({ ...v, amount }))
                        }
                      />
                      {draft.correction && (
                        <Field label="Motivo da correção">
                          <input
                            required
                            minLength={3}
                            maxLength={300}
                            value={draft.reason || ""}
                            onChange={(e) =>
                              setDraft((v: any) => ({
                                ...v,
                                reason: e.target.value,
                              }))
                            }
                          />
                        </Field>
                      )}
                    </>
                  )}
                  {modal?.kind === "cash" && (
                    <>
                      <DayTimeline
                        steps={[
                          {
                            label: "Dinheiro",
                            done: cashStep > 0,
                            detail: "Troco e contagem",
                          },
                          {
                            label: "Pix e cartão",
                            done: cashStep > 1,
                            detail: "Recebimentos",
                          },
                          {
                            label: "Confirmar",
                            done: false,
                            detail: "Salvar caixa",
                          },
                        ]}
                      />
                      {cashStep === 0 ? (
                        <>
                          <Currency
                            label="Troco inicial"
                            value={draft.float || 0}
                            onChange={(float) =>
                              setDraft((v: any) => ({ ...v, float }))
                            }
                          />
                          <Currency
                            label="Dinheiro contado no caixa"
                            value={draft.cash || 0}
                            onChange={(cash) =>
                              setDraft((v: any) => ({ ...v, cash }))
                            }
                          />
                          <Currency
                            label="Dinheiro retirado do caixa"
                            value={draft.withdrawal || 0}
                            onChange={(withdrawal) =>
                              setDraft((v: any) => ({ ...v, withdrawal }))
                            }
                          />
                          <p className="sectionhint">
                            Inclua gastos pagos com dinheiro da feira e
                            retiradas pessoais. Cada saída entra uma vez.
                          </p>
                        </>
                      ) : cashStep === 1 ? (
                        <>
                          <Currency
                            label="Total recebido por Pix"
                            value={draft.pix || 0}
                            onChange={(pix) =>
                              setDraft((v: any) => ({ ...v, pix }))
                            }
                          />
                          <Currency
                            label="Total recebido no cartão"
                            value={draft.card || 0}
                            onChange={(card) =>
                              setDraft((v: any) => ({ ...v, card }))
                            }
                          />
                          <p className="sectionhint">
                            Informe o total da feira. Você não precisa separar
                            cada venda.
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="cashresult">
                            <span>Receita registrada</span>
                            <strong>
                              {moneyText(
                                (draft.cash || 0) +
                                  (draft.pix || 0) +
                                  (draft.card || 0) +
                                  (draft.withdrawal || 0) -
                                  (draft.float || 0),
                              )}
                            </strong>
                          </div>
                          <div className="cashcompare">
                            <span>Referência estimada dos pastéis</span>
                            <strong>
                              {currentCash?.returnSealed
                                ? moneyText(
                                    currentCash.lines.reduce(
                                      (a, l) => a + estimated(l) * l.price,
                                      0,
                                    ),
                                  )
                                : "Retorno pendente"}
                            </strong>
                          </div>
                          <p className="sectionhint">
                            A referência é uma comparação; ela não é somada aos
                            recebimentos.
                          </p>
                          {draft.correction && (
                            <Field label="Motivo da correção">
                              <input
                                required
                                minLength={3}
                                maxLength={300}
                                value={draft.reason || ""}
                                onChange={(e) =>
                                  setDraft((v: any) => ({
                                    ...v,
                                    reason: e.target.value,
                                  }))
                                }
                              />
                            </Field>
                          )}
                        </>
                      )}
                    </>
                  )}
                  {modal &&
                    ["correction", "reopen-round", "expense-cancel"].includes(
                      modal.kind,
                    ) && (
                      <>
                        <Field label="Motivo da alteração">
                          <textarea
                            required
                            minLength={3}
                            maxLength={300}
                            rows={3}
                            autoFocus
                            value={draft.reason || ""}
                            onChange={(e) =>
                              setDraft({ reason: e.target.value })
                            }
                          />
                        </Field>
                        {modal.kind === "expense-cancel" && (
                          <p className="sectionhint">
                            O gasto deixa de entrar no resultado atual. O estado
                            anterior permanece no histórico.
                          </p>
                        )}
                      </>
                    )}
                  {modal?.kind === "seal-production" && (
                    <div className="finishsummary">
                      <ClipboardCheck size={34} />
                      <h2>{prodDone} sabores contados e separados.</h2>
                      <p>
                        Produção de {dateText(productionDay)}. Depois de
                        confirmar, alterações usam correção com motivo.
                      </p>
                    </div>
                  )}
                  {modal?.kind === "seal-return" && (
                    <div className="finishsummary">
                      <Check size={34} />
                      <h2>Retorno pronto para confirmar.</h2>
                      <p>O caixa pode ficar para outro momento.</p>
                    </div>
                  )}
                  {modal?.kind === "confirm-load" && (
                    <div className="finishsummary">
                      <Store size={34} />
                      <h2>Carga conferida.</h2>
                      <p>
                        Confirme as quantidades e os preços que aparecem nesta
                        feira.
                      </p>
                    </div>
                  )}
                  {modal?.kind === "close-round" && (
                    <div className="finishsummary">
                      <Check size={34} />
                      <h2>Três retornos salvos.</h2>
                      <p>
                        {round?.fairs.filter((f) => !f.cash.closed).length || 0}{" "}
                        caixas continuam disponíveis para registrar depois.
                      </p>
                    </div>
                  )}
                  {modal?.kind === "receipt" && (
                    <div className="digitalreceipt">
                      <span className="bigcheck">
                        <Check size={34} />
                      </span>
                      <h2>Confirmado.</h2>
                      <div>
                        <span>Responsável</span>
                        <strong>{receipt?.savedBy || actor.name}</strong>
                      </div>
                      <div>
                        <span>Rodada</span>
                        <strong>
                          {round
                            ? dateText(round.start) +
                              " — " +
                              dateText(round.end)
                            : ""}
                        </strong>
                      </div>
                      <div>
                        <span>Registro</span>
                        <code>{receipt?.id.slice(0, 8) || "—"}</code>
                      </div>
                      <div>
                        <span>Revisão</span>
                        <strong>{receipt?.revision || 1}</strong>
                      </div>
                      <p>
                        {saved
                          ? new Date(saved).toLocaleString("pt-BR", {
                              timeZone: "America/Sao_Paulo",
                            })
                          : ""}
                      </p>
                    </div>
                  )}
                  {formError && (
                    <p className="formerror" role="alert">
                      {formError}
                    </p>
                  )}
                  <div className="modalactions">
                    <button
                      type="button"
                      className="btn secondary"
                      disabled={busy}
                      onClick={() =>
                        modal?.kind === "cash" && cashStep > 0
                          ? setCashStep((v) => v - 1)
                          : setModal(null)
                      }
                    >
                      {modal?.kind === "cash" && cashStep > 0
                        ? "Voltar"
                        : modal?.kind === "receipt"
                          ? "Fechar"
                          : "Cancelar"}
                    </button>
                    {modal?.kind !== "receipt" && (
                      <button className="btn" disabled={busy}>
                        {busy
                          ? "Confirmando…"
                          : modal?.kind === "cash"
                            ? cashStep < 2
                              ? "Continuar"
                              : "Salvar caixa"
                            : modal?.kind === "correction"
                              ? "Abrir correção"
                              : modal?.kind === "round"
                                ? "Criar rodada"
                                : modal?.kind === "expense"
                                  ? "Salvar gasto"
                                  : modal?.kind === "expense-cancel"
                                    ? "Cancelar gasto"
                                    : modal?.kind === "reopen-round"
                                      ? "Reabrir operação"
                                      : "Confirmar"}
                      </button>
                    )}
                  </div>
                </form>
              )}
            </DialogContent>
          </Dialog>
          <Toaster position="top-center" richColors />
        </SidebarProvider>
      </LayoutGroup>
    </MotionConfig>
  );
}
