import { access } from "@/db/access";
import { storage } from "@/db/store";
import { authResponse, sameOrigin } from "@/lib/password-auth";
import { readState } from "@/lib/model";
export const dynamic = "force-dynamic";
const MAX_FILE = 768 * 1024,
  MAX_BODY = MAX_FILE + 12000;
async function table() {
  const db = storage();
  await db
    .prepare(
      "CREATE TABLE IF NOT EXISTS beto_receipts (id TEXT PRIMARY KEY, owner TEXT NOT NULL, expense_id TEXT NOT NULL, name TEXT NOT NULL, mime TEXT NOT NULL, size INTEGER NOT NULL, body BLOB NOT NULL, created TEXT NOT NULL, created_by TEXT NOT NULL)",
    )
    .run();
  return db;
}
export async function GET(req: Request) {
  try {
    const a = await access(req);
    if (!a)
      return authResponse(
        { error: "Entre para consultar os comprovantes." },
        401,
      );
    const url = new URL(req.url),
      db = await table(),
      id = url.searchParams.get("id");
    if (id) {
      const file = await db
        .prepare(
          "SELECT name,mime,body FROM beto_receipts WHERE id=? AND owner=?",
        )
        .bind(id, a.workspace)
        .first<{ name: string; mime: string; body: number[] | ArrayBuffer }>();
      if (!file)
        return authResponse({ error: "Comprovante não encontrado." }, 404);
      return new Response(
        new Uint8Array(
          file.body instanceof ArrayBuffer ? file.body : file.body,
        ),
        {
          headers: {
            "Content-Type": file.mime,
            "Content-Disposition":
              "inline; filename*=UTF-8''" + encodeURIComponent(file.name),
            "Cache-Control": "private, no-store",
            "X-Content-Type-Options": "nosniff",
            "Content-Security-Policy":
              "default-src 'none'; frame-ancestors 'self'; sandbox",
          },
        },
      );
    }
    const expenseId = url.searchParams.get("expenseId") || "";
    const files = await db
      .prepare(
        "SELECT id,name,mime,size,created,created_by FROM beto_receipts WHERE owner=? AND expense_id=? ORDER BY created DESC",
      )
      .bind(a.workspace, expenseId)
      .all();
    return authResponse({ files: files.results });
  } catch {
    return authResponse(
      { error: "Não conseguimos abrir os comprovantes. Tente novamente." },
      503,
    );
  }
}
export async function POST(req: Request) {
  if (!sameOrigin(req)) return authResponse({ error: "Origem inválida." }, 403);
  try {
    const a = await access(req);
    if (!a)
      return authResponse(
        { error: "Entre novamente para anexar. Seu gasto continua salvo." },
        401,
      );
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.startsWith("multipart/form-data"))
      return authResponse({ error: "Envie uma foto ou PDF." }, 415);
    if (Number(req.headers.get("content-length") || 0) > MAX_BODY)
      return authResponse(
        { error: "Arquivo muito grande. Use uma foto ou PDF de até 768 KB." },
        413,
      );
    const reader = req.body?.getReader();
    if (!reader) return authResponse({ error: "Arquivo vazio." }, 400);
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
      const v = await reader.read();
      if (v.done) break;
      size += v.value.length;
      if (size > MAX_BODY) {
        await reader.cancel();
        return authResponse(
          { error: "O arquivo supera o limite de 768 KB." },
          413,
        );
      }
      chunks.push(v.value);
    }
    const body = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      body.set(chunk, offset);
      offset += chunk.length;
    }
    const form = await new Response(body, {
        headers: { "Content-Type": contentType },
      }).formData(),
      file = form.get("file"),
      expenseId = String(form.get("expenseId") || "");
    if (!(file instanceof File) || !file.size || file.size > MAX_FILE)
      return authResponse(
        { error: "Selecione uma foto ou PDF de até 768 KB." },
        400,
      );
    const db = await table(),
      workspace = await db
        .prepare("SELECT payload FROM beto_workspaces WHERE owner=?")
        .bind(a.workspace)
        .first<{ payload: string }>();
    if (
      !workspace ||
      !readState(JSON.parse(workspace.payload)).expenses.some(
        (e) => e.id === expenseId && !e.cancelled,
      )
    )
      return authResponse(
        { error: "Salve o gasto antes de anexar a nota." },
        400,
      );
    const bytes = new Uint8Array(await file.arrayBuffer()),
      head = String.fromCharCode(...bytes.slice(0, 12));
    const mime =
      bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
        ? "image/jpeg"
        : bytes[0] === 137 && head.slice(1, 4) === "PNG"
          ? "image/png"
          : head.startsWith("RIFF") && head.slice(8, 12) === "WEBP"
            ? "image/webp"
            : head.startsWith("%PDF-")
              ? "application/pdf"
              : null;
    if (!mime || file.type !== mime)
      return authResponse(
        { error: "Formato não aceito. Use JPEG, PNG, WebP ou PDF." },
        415,
      );
    const id = crypto.randomUUID(),
      name =
        file.name.replace(/[\x00-\x1f\x7f]/g, "").slice(0, 120) ||
        "comprovante";
    const saved = await db
      .prepare(
        "INSERT INTO beto_receipts (id,owner,expense_id,name,mime,size,body,created,created_by) SELECT ?,?,?,?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM beto_receipts WHERE owner=? AND expense_id=?)<3 AND (SELECT COALESCE(SUM(size),0) FROM beto_receipts WHERE owner=?) + ? <= 52428800",
      )
      .bind(
        id,
        a.workspace,
        expenseId,
        name,
        mime,
        bytes.length,
        Array.from(bytes),
        new Date().toISOString(),
        a.actor.name,
        a.workspace,
        expenseId,
        a.workspace,
        bytes.length,
      )
      .run();
    if (!saved.meta.changes)
      return authResponse(
        {
          error:
            "Limite de três comprovantes por gasto ou 50 MB do negócio atingido. O gasto continua salvo.",
        },
        400,
      );
    return authResponse({ id, name, mime, size: bytes.length }, 201);
  } catch {
    return authResponse(
      {
        error:
          "Não conseguimos anexar. Seu gasto continua salvo; tente novamente.",
      },
      503,
    );
  }
}
