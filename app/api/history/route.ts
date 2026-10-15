import { access } from "@/db/access";
import { storage } from "@/db/store";
import { authResponse } from "@/lib/password-auth";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  try {
    const a = await access(req);
    if (!a) return authResponse({ error: "Entre para continuar." }, 401);
    const url = new URL(req.url);
    if (!url.searchParams.has("version")) {
      const before = Number(
        url.searchParams.get("before") || Number.MAX_SAFE_INTEGER,
      );
      if (!Number.isSafeInteger(before) || before < 1)
        return authResponse({ error: "Página inválida." }, 400);
      const rows = await storage()
        .prepare(
          "SELECT id,version,action,created FROM beto_revisions WHERE owner=? AND version<? ORDER BY version DESC LIMIT 40",
        )
        .bind(a.workspace, before)
        .all<{
          id: string;
          version: number;
          action: string;
          created: string;
        }>();
      return authResponse({
        revisions: rows.results,
        nextBefore:
          rows.results.length === 40 ? rows.results.at(-1)!.version : null,
      });
    }
    const revision = Number(url.searchParams.get("version"));
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
