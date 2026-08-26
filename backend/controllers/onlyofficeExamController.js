import * as onlyofficeExamService from "../services/onlyofficeExamService.js";
import { signConfig } from "../services/onlyofficeJwt.js";
import { CONTAINER_BASE_URL } from "../utils/onlyofficeUrls.js";
import { SPREADSHEET_FILE_TYPE, SPREADSHEET_CONTENT_TYPE } from "../utils/onlyofficeTemplate.js";

/**
 * @desc Builds and signs the DocsAPI.DocEditor config for the real exam's
 * spreadsheet scratch pane. Protected by verifyExamToken — examId comes
 * ONLY from the verified token (req.exam.ExamId), never a URL param, so one
 * student's browser can never be pointed at another student's document.
 * The browser must pass this config through to DocsAPI.DocEditor verbatim
 * (no field may be mutated, or the signature stops matching).
 */
export const getConfig = (req, res) => {
  const examId = req.exam.ExamId;
  const { questionNumber } = req.params;

  const { version } = onlyofficeExamService.getMeta(examId, questionNumber);

  const config = {
    document: {
      fileType: SPREADSHEET_FILE_TYPE,
      title: `Question ${questionNumber} — Rough Work.${SPREADSHEET_FILE_TYPE}`,
      url: `${CONTAINER_BASE_URL}/api/onlyoffice/exam/${examId}/${questionNumber}/document`,
      key: `${examId}-q${questionNumber}-v${version}`,
      permissions: { edit: true, download: false, print: false, copy: true },
    },
    documentType: "cell",
    editorConfig: {
      mode: "edit",
      lang: "en",
      callbackUrl: `${CONTAINER_BASE_URL}/api/onlyoffice/exam/${examId}/${questionNumber}/callback`,
      user: { id: String(req.exam.userId), name: "Student" },
      customization: { chat: false, comments: false, help: false, about: false },
    },
    height: "100%",
    width: "100%",
  };
  config.token = signConfig(config);

  return res.status(200).json(config);
};

/**
 * @desc Serve the current exam document bytes. Protected by
 * verifyDocServerToken — trust comes from the verified Document Server JWT,
 * not from the examId/questionNumber path segments (which aren't secret).
 */
export const getDocument = (req, res) => {
  const { examId, questionNumber } = req.params;
  const buffer = onlyofficeExamService.getDocument(examId, questionNumber);
  res.setHeader("Content-Type", SPREADSHEET_CONTENT_TYPE);
  return res.status(200).send(buffer);
};

/**
 * @desc OnlyOffice Document Server save-callback for the real exam.
 * Same status-code handling as the Practice Room callback: 2 = MustSave,
 * 6 = MustForceSave; everything else is acknowledged and ignored.
 */
export const handleCallback = async (req, res) => {
  const { examId, questionNumber } = req.params;
  const { status, url } = req.body || {};

  try {
    if ((status === 2 || status === 6) && url) {
      await onlyofficeExamService.saveFromCallback(examId, questionNumber, url);
    }
    return res.status(200).json({ error: 0 });
  } catch (err) {
    console.error(`[onlyoffice-exam] callback save failed for ${examId}:q${questionNumber}:`, err.message);
    return res.status(200).json({ error: 1 });
  }
};
