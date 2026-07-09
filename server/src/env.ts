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
};
