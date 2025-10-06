// Navbar.jsx
import { Bell, HelpCircle } from 'lucide-react';

export default function Navbar({ isSidebarOpen, toggleSidebar }) {
  return (
    <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6">
      <div className="flex items-center">
        <h1 className="text-lg text-gray-800">Monday, October 6, 2025</h1>
      </div>

      <div className="flex items-center space-x-4">
        <button className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100">
          <HelpCircle className="w-5 h-5" />
        </button>
        
        <button className="relative p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            3
          </span>
        </button>
        
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-700 font-medium">
            JD
          </div>
          <span className="text-sm font-medium">John Doe</span>
        </div>
      </div>
    </header>
  );
}