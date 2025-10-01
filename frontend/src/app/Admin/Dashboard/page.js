"use client";

const AdminDashboardPage = ()=>{
    
    const logout = async () => {
    await fetch("http://localhost:5000/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    window.location.href = "/Admin";
  };
    return(
        <>
        <button onClick={logout}>
            Logout
        </button>
        </>
    )
}

export default AdminDashboardPage;