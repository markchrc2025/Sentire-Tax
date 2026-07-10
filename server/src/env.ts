// env.ts — typed access to the API service's environment.
// Required vars fail fast at boot with a clear message (better than a
// half-alive service that 500s on first use).

function required(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`[env] missing required environment variable ${name}`);
    process.exit(1);
  }
  return v;
}

export const env = {
  /** postgresql://owner:<pw>@<host>:<port>/sentire_tax */
  databaseUrl: required("DATABASE_URL"),
  /** long random string; signs the auth JWTs */
  jwtSecret: required("JWT_SECRET"),
  // S3-compatible object storage (Sliplane Object Storage) for COR files.
  s3Endpoint: required("S3_ENDPOINT"),
  s3Bucket: required("S3_BUCKET"),
  s3AccessKeyId: required("S3_ACCESS_KEY_ID"),
  s3SecretAccessKey: required("S3_SECRET_ACCESS_KEY"),
  s3Region: process.env.S3_REGION || "auto",
  /** comma-separated allowed origins for CORS; default allows all */
  corsOrigin: process.env.CORS_ORIGIN || "*",
  port: Number(process.env.PORT || 8080),

  // --- Accounting Firm Portal integration (optional) ----------------------
  // The `portal-sync` connector is enabled only when all three are set. It
  // holds the Portal OAuth2 client-credentials server-side; the browser never
  // sees them (design §7.2 trust boundary).
  portal: {
    baseUrl: (process.env.PORTAL_BASE_URL || "").replace(/\/$/, ""), // e.g. https://…/api/v1
    clientId: process.env.PORTAL_CLIENT_ID || "",
    clientSecret: process.env.PORTAL_CLIENT_SECRET || "",
  },
};

/** True when the Portal connector is configured (all creds present). */
export const portalEnabled = (): boolean =>
  Boolean(env.portal.baseUrl && env.portal.clientId && env.portal.clientSecret);
