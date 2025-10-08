import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminDashboardLayout({ children }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token");

  if (!token) {
    redirect("/Admin"); // redirect to login if missing
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="px-6 py-4 text-2xl font-bold border-b border-gray-700">
          Admin Panel
        </div>
        <nav className="flex-1 px-4 py-6 space-y-3">
          <Link href="/admin/dashboard" className="block px-3 py-2 rounded-md hover:bg-gray-700">
            Dashboard
          </Link>
          <Link href="/Admin/Dashboard/AddQuestions" className="block px-3 py-2 rounded-md hover:bg-gray-700">
            Add Questions
          </Link>
          <Link href="/Admin/Dashboard/AddStudents" className="block px-3 py-2 rounded-md hover:bg-gray-700">
            Add Student
          </Link>
           <Link href="/Admin/Dashboard/AddInstructor" className="block px-3 py-2 rounded-md hover:bg-gray-700">
            Add Instructor
          </Link>
          <Link href="/Admin/Dashboard/Subjects" className="block px-3 py-2 rounded-md hover:bg-gray-700">
            Subjects
          </Link>
          <Link href="/admin/settings" className="block px-3 py-2 rounded-md hover:bg-gray-700">
            Settings
          </Link>
        </nav>
        <div className="px-4 py-4 border-t border-gray-700">
          <button className="w-full px-3 py-2 bg-red-600 rounded-md hover:bg-red-500">
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Navbar */}
        <header className="h-16 bg-white shadow flex items-center justify-between px-6">
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">Admin</span>
            <img
              src="https://ui-avatars.com/api/?name=Admin"
              alt="Admin Avatar"
              className="w-10 h-10 rounded-full"
            />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
