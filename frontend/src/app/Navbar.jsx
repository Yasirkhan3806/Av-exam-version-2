"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from 'next/navigation';
import Logout from "./Logout";


export default function ExamNavbar() {
    const pathname = usePathname();

    const navLinks = [
        { href: "https://academicvitality.com/", label: "Home" },
        { href: "/about", label: "About" },
        { href: "/AllCourses", label: "All Courses" },
        { href: "/#contact", label: "Contact Us" },
        { href: "/", label: "Exam" },
    ];



    return (
        <>
            <main className="min-w-full bg-white px-6 py-4 text-[#002B64] flex justify-between items-center">
                <div className="flex justify-between items-center">
                    <span>
                        <Image width={75} height={75} src='/logo.svg' alt="" />
                    </span>
                </div>
                <div className="flex gap-8">
                    <ul className="flex justify-evenly gap-5 font-semibold " >

                        {navLinks.map((link) => (
                            <li key={link.href} className="">
                                <Link
                                    href={link.href}
                                    className={`nav-list-style relative group `}
                                >
                                    {link.label}
                                    <span className={`absolute bottom-0 left-0 h-0.5 bg-blue-900 transition-all duration-300 ${pathname === link.href ? 'w-full' : 'w-0 group-hover:w-full'
                                        }`}></span>
                                </Link>
                            </li>
                        ))}
                        <li>
                            <Logout />
                        </li>
                    </ul>
                </div>
                <div className="flex justify-evenly items-center gap-8 h-7">
                    {/* <span className="flex gap-6">
                        <Image width={25} height={25} src='/icons/search-black.png' alt=""></Image>
                        <Image width={25} height={25} src='/icons/cart-black.png' alt=""></Image>
                    </span>
                    <span>
                        <button className="bg-blue-950 py-2 px-7 text-sm font-semibold text-white rounded-md">Login</button>
                    </span> */}
                </div>
            </main>
        </>
    );
}