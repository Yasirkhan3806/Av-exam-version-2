// components/LayoutWrapper.jsx (Client Component with state)
'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function LayoutWrapper({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className={`flex-1 ml-${isSidebarOpen ? '64' : '16'} transition-all duration-300`}>
        <Navbar isSidebarOpen={isSidebarOpen} />
        
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}