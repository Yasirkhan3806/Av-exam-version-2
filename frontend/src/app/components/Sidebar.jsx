// Sidebar.jsx
import { useState } from 'react';
import { BookOpen, ClipboardList, Award, Home, Menu, X } from 'lucide-react';

export default function Sidebar({ isOpen, toggleSidebar }) {
  const [activeItem, setActiveItem] = useState('Dashboard');

  const sidebarItems = [
    { name: 'Dashboard', icon: Home, href: '/StudentDashboard' },
    { name: 'My Subjects', icon: BookOpen },
    { name: 'Exams', icon: ClipboardList },
    { name: 'Results', icon: Award }
  ];

  return (
    <aside 
      className={`${
        isOpen ? 'w-64' : 'w-16'
      } bg-white shadow-lg transition-all duration-300 ease-in-out h-full`}
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

      <div className="p-4">
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold mr-3">
            J
          </div>
          {isOpen && (
            <div>
              <div className="font-medium">John Doe</div>
              <div className="text-xs text-gray-500">test@email.com</div>
            </div>
          )}
        </div>

        <nav className="space-y-2">
          {sidebarItems.map((item) => (
            <a
              key={item.name}
              href={item.href || '#'}
              onClick={(e) => {
                e.preventDefault();
                setActiveItem(item.name);
              }}
              className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                activeItem === item.name
                  ? 'bg-indigo-600 text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <item.icon className={`w-5 h-5 ${activeItem === item.name ? 'text-white' : 'text-gray-500'}`} />
              {isOpen && <span className="ml-3">{item.name}</span>}
            </a>
          ))}
        </nav>
      </div>
    </aside>
  );
}