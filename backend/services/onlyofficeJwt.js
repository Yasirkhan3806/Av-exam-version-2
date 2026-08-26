import jwt from "jsonwebtoken";

/**
 * JWT helpers for talking to a JWT-enabled OnlyOffice Document Server.
 *
 * Deliberately its own secret (ONLYOFFICE_JWT_SECRET), not the app's own
 * exam-auth JWT_SECRET (backend/utils/middleware.js) — different trust
 * domains. This secret must match the Document Server container's own
 * JWT_SECRET env var exactly.
 *
 * Two directions:
 *  - signConfig(): we sign the editor config we hand to the browser, so
 *    Document Server can verify the browser didn't tamper with it
 *    (permissions, document url, etc.) before honoring it.
 *  - verifyDocServerRequest(): Document Server signs its own outgoing
 *    requests (fetching the document, posting the save-callback) the same
 *    way; we verify those before trusting them.
 * https://api.onlyoffice.com/docs/docs-api/additional-api/signature/
 */

function getSecret() {
  const secret = process.env.ONLYOFFICE_JWT_SECRET;
  if (!secret) {
    throw new Error("ONLYOFFICE_JWT_SECRET is not set");
  }
  return secret;
}

/**
 * Signs an editor config object for DocsAPI.DocEditor. The token is signed
 * over the config itself (not a wrapped payload) per OnlyOffice's spec.
 * @returns {string} JWT to attach as config.token
 */
export function signConfig(configObject) {
  return jwt.sign(configObject, getSecret(), { algorithm: "HS256" });
}

/**
 * Verifies a Document Server-originated request's Authorization header.
 * Document Server wraps its outgoing payload as { payload: ... }.
 * @param {string|undefined} authHeader e.g. "Bearer <token>"
 * @returns {object} the inner payload (decoded.payload)
 * @throws if the header is missing/malformed or the token is invalid
 */
export function verifyDocServerRequest(authHeader) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Missing or malformed Authorization header");
  }
  const token = authHeader.slice("Bearer ".length);
  const decoded = jwt.verify(token, getSecret(), { algorithms: ["HS256"] });
  return decoded.payload;
}
