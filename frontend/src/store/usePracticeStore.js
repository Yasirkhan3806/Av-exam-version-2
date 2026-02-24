import { create } from "zustand";

const usePracticeStore = create((set, get) => ({
  // State
  currentQuestion: 1,
  totalQuestions: 1,
  questionName: "Practice Exam",
  questionsObj: {},
  answers: {},
  workbookStates: {},
  saving: false,
  error: null,

  // Timer State
  totalTime: 0,
  remainingTime: 0,
  startTime: null,
  isPractice: true,

  // Actions
  initializePractice: () => {
    set({
      currentQuestion: 1,
      totalQuestions: 1,
      questionName: "Practice Session",
      // Dummy blank PDF base64
      questionsObj: {
        q1: "data:application/pdf;base64,JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwogIC9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmoKPDwKICAvVHlwZSAvUGFnZXwKICAvTWVkaWFCb3ggWyAwIDAgNTk1LjI4IDg0MS44OSBdCiAgL0NvdW50IDEKICAvS2lkcyBbIDMgMCBSIF0KPj4KZW5kb2JqCgozIDAgb2JqCjw8CiAgL1R5cGUgL1BhZ2UKICAvUGFyZW50IDIgMCBSCiAgL1Jlc291cmNlcyA8PAogICAgL0ZvbnQgPDwKICAgICAgL0YxIDQgMCBSCig+PgogID4+CiAgL0NvbnRlbnRzIDUgMCBSCj4+CmVuZG9iagoKNCAwIG9iago8PAogIC9UeXBlIC9Gb250CiAgL1N1YnR5cGUgL1R5cGUxCiAgL0Jhc2VGb250IC9UaW1lcy1Sb21hbgorPgplbmRvYmoKCjUgMCBvYmoKPDwgL0xlbmd0aCAyMjIgPj4Kc3RyZWFtCkJVCjEuMDkzIDAuODY1IDEuMDkzIHJnCjAuOTQ4IDAuODg1IDAuOTQ4IFJHCjU3NS4yOCA4MjEuODkgcmUKZgoxLjAgMC4wIDAuMCByZwouMCAwLjAgMC4wIFJHCkJUKC9GMSAyNCBUZgoxMDAgNzAwIFRkCihQcmFjdGljZSBRdWVzdGlvbikgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDEwIDAwMDAwIG4gCjAwMDAwMDAwNjAgMDAwMDAgbiAgCjAwMDAwMDAxNTcgMDAwMDAgbiAgCjAwMDAwMDAyNjggMDAwMDAgbiAgCjAwMDAwMDAzNjAgMDAwMDAgbiAgCnRyYWlsZXIKPDwKICAvU2l6ZSA2CiAgL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjYzMgolJUVPRgo=",
      },
      answers: {},
      workbookStates: {},
      startTime: Date.now(),
    });

  },

  setAnswer: (answer) => {
    set((state) => ({
      answers: {
        ...state.answers,
        [`q${state.currentQuestion}`]: answer,
      },
    }));
  },

  saveWorkbookState: (id, data) => {
    set((state) => ({
      workbookStates: {
        ...state.workbookStates,
        [id]: data,
      },
    }));
  },

  getWorkbookState: (id) => {
    return get().workbookStates[id];
  },

  setSaving: (val) => set({ saving: val }),

  tick: () => {
    // Increment remainingTime to trigger re-renders
    const start = get().startTime;
    if (!start) return;
    const elapsed = Math.floor((Date.now() - start) / 1000);
    set({ remainingTime: elapsed });
  },

  getFormattedTime: () => {
    return get().getElapsedTime();
  },

  nextQuestion: () => {
    const { currentQuestion, totalQuestions } = get();
    if (currentQuestion < totalQuestions) {
      set({ currentQuestion: currentQuestion + 1 });
    }
  },

  prevQuestion: () => {
    const { currentQuestion } = get();
    if (currentQuestion > 1) {
      set({ currentQuestion: currentQuestion - 1 });
    }
  },

  goToQuestion: (index) => {
    const { totalQuestions } = get();
    if (index >= 1 && index <= totalQuestions) {
      set({ currentQuestion: index });
    }
  },

  finishExam: async () => {
    get().reset();
    window.location.href = "/StudentDashboard";
  },

  downloadAnswersPDF: async () => {
    const { questionName, totalQuestions, answers } = get();

    // Generate HTML content from answers
    const container = document.createElement("div");
    container.style.padding = "20px";
    container.style.fontFamily = "Arial, sans-serif";
    container.classList.add("ql-snow"); // Parent quill class

    // Create a style element for the injected css (to force numbering/bullets if html2pdf misses remote css)
    const style = document.createElement("style");
    style.innerHTML = `
      .ql-editor { padding: 0; }
      .ql-editor h1 { font-size: 2em; margin-bottom: 0.5em; }
      .ql-editor h2 { font-size: 1.5em; margin-bottom: 0.5em; }
      .ql-editor p { margin-bottom: 0.5em; }
      .ql-editor ul, .ql-editor ol { padding-left: 1.5em; margin-bottom: 0.5em; }
      .ql-editor li { margin-bottom: 0.2em; }
      .ql-editor ol > li { list-style-type: decimal; }
      .ql-editor ul > li { list-style-type: disc; }
      .ql-editor pre.ql-syntax { background-color: #23241f; color: #f8f8f2; padding: 5px 10px; border-radius: 3px; }
      .ql-editor blockquote { border-left: 4px solid #ccc; padding-left: 16px; font-style: italic; }
      .ql-editor .ql-align-center { text-align: center; }
      .ql-editor .ql-align-right { text-align: right; }
      .ql-editor .ql-align-justify { text-align: justify; }
    `;
    container.appendChild(style);

    const title = document.createElement("h2");
    title.innerText = questionName || "Practice Exam Answers";
    title.style.textAlign = "center";
    title.style.marginBottom = "20px";
    container.appendChild(title);

    // Add answers sorted by question number
    const numQuestions = totalQuestions || 1;
    for (let i = 1; i <= numQuestions; i++) {
      const answerHTML = answers[`q${i}`];
      if (answerHTML && answerHTML.trim() !== "" && answerHTML !== "<p><br></p>") {
        const qTitle = document.createElement("h3");
        qTitle.innerText = `Question ${i}`;
        qTitle.style.marginTop = "20px";
        qTitle.style.borderBottom = "1px solid #ccc";
        qTitle.style.paddingBottom = "5px";
        container.appendChild(qTitle);

        const qContent = document.createElement("div");
        qContent.className = "ql-editor"; // Apply Quill editor styles
        qContent.innerHTML = answerHTML;
        qContent.style.marginTop = "10px";
        container.appendChild(qContent);
      }
    }

    // Only generate PDF if there are answers
    if (container.children.length > 1) {
      try {
        const html2pdf = (await import("html2pdf.js")).default;
        const opt = {
          margin: 10,
          filename: `${questionName ? questionName.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'practice'}_answers_${Date.now()}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        await html2pdf().set(opt).from(container).save();
      } catch (error) {
        console.error("Failed to generate PDF", error);
      }
    }
  },

  TimesUp: async () => {
    // No-op for practice
  },

  reset: () => {
    set({
      currentQuestion: 1,
      answers: {},
      workbookStates: {},
      startTime: null,
    });
  },

  // Timer helper (optional, can depend on component)
  getElapsedTime: () => {
    const start = get().startTime;
    if (!start) return "00:00";
    const diff = Math.floor((Date.now() - start) / 1000);
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  },
}));

export default usePracticeStore;
