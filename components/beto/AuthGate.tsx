"use client";
import { useEffect, useState, createContext, useContext } from "react";
import { Eye, EyeOff, ArrowRight, LoaderCircle } from "lucide-react";
import { accessError } from "@/lib/access-error";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
type Auth = { logout: () => Promise<void> };
const AuthContext = createContext<Auth>({ logout: async () => {} });
export const useBetoAuth = () => useContext(AuthContext);
function Login({
  onSuccess,
  reauth = false,
}: {
  onSuccess: () => Promise<void>;
  reauth?: boolean;
}) {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [show, setShow] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await r.json()) as { error?: string };
      if (!r.ok) throw Error(data.error);
      setPassword("");
      await onSuccess();
    } catch (e) {
      setError(accessError(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className={reauth ? "reauthform" : "loginpage"}>
      {!reauth && (
        <aside className="loginstory">
          <a href="/" className="loginbrand">
            Beto<span>Pastel</span>
          </a>
          <div className="loginmessage">
            <h1>
              Da produção
              <br />à próxima feira.
            </h1>
            <p>Produção, feiras e os registros do negócio.</p>
            <div className="loginphoto">
              <img
                src="/images/sabores/carne-queijo.webp"
                alt="Pastel de carne com queijo, imagem ilustrativa"
                width="720"
                height="540"
              />
              <small>Imagem ilustrativa</small>
            </div>
          </div>
          <span className="loginplaces">Amarais · Nova Odessa · Morungaba</span>
        </aside>
      )}
      <section className="loginaccess" aria-label="Acesso ao Beto Pastel">
        <div className="loginform">
          {!reauth && (
            <div className="mobileloginbrand">
              Beto <b>Pastel</b>
            </div>
          )}
          <h2>{reauth ? "Entre novamente" : "Bem-vindo ao Beto."}</h2>
          <p>
            {reauth
              ? "Seu formulário continua preenchido. Entre para confirmar o registro."
              : "Entre com o acesso da equipe para abrir sua semana."}
          </p>
          <form onSubmit={submit}>
            <label className="field">
              <span>E-mail</span>
              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={254}
                autoFocus
                aria-describedby={error ? "login-error" : undefined}
              />
            </label>
            <label className="field">
              <span>Senha</span>
              <div className="passwordinput">
                <input
                  type={show ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  maxLength={256}
                  aria-describedby={error ? "login-error" : undefined}
                />
                <button
                  type="button"
                  aria-label={show ? "Ocultar senha" : "Mostrar senha"}
                  onClick={() => setShow((v) => !v)}
                >
                  {show ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </label>
            {error && (
              <p className="formerror" id="login-error" role="alert">
                {error}
              </p>
            )}
            <button className="btn loginbutton" disabled={busy}>
              {busy ? (
                <>
                  <LoaderCircle size={19} className="spin" />
                  Entrando…
                </>
              ) : (
                <>
                  Entrar <ArrowRight size={19} />
                </>
              )}
            </button>
          </form>
          <p className="accesshelp">
            Precisa de acesso? Fale com o administrador da equipe.
          </p>
          {!reauth && (
            <a className="demolink" href="/demonstracao">
              Experimentar com dados de demonstração <ArrowRight size={16} />
            </a>
          )}
        </div>
      </section>
    </div>
  );
}
export function AuthGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false),
    [user, setUser] = useState(false),
    [once, setOnce] = useState(false),
    [reauth, setReauth] = useState(false),
    [error, setError] = useState("");
  async function check() {
    try {
      const r = await fetch("/api/auth/session", { cache: "no-store" }),
        data = (await r.json()) as { user?: unknown; error?: string };
      if (!r.ok) throw Error(data.error);
      setUser(!!data.user);
      if (data.user) {
        setOnce(true);
        setReauth(false);
        window.dispatchEvent(new Event("beto:authenticated"));
      }
      setError("");
    } catch (e) {
      setError(accessError(e));
    } finally {
      setReady(true);
    }
  }
  useEffect(() => {
    void check();
    const expire = () => setReauth(true);
    window.addEventListener("beto:session-expired", expire);
    return () => window.removeEventListener("beto:session-expired", expire);
  }, []);
  async function logout() {
    const r = await fetch("/api/auth/logout", { method: "POST" });
    if (!r.ok) throw Error("Não conseguimos sair. Tente novamente.");
    setUser(false);
    setOnce(false);
    setReauth(false);
  }
  if (!ready)
    return (
      <main className="authloading">
        <div className="skeleton title" />
        <div className="skeleton line" />
        <div className="skeleton block" />
        <span>Abrindo o Beto Pastel…</span>
      </main>
    );
  if (error && !once)
    return (
      <main className="authloading">
        <h1>Não conseguimos abrir o acesso.</h1>
        <p>{error}</p>
        <button className="btn" onClick={() => void check()}>
          Tentar novamente
        </button>
      </main>
    );
  if (!user && !once) return <Login onSuccess={check} />;
  return (
    <AuthContext.Provider value={{ logout }}>
      {children}
      <Dialog open={reauth}>
        <DialogContent
          className="reauthdialog"
          overlayClassName="reauthoverlay"
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          showCloseButton={false}
        >
          <DialogTitle>Sua sessão terminou</DialogTitle>
          <DialogDescription>
            Confirme o acesso para continuar.
          </DialogDescription>
          <Login reauth onSuccess={check} />
        </DialogContent>
      </Dialog>
    </AuthContext.Provider>
  );
}
