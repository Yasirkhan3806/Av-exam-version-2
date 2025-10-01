import React from 'react';
import useExamStore from './ExamPage/[examId]/StateManagement';

function Logout() {
  const BASEURL = useExamStore((state) => state.BASEURL);

  const handleLogout = async () => {
    try {
      // ✅ 1. Call backend to destroy session
      const response = await fetch(`${BASEURL}/auth/logout`, {
        method: "POST",
        credentials: "include", // 👈 Sends cookies (including connect.sid)
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Logout failed: ${response.statusText}`);
      }

      // ✅ 2. Optional: Clear any client-side auth tokens (if you use them)
      localStorage.removeItem('authToken');

      // ✅ 3. Redirect after successful logout
      window.location.href = '/Login'; // or '/login' — make sure path matches your route

    } catch (error) {
      console.error("Logout error:", error);
      // Optional: Show user a message
      alert("Logout failed. Please try again.");
    }
  };

  return (
    <button
      onClick={handleLogout}
      style={{
        padding: '8px 16px',
        background: '#dc3545',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
      }}
    >
      Logout
    </button>
  );
}

export default Logout;