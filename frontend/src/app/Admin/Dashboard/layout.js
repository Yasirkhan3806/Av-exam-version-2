import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import * as jose from "jose";
import Link from "next/link";

// Must come from env — no hardcoded fallback. Must match backend/.env's
// JWT_SECRET exactly (this is a server component, so a non-NEXT_PUBLIC_ var
// is fine here — it never reaches the client bundle).
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not set. Add it to frontend/.env.local.");
}
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export default async function AdminDashboardLayout({ children }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    redirect("/Admin"); // redirect to login if missing
  }

  // Previously this only checked that *some* cookie named "token" existed —
  // not that it was valid, or that it belonged to an admin. Student and
  // admin sessions share this same cookie name, so a logged-in student's
  // own valid token would pass that check too. Verify the signature and the
  // role claim explicitly.
  let payload;
  try {
    const result = await jose.jwtVerify(token, JWT_SECRET, { clockTolerance: 120 });
    payload = result.payload;
  } catch (e) {
    redirect("/Admin");
  }

  if (payload.role !== "admin") {
    redirect("/Admin");
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="px-6 py-4 text-2xl font-bold border-b border-gray-700">
          Admin Panel
        </div>
        <nav className="flex-1 px-4 py-6 space-y-3">
          <Link
            href="/Admin/Dashboard"
            className="block px-3 py-2 rounded-md hover:bg-gray-700"
          >
            Dashboard
          </Link>
          <Link
            href="/Admin/Dashboard/AddStudents"
            className="block px-3 py-2 rounded-md hover:bg-gray-700"
          >
            Add Student
          </Link>
          <Link
            href="/Admin/Dashboard/AddInstructor"
            className="block px-3 py-2 rounded-md hover:bg-gray-700"
          >
            Add Instructor
          </Link>
          <Link
            href="/Admin/Dashboard/Instructors"
            className="block px-3 py-2 rounded-md hover:bg-gray-700"
          >
            Instructors
          </Link>
          <Link
            href="/Admin/Dashboard/Students"
            className="block px-3 py-2 rounded-md hover:bg-gray-700"
          >
            Students
          </Link>
          <Link
            href="/Admin/Dashboard/Subjects"
            className="block px-3 py-2 rounded-md hover:bg-gray-700"
          >
            Subjects
          </Link>
          <Link
            href="/admin/settings"
            className="block px-3 py-2 rounded-md hover:bg-gray-700"
          >
            Settings
          </Link>
          <div className="pt-4 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            E-Library
          </div>
          <Link
            href="/Admin/Dashboard/ELibraryUsers"
            className="block px-3 py-2 rounded-md hover:bg-gray-700"
          >
            Registered Users
          </Link>
        </nav>
        {/* <div className="px-4 py-4 border-t border-gray-700">
          <button className="w-full px-3 py-2 bg-red-600 rounded-md hover:bg-red-500">
            Logout
          </button>
        </div> */}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Navbar */}
        <header className="h-16 bg-white shadow flex items-center justify-between px-6">
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">Admin</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
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
