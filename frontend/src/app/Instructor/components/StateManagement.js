import create from 'zustand';
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

const fetchSubjects = async (set,instructorId) => {
try {
    const data = await fetchJSON(`${BASE_URL}/instructor/getAllSubjects/${instructorId}`);
    set({ subjects: data });
  } catch (error) {
    console.error('Failed to fetch subjects:', error);
    throw error;
  } 
}


const useInstructorStore = create(
    persist(
        (set) => ({
            // State
            examQuestions: [],
            currentQuestion: null,
            loading: false,
            error: null,
            subjects: [],

            // Actions
            setExamQuestions: (questions) => set({ examQuestions: questions }),
            setCurrentQuestion: (question) => set({ currentQuestion: question }),
            setLoading: (status) => set({ loading: status }),
            setError: (error) => set({ error: error }),

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