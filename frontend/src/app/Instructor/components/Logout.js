"use client";
import React from 'react';
import { LogOut } from 'lucide-react';
import useInstructorStore from './StateManagement';
import { useRouter } from 'next/navigation';
export default function Logout() {
    const router = useRouter();
    const logout = useInstructorStore((state) => state.logout);
    const handleLogout = async () => {
        await logout();
        router.push('/Instructor/login');
    }
    return (
        <button 
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700
            cursor-pointer transition-colors"
            onClick={handleLogout}
        >
            <LogOut className="w-5 h-5 mr-2" />
            Logout
        </button>
    );
}