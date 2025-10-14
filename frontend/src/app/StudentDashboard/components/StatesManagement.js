import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const BASE_URL = process.env.NEXT_PUBLIC_BASEURL || 'http://localhost:5000';

// ✅ Centralized API helper
async function fetchJSON(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

// === Async functions defined outside ===
async function fetchUserInfo(set) {
  try {
    const data = await fetchJSON(`${BASE_URL}/auth/verifySession`);
    console.log('Fetched user info:', data);
    set({ userId: data.user.userId });
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
    const userId = get().userId || (await fetchUserInfo(set));
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

async function fetchExamsForSubject(set, subjectId) {
  set({ loading: true, error: null });
  try {
    console.log('Fetching exams for subjectId:', subjectId);
    const data = await fetchJSON(`${BASE_URL}/subjects/getExamsForSubject/${subjectId}`);
    set({ exams: data, loading: false });
  } catch (error) {
    set({ error: error.message, loading: false });
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
      exams: [],

      // === State actions ===
      setSubjects: (subjects) => set({ subjects }),
      setCurrentSubject: (subject) => set({ currentSubject: subject }),
      clearSubjects: () => set({ subjects: [], currentSubject: null }),
      addSubject: (subject) => set((state) => ({ subjects: [...state.subjects, subject] })),
      removeSubject: (subjectId) =>
        set((state) => ({
          subjects: state.subjects.filter((s) => s.id !== subjectId),
        })),

      // === Async actions ===
      fetchUserInfo: () => fetchUserInfo(set),
      fetchSubjects: () => fetchSubjects(set, get),
      fetchExamsForSubject: (subjectId) => fetchExamsForSubject(set, subjectId),
    }),
    {
      name: 'subject-storage',
      getStorage: () => localStorage,
    }
  )
);

export default useSubjectStore;
