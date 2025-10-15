// Sidebar.jsx
import { usePathname } from 'next/navigation';
import { BookOpen, ClipboardList, Award, Home, Menu, X, LogOut } from 'lucide-react';
import Link from 'next/link';
import useSubjectStore from '../StudentDashboard/components/StatesManagement';

export default function Sidebar({ isOpen, toggleSidebar }) {
  const pathname = usePathname(); // Get current route
  const BASEURL = process.env.NEXT_PUBLIC_BASEURL || 'http://localhost:5000';
  const { userInfo } = useSubjectStore((state) => state);
  const sidebarItems = [
    { name: 'Dashboard', icon: Home, href: '/StudentDashboard' },
    { name: 'My Subjects', icon: BookOpen, href: '/StudentDashboard/MySubjects' },
    { name: 'Results', icon: Award, href: '/StudentDashboard/Results' }
  ];


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
      localStorage.clear();

      // ✅ 3. Redirect after successful logout
      window.location.href = '/Login'; // or '/login' — make sure path matches your route

    } catch (error) {
      console.error("Logout error:", error);
      // Optional: Show user a message
      alert("Logout failed. Please try again.");
    }
  };

  return (
    <aside 
      className={`${
        isOpen ? 'w-64' : 'w-16'
      } bg-white shadow-lg transition-all duration-300 ease-in-out h-[100vh] flex flex-col`}
    >
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        {isOpen && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">A</div>
            <div>
              <div className="text-sm font-semibold">Academic Vitality</div>
              <div className="text-xs text-gray-500">Student Portal</div>
            </div>
          </div>
        )}
        <button 
          onClick={toggleSidebar}
          className="p-2 rounded-md hover:bg-gray-100 transition-colors"
        >
          {isOpen ? (
            <X className="w-5 h-5 text-gray-500" />
          ) : (
            <Menu className="w-5 h-5 text-gray-500" />
          )}
        </button>
      </div>

      <div className="p-4 flex-1">
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold mr-3">
            {userInfo?.userName?.split(' ').map(word => word[0]).join('')}
          </div>
          {isOpen && (
            <div>
              <div className="font-medium">{userInfo?.userName}</div>
              <div className="text-xs text-gray-500">{userInfo?.email}</div>
            </div>
          )}
        </div>

        <nav className="space-y-2">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                {isOpen && <span className="ml-3">{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Logout Button at the bottom */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className={`flex items-center w-full px-3 py-2 rounded-lg transition-colors text-gray-700 hover:bg-gray-100`}
        >
          <LogOut className="w-5 h-5 text-gray-500" />
          {isOpen && <span className="ml-3">Logout</span>}
        </button>
      </div>
    </aside>
  );
}