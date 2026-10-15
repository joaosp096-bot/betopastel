"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useBetoAuth } from "./AuthGate";
import { accessError } from "@/lib/access-error";
async function responseData(response: Response) {
  if (response.status === 401) {
    window.dispatchEvent(new Event("beto:session-expired"));
    throw Error("Sua sessão terminou. Entre novamente para continuar; seus campos foram mantidos.");
  }
  const data = await response.json() as { error?: string; users?: any[] };
  if (!response.ok) throw Error(data.error || "Não conseguimos confirmar o acesso. Tente novamente.");
  return data;
}
export function AccountSettings({ admin }: { admin: boolean }) {
  const { logout } = useBetoAuth();
  const [current, setCurrent] = useState(""),
    [password, setPassword] = useState(""),
    [confirm, setConfirm] = useState(""),
    [busy, setBusy] = useState(false),
    [users, setUsers] = useState<any[]>([]),
    [editing, setEditing] = useState<any>(null),
    [error, setError] = useState("");
  async function load() {
    if (!admin) return;
    try {
      const r = await fetch("/api/users");
      const d = await responseData(r);
      setUsers(d.users || []);
      setError("");
    } catch (e) {
      setError(accessError(e));
    }
  }
  useEffect(() => {
    void load();
    const refresh = () => void load();
    window.addEventListener("beto:authenticated", refresh);
    return () => window.removeEventListener("beto:authenticated", refresh);
  }, [admin]);
  async function change(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("As novas senhas precisam ser iguais.");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, password }),
      });
      await responseData(r);
      toast.success("Senha alterada. Entre com a nova senha.");
      await logout();
    } catch (e) {
      toast.error(accessError(e));
    } finally {
      setBusy(false);
    }
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const body = { ...editing };
      if (!body.password) delete body.password;
      const r = await fetch("/api/users", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      await responseData(r);
      setEditing(null);
      await load();
      toast.success("Acesso salvo.");
    } catch (e) {
      setError(accessError(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="accountsettings">
      <section>
        <h2>Minha senha</h2>
        <p className="sectionhint">
          Ao trocar, você encerra as sessões abertas e entra com a nova senha.
        </p>
        <form onSubmit={change} className="settingsform">
          <label className="field">
            <span>Senha atual</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              maxLength={256}
            />
          </label>
          <label className="field">
            <span>Nova senha</span>
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={256}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <small>Use pelo menos 8 caracteres.</small>
          </label>
          <label className="field">
            <span>Repetir a nova senha</span>
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={256}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </label>
          <button className="btn" disabled={busy}>
            Trocar senha
          </button>
        </form>
      </section>
      {admin && (
        <section className="teamsettings">
          <div className="sectionhead">
            <h2>Acessos da equipe</h2>
            <button
              className="btn secondary"
              onClick={() => {
                setError("");
                setEditing({
                  name: "",
                  email: "",
                  role: "operador",
                  active: true,
                  password: "",
                });
              }}
            >
              Adicionar pessoa
            </button>
          </div>
          <p className="sectionhint">
            Operadores registram a rotina. Administradores também configuram
            preços, horários e acessos.
          </p>
          {error && (
            <p className="formerror" role="alert">
              {error}
            </p>
          )}
          <div className="teamlist">
            {users.map((u) => (
              <article key={u.id}>
                <div>
                  <strong>{u.name}</strong>
                  <span>{u.email}</span>
                </div>
                <span className="pill neutral">
                  {u.active
                    ? u.role === "admin"
                      ? "Administrador"
                      : "Operação"
                    : "Inativo"}
                </span>
                <button
                  className="textbtn"
                  onClick={() => {
                    setError("");
                    setEditing({ ...u, active: !!u.active, password: "" });
                  }}
                >
                  Editar acesso
                </button>
              </article>
            ))}
          </div>
          {editing && (
            <form onSubmit={save} className="teamform">
              <h3>{editing.id ? "Editar acesso" : "Novo acesso"}</h3>
              <div className="formgrid">
                <label className="field">
                  <span>Nome</span>
                  <input
                    required
                    maxLength={80}
                    value={editing.name}
                    onChange={(e) =>
                      setEditing({ ...editing, name: e.target.value })
                    }
                  />
                </label>
                <label className="field">
                  <span>E-mail</span>
                  <input
                    type="email"
                    required
                    maxLength={254}
                    value={editing.email}
                    onChange={(e) =>
                      setEditing({ ...editing, email: e.target.value })
                    }
                  />
                </label>
                <label className="field">
                  <span>Papel</span>
                  <select
                    value={editing.role}
                    onChange={(e) =>
                      setEditing({ ...editing, role: e.target.value })
                    }
                  >
                    <option value="operador">Operação</option>
                    <option value="admin">Administrador</option>
                  </select>
                </label>
                <label className="field">
                  <span>
                    {editing.id
                      ? "Nova senha temporária (opcional)"
                      : "Senha temporária"}
                  </span>
                  <input
                    type="password"
                    required={!editing.id}
                    minLength={4}
                    maxLength={256}
                    autoComplete="new-password"
                    value={editing.password}
                    onChange={(e) =>
                      setEditing({ ...editing, password: e.target.value })
                    }
                  />
                </label>
              </div>
              {editing.id && (
                <label className="checkfield">
                  <input
                    type="checkbox"
                    checked={editing.active}
                    onChange={(e) =>
                      setEditing({ ...editing, active: e.target.checked })
                    }
                  />
                  Acesso ativo
                </label>
              )}
              <div className="actions">
                <button className="btn" disabled={busy}>
                  Salvar acesso
                </button>
                <button
                  className="btn secondary"
                  type="button"
                  disabled={busy}
                  onClick={() => setEditing(null)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </section>
      )}
    </div>
  );
}
