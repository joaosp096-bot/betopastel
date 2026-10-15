export type AuthEnv = {
  DB?: D1Database;
  BETO_BOOTSTRAP_EMAIL?: string;
  BETO_BOOTSTRAP_PASSWORD_HASH?: string;
  BETO_WORKSPACE_ID?: string;
};
export type AuthUser = {
  userId: string;
  email: string;
  name: string;
  role: "admin" | "operador";
};
export const SESSION_COOKIE = "__Host-beto_session";
export const SESSION_SECONDS = 7 * 24 * 60 * 60;
const encoder = new TextEncoder();
const hex = (b: ArrayBuffer) =>
  Array.from(new Uint8Array(b), (v) => v.toString(16).padStart(2, "0")).join(
    "",
  );
const unhex = (s: string) =>
  Uint8Array.from(s.match(/../g) || [], (b) => parseInt(b, 16));
const hashPattern = /^pbkdf2-sha256\$100000\$([a-f0-9]{32})\$([a-f0-9]{64})$/;
export const tokenHash = async (s: string) =>
  hex(await crypto.subtle.digest("SHA-256", encoder.encode(s)));
export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: 100000 },
    key,
    256,
  );
  return `pbkdf2-sha256$100000$${hex(salt.buffer)}$${hex(bits)}`;
}
export async function verifyPassword(password: string, hash: string) {
  const m = hash.match(hashPattern);
  if (!m || password.length > 256) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = new Uint8Array(
      await crypto.subtle.deriveBits(
        {
          name: "PBKDF2",
          hash: "SHA-256",
          salt: unhex(m[1]),
          iterations: 100000,
        },
        key,
        256,
      ),
    ),
    expected = unhex(m[2]);
  let diff = 0;
  for (let i = 0; i < bits.length; i++) diff |= bits[i] ^ expected[i];
  return diff === 0;
}
export function authResponse(
  value: unknown,
  status = 200,
  extra: Record<string, string> = {},
) {
  return Response.json(value, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...extra,
    },
  });
}
export function sameOrigin(req: Request) {
  return (
    req.headers.get("origin") === new URL(req.url).origin &&
    req.headers.get("sec-fetch-site") !== "cross-site"
  );
}
export async function readJson(req: Request, max = 8192) {
  if (!req.headers.get("content-type")?.includes("application/json"))
    throw new Error("Formato inválido.");
  const text = await req.text();
  if (encoder.encode(text).length > max)
    throw new Error("Limite de dados atingido.");
  return JSON.parse(text);
}
function sessionToken(h: Headers) {
  const value = h
    .get("cookie")
    ?.split(";")
    .map((x) => x.trim())
    .find((x) => x.startsWith(SESSION_COOKIE + "="))
    ?.slice(SESSION_COOKIE.length + 1);
  return value && /^[a-f0-9]{64}$/.test(value) ? value : null;
}
export async function ensureBootstrap(env: AuthEnv) {
  if (!env.DB) return false;
  const exists = await env.DB.prepare(
    "SELECT id FROM beto_users LIMIT 1",
  ).first();
  if (exists) return true;
  const email = env.BETO_BOOTSTRAP_EMAIL?.trim().toLowerCase(),
    hash = env.BETO_BOOTSTRAP_PASSWORD_HASH;
  if (
    !email ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !hash ||
    !hashPattern.test(hash)
  )
    return false;
  await env.DB.prepare(
    "INSERT OR IGNORE INTO beto_users (id,email,name,role,password_hash,created) SELECT ?,?,'João','admin',?,? WHERE NOT EXISTS (SELECT 1 FROM beto_users)",
  )
    .bind(crypto.randomUUID(), email, hash, new Date().toISOString())
    .run();
  return true;
}
export async function readSession(
  headers: Headers,
  env: AuthEnv,
): Promise<AuthUser | null> {
  const token = sessionToken(headers);
  if (!token || !env.DB) return null;
  const row = await env.DB.prepare(
    "SELECT u.id,u.email,u.name,u.role FROM beto_sessions s JOIN beto_users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>? AND u.active=1",
  )
    .bind(await tokenHash(token), Math.floor(Date.now() / 1000))
    .first<{
      id: string;
      email: string;
      name: string;
      role: "admin" | "operador";
    }>();
  return row
    ? { userId: row.id, email: row.email, name: row.name, role: row.role }
    : null;
}
export async function session(req: Request, env: AuthEnv) {
  try {
    const configured = await ensureBootstrap(env);
    const user = await readSession(req.headers, env);
    return authResponse({ configured, user });
  } catch {
    return authResponse(
      { error: "Não foi possível abrir o acesso. Tente novamente." },
      503,
    );
  }
}
export async function login(req: Request, env: AuthEnv) {
  if (!sameOrigin(req)) return authResponse({ error: "Origem inválida." }, 403);
  try {
    if (!(await ensureBootstrap(env)) || !env.DB)
      return authResponse(
        { error: "O acesso ainda precisa ser configurado pelo administrador." },
        503,
      );
    let b;
    try {
      b = await readJson(req, 2048);
    } catch {
      return authResponse({ error: "Confira seu e-mail e senha." }, 400);
    }
    if (
      typeof b?.email !== "string" ||
      b.email.length > 254 ||
      typeof b.password !== "string" ||
      !b.password ||
      b.password.length > 256
    )
      return authResponse({ error: "Informe seu e-mail e sua senha." }, 400);
    const now = Math.floor(Date.now() / 1000),
      window = 600;
    await env.DB.batch([
      env.DB.prepare("DELETE FROM beto_auth_attempts WHERE expires_at<=?").bind(
        now,
      ),
      env.DB.prepare("DELETE FROM beto_sessions WHERE expires_at<=?").bind(now),
    ]);
    const keys: [[string, number], [string, number], [string, number]] = [
      [
        await tokenHash(
          "ip:" + (req.headers.get("cf-connecting-ip") || "local"),
        ),
        10,
      ],
      [await tokenHash("email:" + b.email.trim().toLowerCase()), 15],
      ["global", 80],
    ];
    for (const [key, limit] of keys) {
      const count = await env.DB.prepare(
        "INSERT INTO beto_auth_attempts (key,attempts,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET attempts=attempts+1 RETURNING attempts,expires_at",
      )
        .bind(key, now + window)
        .first<{ attempts: number; expires_at: number }>();
      if (!count || count.attempts > limit)
        return authResponse(
          { error: "Muitas tentativas. Aguarde alguns minutos." },
          429,
          {
            "Retry-After": String(
              Math.max(1, (count?.expires_at || now + window) - now),
            ),
          },
        );
    }
    const row = await env.DB.prepare(
      "SELECT id,password_hash,active FROM beto_users WHERE email=?",
    )
      .bind(b.email.trim().toLowerCase())
      .first<{ id: string; password_hash: string; active: number }>();
    const fallback =
      env.BETO_BOOTSTRAP_PASSWORD_HASH ||
      "pbkdf2-sha256$100000$00000000000000000000000000000000$0000000000000000000000000000000000000000000000000000000000000000";
    const valid = await verifyPassword(
      b.password,
      row?.password_hash || fallback,
    );
    if (!row || !row.active || !valid)
      return authResponse({ error: "E-mail ou senha incorretos." }, 401);
    const token = hex(crypto.getRandomValues(new Uint8Array(32)).buffer);
    await env.DB.prepare(
      "INSERT INTO beto_sessions (token_hash,user_id,expires_at) VALUES (?,?,?)",
    )
      .bind(await tokenHash(token), row.id, now + SESSION_SECONDS)
      .run();
    return authResponse({ ok: true }, 200, {
      "Set-Cookie": `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_SECONDS}`,
    });
  } catch {
    return authResponse(
      { error: "Não conseguimos entrar agora. Tente novamente." },
      503,
    );
  }
}
export async function logout(req: Request, env: AuthEnv) {
  if (!sameOrigin(req)) return authResponse({ error: "Origem inválida." }, 403);
  try {
    const token = sessionToken(req.headers);
    if (token && env.DB)
      await env.DB.prepare("DELETE FROM beto_sessions WHERE token_hash=?")
        .bind(await tokenHash(token))
        .run();
    return authResponse({ ok: true }, 200, {
      "Set-Cookie": `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
    });
  } catch {
    return authResponse(
      { error: "Não conseguimos sair. Tente novamente." },
      503,
    );
  }
}
export async function changePassword(req: Request, env: AuthEnv) {
  if (!sameOrigin(req)) return authResponse({ error: "Origem inválida." }, 403);
  try {
    const u = await readSession(req.headers, env);
    if (!u || !env.DB)
      return authResponse({ error: "Entre para continuar." }, 401);
    const b = await readJson(req, 2048);
    if (
      typeof b?.currentPassword !== "string" ||
      typeof b.password !== "string" ||
      b.password.length < 8 ||
      b.password.length > 256
    )
      return authResponse(
        { error: "A nova senha precisa ter entre 8 e 256 caracteres." },
        400,
      );
    const old = await env.DB.prepare(
      "SELECT password_hash FROM beto_users WHERE id=?",
    )
      .bind(u.userId)
      .first<{ password_hash: string }>();
    if (!old || !(await verifyPassword(b.currentPassword, old.password_hash)))
      return authResponse({ error: "A senha atual não confere." }, 400);
    await env.DB.batch([
      env.DB.prepare("UPDATE beto_users SET password_hash=? WHERE id=?").bind(
        await hashPassword(b.password),
        u.userId,
      ),
      env.DB.prepare("DELETE FROM beto_sessions WHERE user_id=?").bind(
        u.userId,
      ),
    ]);
    return authResponse({ ok: true }, 200, {
      "Set-Cookie": `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
    });
  } catch {
    return authResponse(
      { error: "Não conseguimos trocar a senha. Tente novamente." },
      503,
    );
  }
}
