"use client";

import { BASEURL } from "@/utils/config";
import { safeFetch } from "@/utils/safeFetch";
const AdminDashboardPage = ()=>{
    
    const logout = async () => {
    await safeFetch(`${BASEURL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    window.location.href = "/Admin";
  };
    return(
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <button 
          onClick={logout}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded shadow-lg transition duration-300"
        >
          Logout
        </button>
      </div>
    )
}

export default AdminDashboardPage;