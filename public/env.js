// Runtime environment for container deployments (e.g. Sliplane).
// This stub ships empty; the Docker entrypoint (deploy/docker-entrypoint.sh)
// regenerates it from the container's environment variables at startup.
// On Vercel / local dev it stays empty and the app falls back to the
// build-time import.meta.env values.
window.__ENV = {};
