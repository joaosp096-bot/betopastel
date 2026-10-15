import { access } from "@/db/access";
import { storage } from "@/db/store";
import { authResponse } from "@/lib/password-auth";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  try {
    const a = await access(req);
    if (!a) return authResponse({ error: "Entre para continuar." }, 401);
    const revision = Number(new URL(req.url).searchParams.get("version"));
    if (!Number.isInteger(revision) || revision < 1)
      return authResponse({ error: "Revisão inválida." }, 400);
    const row = await storage()
      .prepare(
        "SELECT version,action,payload,created FROM beto_revisions WHERE owner=? AND version=?",
      )
      .bind(a.workspace, revision)
      .first<{
        version: number;
        action: string;
        payload: string;
        created: string;
      }>();
    return row
      ? authResponse({
          ...row,
          state: JSON.parse(row.payload),
          payload: undefined,
        })
      : authResponse({ error: "Revisão não encontrada." }, 404);
  } catch {
    return authResponse({ error: "Não conseguimos abrir a revisão." }, 503);
  }
}
