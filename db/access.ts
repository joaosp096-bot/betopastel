import { env } from "cloudflare:workers";
import { readSession } from "@/lib/password-auth";
import type { Actor } from "@/lib/workflow";
export async function access(
  req: Request,
): Promise<{ actor: Actor; workspace: string } | null> {
  const user = await readSession(req.headers, env);
  return user
    ? { actor: user, workspace: env.BETO_WORKSPACE_ID || "beto-pastel" }
    : null;
}
