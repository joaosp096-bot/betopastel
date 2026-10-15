import { env } from "cloudflare:workers";
import { access } from "@/db/access";
import {
  authResponse,
  sameOrigin,
  readJson,
  hashPassword,
} from "@/lib/password-auth";
import { z } from "zod";
export const dynamic = "force-dynamic";
const schema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(254),
  role: z.enum(["admin", "operador"]),
  active: z.boolean().default(true),
  password: z.string().min(4).max(256).optional(),
});
export async function GET(req: Request) {
  try {
    const a = await access(req);
    if (!a) return authResponse({ error: "Entre para continuar." }, 401);
    if (a.actor.role !== "admin")
      return authResponse(
        { error: "Apenas o administrador pode gerenciar acessos." },
        403,
      );
    const rows = await env
      .DB!.prepare(
        "SELECT id,email,name,role,active FROM beto_users ORDER BY created",
      )
      .all();
    return authResponse({ users: rows.results });
  } catch {
    return authResponse({ error: "Não conseguimos abrir os acessos." }, 503);
  }
}
export async function PUT(req: Request) {
  if (!sameOrigin(req)) return authResponse({ error: "Origem inválida." }, 403);
  try {
    const a = await access(req);
    if (!a) return authResponse({ error: "Entre para continuar." }, 401);
    if (a.actor.role !== "admin")
      return authResponse(
        { error: "Apenas o administrador pode gerenciar acessos." },
        403,
      );
    const parsed = schema.safeParse(await readJson(req));
    if (!parsed.success)
      return authResponse(
        { error: "Confira nome, e-mail, papel e senha." },
        400,
      );
    const u = parsed.data;
    if (u.id === a.actor.userId && (!u.active || u.role !== "admin"))
      return authResponse(
        { error: "Mantenha seu próprio acesso como administrador." },
        400,
      );
    if (!u.id) {
      if (!u.password)
        return authResponse({ error: "Informe uma senha temporária." }, 400);
      await env
        .DB!.prepare(
          "INSERT INTO beto_users (id,email,name,role,password_hash,active,created) VALUES (?,?,?,?,?,?,?)",
        )
        .bind(
          crypto.randomUUID(),
          u.email.toLowerCase(),
          u.name,
          u.role,
          await hashPassword(u.password),
          u.active ? 1 : 0,
          new Date().toISOString(),
        )
        .run();
    } else {
      const exists = await env
        .DB!.prepare("SELECT id FROM beto_users WHERE id=?")
        .bind(u.id)
        .first();
      if (!exists)
        return authResponse({ error: "Pessoa não encontrada." }, 404);
      const updates = [
        env
          .DB!.prepare(
            "UPDATE beto_users SET email=?,name=?,role=?,active=? WHERE id=?",
          )
          .bind(u.email.toLowerCase(), u.name, u.role, u.active ? 1 : 0, u.id),
      ];
      if (u.password)
        updates.push(
          env
            .DB!.prepare("UPDATE beto_users SET password_hash=? WHERE id=?")
            .bind(await hashPassword(u.password), u.id),
        );
      if (u.password || !u.active)
        updates.push(
          env
            .DB!.prepare("DELETE FROM beto_sessions WHERE user_id=?")
            .bind(u.id),
        );
      await env.DB!.batch(updates);
    }
    return authResponse({ ok: true });
  } catch {
    return authResponse(
      {
        error:
          "Não conseguimos salvar. Confira se esse e-mail já está cadastrado.",
      },
      400,
    );
  }
}
