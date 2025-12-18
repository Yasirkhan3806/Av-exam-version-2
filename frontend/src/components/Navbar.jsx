"use client";
import React from "react";
import { Bell, HelpCircle } from "lucide-react";
import useSubjectStore from "../store/useSubjectStore";

export default function Navbar({ isSidebarOpen, toggleSidebar }) {
  const { userInfo } = useSubjectStore((state) => state);

  return (
    <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6 sticky top-0 left-0 right-0 z-10">
      <div className="flex items-center">
        <h1 className="text-gray-800 text-sm md:text-normal lg:text-normal font-semibold">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </h1>
      </div>

      <div className="flex items-center space-x-4">
        {/* <button className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100">
          <HelpCircle className="w-5 h-5" />
        </button>
        
        <button className="relative p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            3
          </span>
        </button> */}

        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-700 font-medium">
            {userInfo?.userName
              ?.split(" ")
              .map((word) => word[0])
              .join("")}
          </div>
          <span className="text-sm font-medium">{userInfo?.userName}</span>
        </div>
      </div>
    </header>
  );
}
