import { verifyDocServerRequest } from "../services/onlyofficeJwt.js";

/**
 * Verifies that a request genuinely came from our JWT-enabled Document
 * Server (not a browser session — Document Server has no cookie, only its
 * own signed Authorization header). Styled after verifyExamToken in
 * backend/utils/middleware.js, but there's no cookie fallback here since
 * Document Server never carries one.
 */
export const verifyDocServerToken = (req, res, next) => {
  try {
    req.docServerPayload = verifyDocServerRequest(req.headers.authorization);
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or missing Document Server token" });
  }
};
