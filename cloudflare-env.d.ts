declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    BETO_BOOTSTRAP_EMAIL?: string;
    BETO_BOOTSTRAP_PASSWORD_HASH?: string;
    BETO_WORKSPACE_ID?: string;
  }
}
