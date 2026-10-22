declare const __BETO_BUILD_COMMIT__: string;
/** Public build identity only; never exposes runtime configuration or credentials. */
export function GET() {
  return Response.json({ release: "beto-weekly-v2-2026-10-22", commit: typeof __BETO_BUILD_COMMIT__ === "string" ? __BETO_BUILD_COMMIT__ : "unknown" }, { headers: { "Cache-Control": "no-store" } });
}
