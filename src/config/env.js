/**
 * Single source of truth for environment configuration.
 *
 * No backend URL is hardcoded anywhere in the app - it comes exclusively from
 * the VITE_API_URL build-time env var (see .env / .env.example). Centralising
 * it here means:
 *   - there is exactly ONE place the URL is defined (no scattered fallbacks
 *     that could drift or accidentally point at the wrong environment),
 *   - a missing/misconfigured URL fails loudly in dev instead of silently
 *     shipping a hardcoded production host.
 *
 * NOTE: every VITE_* value is embedded into the client bundle at build time and
 * is therefore PUBLIC. Never put a secret in a VITE_* var - the API base URL is
 * not a secret, but tokens/keys must never live here.
 */

const RAW_API_URL = import.meta.env.VITE_API_URL;

/**
 * Validate the API URL: must be present, non-empty, properly formatted, and use http/https.
 * @throws {Error} if the URL is missing, empty, malformed, or uses an invalid protocol.
 */
function validateApiUrl(url) {
  // Check if URL is missing or empty
  if (!url || typeof url !== "string" || url.trim() === "") {
    throw new Error(
      "VITE_API_URL is not set or is empty. " +
      "Create a .env file with: VITE_API_URL=https://your-backend.com/api/v1 " +
      "(see .env.example)."
    );
  }

  // Check if URL is only whitespace
  const trimmed = url.trim();
  if (trimmed !== url) {
    throw new Error(
      "VITE_API_URL contains leading/trailing whitespace. " +
      "Check your .env file."
    );
  }

  // Attempt to parse as URL
  let parsedUrl;
  try {
    // Prepend protocol if missing to allow URL parsing
    const urlToParse = url.startsWith("http://") || url.startsWith("https://") 
      ? url 
      : `https://${url}`;
    parsedUrl = new URL(urlToParse);
  } catch (e) {
    throw new Error(
      `VITE_API_URL is malformed: "${url}". ` +
      "Must be a valid URL (e.g., https://your-backend.com/api/v1).",
      { cause: e }
    );
  }

  // Validate protocol
  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new Error(
      `VITE_API_URL uses invalid protocol: "${parsedUrl.protocol}". ` +
      "Must use http:// or https://."
    );
  }

  // Validate that hostname exists
  if (!parsedUrl.hostname) {
    throw new Error(
      `VITE_API_URL has no valid hostname: "${url}". ` +
      "Must be a complete URL (e.g., https://your-backend.com/api/v1)."
    );
  }

  return url;
}

// Validate at module load time - this ensures the app fails early if config is wrong
const validatedUrl = validateApiUrl(RAW_API_URL);

/** Backend API base, including the /api/v1 suffix. */
export const API_BASE_URL = validatedUrl.replace(/\/$/, "");

/** Backend origin without the /api/v1 suffix - used to resolve /static/... paths. */
export const BACKEND_ORIGIN = API_BASE_URL.replace(/\/api\/v1\/?$/, "").replace(/\/$/, "");

/** WebSocket base (ws:// or wss://) derived from the API base. */
export const WS_BASE_URL = API_BASE_URL.replace(/^http/, "ws");
