import * as onlyofficeService from "../services/onlyofficeService.js";
import { signConfig } from "../services/onlyofficeJwt.js";
import { CONTAINER_BASE_URL } from "../utils/onlyofficeUrls.js";
import { SPREADSHEET_FILE_TYPE, SPREADSHEET_CONTENT_TYPE } from "../utils/onlyofficeTemplate.js";

/**
 * @desc Current saved-version number for a practice document (stub, in-memory)
 */
export const getMeta = (req, res) => {
  const { baseKey } = req.params;
  return res.status(200).json(onlyofficeService.getMeta(baseKey));
};

/**
 * @desc Builds and signs the DocsAPI.DocEditor config for a practice
 * document. The Document Server container requires JWT-signed configs
 * (shared with the exam integration, see onlyofficeExamController.js), so
 * this moved server-side — the frontend used to build this object inline
 * and hand it straight to DocsAPI.DocEditor, which stopped working the
 * moment JWT was enabled on the container. Still unauthenticated (matches
 * Practice Room's existing no-real-auth status) — only the signing moved,
 * not who's allowed to call it.
 */
export const getConfig = (req, res) => {
  const { baseKey } = req.params;
  const userId = typeof req.query.userId === "string" ? req.query.userId : "practice-student";
  const { version } = onlyofficeService.getMeta(baseKey);

  const config = {
    document: {
      fileType: SPREADSHEET_FILE_TYPE,
      title: `${baseKey} — Rough Work.${SPREADSHEET_FILE_TYPE}`,
      url: `${CONTAINER_BASE_URL}/api/onlyoffice/practice/${baseKey}/document`,
      key: `${baseKey}-v${version}`,
      permissions: { edit: true, download: false, print: false, copy: true },
    },
    documentType: "cell",
    editorConfig: {
      mode: "edit",
      lang: "en",
      callbackUrl: `${CONTAINER_BASE_URL}/api/onlyoffice/practice/${baseKey}/callback`,
      user: { id: userId, name: "Student" },
      customization: { chat: false, comments: false, help: false, about: false },
    },
    height: "100%",
    width: "100%",
  };
  config.token = signConfig(config);

  return res.status(200).json(config);
};

/**
 * @desc Serve the current practice document bytes.
 * Fetched by the Document Server itself (server-to-server), not by the
 * student's browser — no auth to check here, see route file for the caveat.
 */
export const getDocument = (req, res) => {
  const { baseKey } = req.params;
  const buffer = onlyofficeService.getDocument(baseKey);
  res.setHeader("Content-Type", SPREADSHEET_CONTENT_TYPE);
  return res.status(200).send(buffer);
};

/**
 * @desc OnlyOffice Document Server save-callback.
 * Status codes we care about: 2 = MustSave, 6 = MustForceSave (document
 * closed / force-saved with edits). Everything else (1 = being edited,
 * 4 = closed with no changes, etc.) is acknowledged and ignored.
 * https://api.onlyoffice.com/docs/docs-api/usage-api/callback-handler/
 */
export const handleCallback = async (req, res) => {
  const { baseKey } = req.params;
  const { status, url } = req.body || {};

  try {
    if ((status === 2 || status === 6) && url) {
      await onlyofficeService.saveFromCallback(baseKey, url);
    }
    return res.status(200).json({ error: 0 });
  } catch (err) {
    console.error(`[onlyoffice] callback save failed for ${baseKey}:`, err.message);
    // error: 1 tells Document Server the save didn't take, so it retries.
    return res.status(200).json({ error: 1 });
  }
};
