import { create } from 'zustand';
import { persist } from 'zustand/middleware';


const BASE_URL = process.env.NEXT_PUBLIC_BASEURL || 'http://localhost:5000';

// === Centralized Fetch Helper ===
async function fetchJSON(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}
// === Async helper functions ===
async function fetchUserInfo(set) {
  try {
    const data = await fetchJSON(`${BASE_URL}/instructors/verifyInstructorSession`);
    console.log('Fetched Instructor info:', data);
    set({ instructorId: data.instructor.userId, instructorInfo: data.instructor });
    return data.instructor;
  } catch (error) {
    console.error('Failed to fetch instructor info:', error);
    set({ error: error.message });
    return null;
  }
}

const fetchSubjects = async (set,get) => {
  try {
    const instructorId = await get().instructorId || (await fetchUserInfo(set)).userId;
    const data = await fetchJSON(`${BASE_URL}/instructors/getAllSubjects/${instructorId}`);
    set({ subjects: data.subjects });
  } catch (error) {
    console.error('Failed to fetch subjects:', error);
    throw error;
  }
}


const useInstructorStore = create(
  persist(
    (set,get) => ({
      // State
      examQuestions: [],
      currentQuestion: null,
      loading: false,
      error: null,
      subjects: [],
      instructorId: null,
      instructorInfo: null,

      // Actions
      setExamQuestions: (questions) => set({ examQuestions: questions }),
      setCurrentQuestion: (question) => set({ currentQuestion: question }),
      setLoading: (status) => set({ loading: status }),
      setError: (error) => set({ error: error }),
      fetchSubjects: () => fetchSubjects(set,get),
      fetchUserInfo: () => fetchUserInfo(set),

      // Reset store
      reset: () => set({
        examQuestions: [],
        currentQuestion: null,
        loading: false,
        error: null
      })
    }),
    {
      name: 'instructor-storage', // unique name for localStorage key
      getStorage: () => localStorage, // (optional) by default, 'localStorage' is used
    }
  )
);

export default useInstructorStore;