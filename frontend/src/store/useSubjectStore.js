import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { safeFetch } from '../utils/safeFetch';
import { BASEURL as BASE_URL } from "@/utils/config";


// === Centralized Fetch Helper ===
async function fetchJSON(url, options = {}) {
  const res = await safeFetch(url, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
  }, 15000);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

// === Async helper functions ===
async function fetchUserInfo(set) {
  try {
    const data = await fetchJSON(`${BASE_URL}/auth/verifySession`);
    set({ userId: data.user.userId, userInfo: data.user });
    return data.user;
  } catch (error) {
    console.error('Failed to fetch user info:', error);
    set({ error: error.message });
    return null;
  }
}

async function fetchSubjects(set, get) {
  set({ loading: true, error: null });
  try {
    const userId = await get().userId || (await fetchUserInfo(set))._id;
    if (!userId) throw new Error('User ID not available');

    const data = await fetchJSON(`${BASE_URL}/subjects/getEnrolledSubjects/${userId}`);
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500',
      'bg-yellow-500', 'bg-pink-500', 'bg-orange-500', 'bg-teal-500'
    ];

    const colored = data.map(s => ({
      ...s,
      color: colors[Math.floor(Math.random() * colors.length)]
    }));

    set({ subjects: colored, loading: false });
  } catch (error) {
    set({ error: error.message, loading: false });
  }
}

// === Fetch exams for a subject (with caching & cache-bypass support) ===
async function fetchExamsForSubject(set, get, subjectId, subjectType, force = false) {
  if (!subjectId) return console.error('fetchExamsForSubject called without subjectId');

  // Check if cache exists and we are not forcing a refresh
  const existing = get().examsBySubject?.[subjectId];
  if (existing && !force) {
    return existing;
  }

  set({ loading: true, error: null });
  try {
    // If subjectType is undefined, warn about the fallback, but proceed to fetch
    if (!subjectType) {
      console.warn(`fetchExamsForSubject: subjectType is undefined for subject ${subjectId}. Backend might fallback to standard Questions.`);
    }

    const data = await fetchJSON(`${BASE_URL}/subjects/getExamsForSubject/${subjectType}/${subjectId}`);
    set((state) => ({
      examsBySubject: { ...state.examsBySubject, [subjectId]: data },
      loading: false,
    }));
    return data;
  } catch (error) {
    console.error(`Failed to fetch exams for ${subjectId}:`, error);
    set({ error: error.message, loading: false });
    return [];
  }
}


async function fetchStudentResults(set, get) {
  set({ loading: true, error: null });
  try {
    const userId = await get().userId || (await fetchUserInfo(set))._id;
    if (!userId) throw new Error('User ID not available');

    const data = await fetchJSON(`${BASE_URL}/subjects/getResults/${userId}`);
    set({ studentResults: data, loading: false });
    return data;
  } catch (error) {
    console.error('Failed to fetch results:', error);
    set({ error: error.message, loading: false });
    return [];
  }
}

async function fetchStudentAnswers(set, get, examId) {
  set({ loading: true, error: null });
  try {
    const userId = await get().userId || (await fetchUserInfo(set))._id;
    if (!userId) throw new Error('User ID not available');


    const data = await fetchJSON(`${BASE_URL}/subjects/getStudentAnswers/${userId}/${examId}`);
    return data.answers;
  } catch (error) {
    console.error('Failed to fetch student answers:', error);
    set({ error: error.message, loading: false });
    return null;
  } finally {
    set({ loading: false });
  }
}

async function fetchStudentGrade(set, get, subjectId) {
  set({ loading: true, error: null });
  try {
    const userId = await get().userId || (await fetchUserInfo(set))._id;
    if (!userId) throw new Error('User ID not available');

    const data = await fetchJSON(`${BASE_URL}/subjects/grade/${userId}/${subjectId}`);
    set({ studentGrades: { [subjectId]: data }, overallPercentage: [data.percentage,...get().overallPercentage], loading: false });
    return data;
  } catch (error) {
    // console.error('Failed to fetch grade:', error);
    // set({ error: error.message, loading: false });
    return null;
  } finally {
    set({ loading: false });
  }
}

// === Zustand Store ===
const useSubjectStore = create(
  persist(
    (set, get) => ({
      subjects: [],
      currentSubject: null,
      userId: null,
      loading: false,
      error: null,
      examsBySubject: {}, // ← store exams by subject ID
      userInfo: null,
      studentResults: [],
      overallProgress: [],
      studentGrades: null,
      overallPercentage: [],
      currentSubjectType: null,

      // === State actions ===
      setSubjects: (subjects) => set({ subjects }),
      setCurrentSubject: (subject) => {
        set({ currentSubject: subject })
      },
      setCurrentSubjectType: (type) => {
        set({ currentSubjectType: type })
      },  
      clearSubjects: () => set({ subjects: [], currentSubject: null }),
      addSubject: (subject) => set((state) => ({ subjects: [...state.subjects, subject] })),
      removeSubject: (subjectId) =>
        set((state) => ({
          subjects: state.subjects.filter((s) => s.id !== subjectId),
        })),

      // === Async actions ===
      fetchUserInfo: () => fetchUserInfo(set),
      fetchSubjects: () => fetchSubjects(set, get),
      fetchExamsForSubject: (subjectId, subjectType, force = false) => fetchExamsForSubject(set, get, subjectId, subjectType, force),
      fetchStudentResults: () => fetchStudentResults(set, get),
      fetchStudentAnswers: (examId) => fetchStudentAnswers(set, get, examId),
      updateOverallProgress: (progress) => set({ overallProgress: [progress, ...get().overallProgress] }),
      fetchStudentGrade: (subjectId) => fetchStudentGrade(set, get, subjectId),
      clearSubjectCache: (subjectId = null) => {

        // If no subjectId provided, try to get from currentSubject
        if (!subjectId) {
          const { currentSubject } = get();

          if (!currentSubject) {
            console.warn('❌ No subject ID provided and no currentSubject set');
            return;
          }

          // Handle both object and direct ID cases
          subjectId = typeof currentSubject === 'object' ? currentSubject.id : currentSubject;
        }

        if (!subjectId) {
          console.warn('❌ Could not determine subject ID');
          return;
        }

        set((state) => {
          const updatedExams = { ...state.examsBySubject };
          delete updatedExams[subjectId];
          return { examsBySubject: updatedExams };
        });

        // Force persist update in localStorage
        try {
          const persisted = JSON.parse(localStorage.getItem('subject-storage'));
          if (persisted?.state?.examsBySubject) {
            delete persisted.state.examsBySubject[subjectId];
            localStorage.setItem('subject-storage', JSON.stringify(persisted));
          }
        } catch (err) {
          console.warn('❌ Failed to update localStorage:', err);
        }
      },
      clearAllSubjectCache: () => {
        set({ examsBySubject: {} });
        try {
          const persisted = JSON.parse(localStorage.getItem('subject-storage'));
          if (persisted?.state) {
            persisted.state.examsBySubject = {};
            localStorage.setItem('subject-storage', JSON.stringify(persisted));
          }
        } catch (err) {
          console.warn('❌ Failed to clear exams cache in localStorage:', err);
        }
      },
    }),
    {
      name: 'subject-storage',
      getStorage: () => localStorage,
      partialize: (state) => ({
        subjects: state.subjects,
        userId: state.userId,
        examsBySubject: state.examsBySubject,
        currentSubject: state.currentSubject,
        userInfo: state.userInfo,
        currentSubjectType: state.currentSubjectType,
      }),
    }
  )
);

export default useSubjectStore;
