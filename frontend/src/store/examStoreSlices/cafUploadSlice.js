/**
 * CAF exam submission — a raw XHR upload (not fetch, since it needs
 * upload-progress events fetch can't give). One slice of useExamStore.js —
 * see that file for how the slices are composed. Split out of a single
 * 517-line store; state/actions here moved verbatim, no behavior change.
 */
export const createCafUploadSlice = (set, get) => ({
  uploadProgress: 0,
  uploadDetails: null,

  submitCafAnswer: async (cafExamId, file) => {
    set({ saving: true, uploadProgress: 0, uploadDetails: null, error: null });
    const { BASEURL } = get();

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${BASEURL}/caf-answers/submitAnswer`);
      xhr.withCredentials = true;

      const uploadStartTime = Date.now();
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const loaded = e.loaded;
          const total = e.total;
          const progress = Math.round((loaded / total) * 100);

          const currentTime = Date.now();
          const duration = (currentTime - uploadStartTime) / 1000; // duration in seconds

          let speed = 0; // Bytes per second
          let remainingTime = 0; // estimated remaining seconds
          if (duration > 0) {
            speed = loaded / duration;
            const remainingBytes = total - loaded;
            remainingTime = speed > 0 ? Math.round(remainingBytes / speed) : 0;
          }

          set({
            uploadProgress: progress,
            uploadDetails: { loaded, total, speed, remainingTime }
          });
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const result = JSON.parse(xhr.responseText);
            set({ saving: false, uploadProgress: 0, uploadDetails: null });
            resolve(result);
          } catch (e) {
            set({ error: "Failed to parse response", saving: false, uploadProgress: 0, uploadDetails: null });
            reject(e);
          }
        } else {
          let errorMsg = "Failed to submit CAF answer";
          try {
            const errorData = JSON.parse(xhr.responseText);
            errorMsg = errorData.error || errorMsg;
          } catch (e) {}
          set({ error: errorMsg, saving: false, uploadProgress: 0, uploadDetails: null });
          reject(new Error(errorMsg));
        }
      };

      xhr.onerror = () => {
        set({ error: "Network error during upload. Please try again.", saving: false, uploadProgress: 0, uploadDetails: null });
        reject(new Error("Network error during upload"));
      };

      xhr.ontimeout = () => {
        set({ error: "Upload timed out. Please try again.", saving: false, uploadProgress: 0, uploadDetails: null });
        reject(new Error("Upload timed out"));
      };

      xhr.timeout = 300000; // 2 min timeout for large files

      const formData = new FormData();
      formData.append("questionId", cafExamId);
      formData.append("pdf", file);
      xhr.send(formData);
    });
  },
});
