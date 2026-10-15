import { storage } from "@/db/store";
import { access } from "@/db/access";
import { emptyState, stateSchema, readState } from "@/lib/model";
import { applyOperation, operationSchema } from "@/lib/workflow";
import { sameOrigin, tokenHash, authResponse } from "@/lib/password-auth";
import { z } from "zod";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  try {
    const a = await access(req);
    if (!a)
      return authResponse({ error: "Entre para abrir os registros." }, 401);
    const db = storage();
    const row = await db
      .prepare(
        "SELECT payload,version,updated FROM beto_workspaces WHERE owner=?",
      )
      .bind(a.workspace)
      .first<{ payload: string; version: number; updated: string }>();
    const audit = await db
      .prepare(
        "SELECT id,version,action,created FROM beto_revisions WHERE owner=? ORDER BY version DESC LIMIT 40",
      )
      .bind(a.workspace)
      .all();
    return authResponse({
      state: row ? readState(JSON.parse(row.payload)) : emptyState(),
      version: row?.version || 0,
      updated: row?.updated || null,
      audit: audit.results,
      actor: a.actor,
      serverTime: new Date().toISOString(),
    });
  } catch {
    return authResponse(
      { error: "Não foi possível carregar os registros. Tente novamente." },
      503,
    );
  }
}
const requestSchema = z.object({
  operation: operationSchema,
  version: z.number().int().min(0),
  requestId: z.string().uuid(),
});
export async function PUT(req: Request) {
  if (!sameOrigin(req)) return authResponse({ error: "Origem inválida." }, 403);
  try {
    const a = await access(req);
    if (!a)
      return authResponse(
        {
          error:
            "Sua sessão terminou. Entre novamente; mantenha esta tela aberta para preservar o formulário.",
        },
        401,
      );
    if (!req.headers.get("content-type")?.includes("application/json"))
      return authResponse({ error: "Formato inválido." }, 415);
    const raw = await req.text();
    if (new TextEncoder().encode(raw).length > 64000)
      return authResponse({ error: "Limite de dados atingido." }, 413);
    let parsed;
    try {
      parsed = requestSchema.safeParse(JSON.parse(raw));
    } catch {
      return authResponse({ error: "Dados inválidos." }, 400);
    }
    if (!parsed.success)
      return authResponse(
        { error: parsed.error.issues[0]?.message || "Revise os dados." },
        400,
      );
    const { operation, version, requestId } = parsed.data,
      db = storage(),
      requestHash = await tokenHash(JSON.stringify(operation));
    const prior = await db
      .prepare(
        "SELECT payload,version,created,action,request_hash,receipt_id FROM beto_revisions WHERE id=? AND owner=?",
      )
      .bind(requestId, a.workspace)
      .first<{
        payload: string;
        version: number;
        created: string;
        action: string;
        request_hash: string | null;
        receipt_id: string | null;
      }>();
    if (prior) {
      if (prior.request_hash !== requestHash)
        return authResponse(
          { error: "Este pedido já foi usado para outro registro." },
          409,
        );
      const current = await db
        .prepare(
          "SELECT payload,version,updated FROM beto_workspaces WHERE owner=?",
        )
        .bind(a.workspace)
        .first<{ payload: string; version: number; updated: string }>();
      const original = readState(JSON.parse(prior.payload));
      return authResponse({
        state: current ? readState(JSON.parse(current.payload)) : original,
        version: current?.version || prior.version,
        updated: current?.updated || prior.created,
        receipt: original.records.find((e) => e.id === prior.receipt_id),
        action: prior.action,
        idempotent: true,
        serverTime: new Date().toISOString(),
      });
    }
    const row = await db
      .prepare("SELECT payload,version FROM beto_workspaces WHERE owner=?")
      .bind(a.workspace)
      .first<{ payload: string; version: number }>();
    if ((row?.version || 0) !== version)
      return authResponse(
        {
          error:
            "Outra pessoa salvou antes. Atualize os registros e confira seus valores; o formulário foi mantido.",
          conflict: true,
        },
        409,
      );
    let next;
    try {
      next = applyOperation(
        row ? readState(JSON.parse(row.payload)) : emptyState(),
        operation,
        { ...a.actor, now: new Date() },
      );
    } catch (e) {
      return authResponse(
        {
          error:
            e instanceof z.ZodError
              ? e.issues[0]?.message
              : (e as Error).message,
        },
        400,
      );
    }
    const payload = JSON.stringify(next.state),
      now = new Date().toISOString();
    const write =
      version === 0
        ? db
            .prepare(
              "INSERT OR IGNORE INTO beto_workspaces (owner,payload,version,updated) VALUES (?,?,1,?)",
            )
            .bind(a.workspace, payload, now)
        : db
            .prepare(
              "UPDATE beto_workspaces SET payload=?,version=version+1,updated=? WHERE owner=? AND version=?",
            )
            .bind(payload, now, a.workspace, version);
    const audit = db
      .prepare(
        "INSERT INTO beto_revisions (id,owner,version,action,payload,created,request_hash,receipt_id) SELECT ?,owner,version,?,payload,?,?,? FROM beto_workspaces WHERE owner=? AND changes()=1",
      )
      .bind(
        requestId,
        `${a.actor.name} · ${next.action}`,
        now,
        requestHash,
        next.receipt?.id || null,
        a.workspace,
      );
    const result = await db.batch([write, audit]);
    if (!result[0].meta.changes)
      return authResponse(
        {
          error: "Outra pessoa salvou antes. Seu formulário foi mantido.",
          conflict: true,
        },
        409,
      );
    return authResponse({
      state: next.state,
      version: version + 1,
      updated: now,
      receipt: next.receipt,
      serverTime: now,
      action: next.action,
    });
  } catch {
    return authResponse(
      {
        error:
          "Não foi possível confirmar. Seus valores continuam no formulário.",
      },
      503,
    );
  }
}
