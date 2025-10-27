"use client";

const AdminDashboardPage = ()=>{
  const BASEURL = process.env.NEXT_PUBLIC_BASEURL || 'http://localhost:5000'; // Adjust as needed
    
    const logout = async () => {
    await fetch(`${BASEURL}/auth/logout`, {
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