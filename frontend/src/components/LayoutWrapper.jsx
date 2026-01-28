"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function LayoutWrapper({ children }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Check if we are in the Practice Room to provide a full-screen experience without sidebar/navbar
  const isPracticeRoom = pathname === "/StudentDashboard/PracticeRoom";

  if (isPracticeRoom) {
    return (
      <div className="h-screen w-screen overflow-hidden">
        <main className="h-full w-full">{children}</main>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar takes space */}
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Main section fills remaining space */}
      <div className="flex-1 flex flex-col bg-gray-50">
        <Navbar isSidebarOpen={isSidebarOpen} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
