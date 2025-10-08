"use client";
import React, { useState } from "react";


export default function AddStudents() {
    const [form, setForm] = useState({
        name: "",
        userName: "",
        email: "",
        password: "",
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const BASEURL = process.env.NEXT_PUBLIC_BASEURL || 'http://localhost:5000';

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");
        try {
            const res = await fetch(`${BASEURL}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            console.log(data);
            if (res.ok) {
                setMessage(data.message || "Registration successful!");
            } else {
                setMessage(data.error || "Registration failed.");

            }

            setForm({
                name: "",
                userName: "",
                email: "",
                password: "",
            });
        } catch (error) {
            setMessage("Network error. Please try again.");
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center ">
            <form
                onSubmit={handleSubmit}
                className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md"
            >
                <h2 className="text-blue-700 mb-6 text-center text-2xl font-bold">
                    Student Registration
                </h2>
                {message && (
                    <div className="mb-4 text-center text-red-600 font-semibold">
                        {message}
                    </div>
                )}
                <div className="mb-4">
                    <label className="text-blue-700 font-semibold block mb-2">Name</label>
                    <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                        disabled={loading}
                    />
                </div>
                <div className="mb-4">
                    <label className="text-blue-700 font-semibold block mb-2">Username (must be unique)</label>
                    <input
                        type="text"
                        name="userName"
                        value={form.userName}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                        disabled={loading}
                    />
                </div>
                <div className="mb-4">
                    <label className="text-blue-700 font-semibold block mb-2">Email (must be unique)</label>
                    <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                        disabled={loading}
                    />
                </div>
                <div className="mb-6">
                    <label className="text-blue-700 font-semibold block mb-2">Password</label>
                    <input
                        type="password"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                        disabled={loading}
                    />
                </div>
                <button
                    type="submit"
                    className="w-full py-3 bg-blue-600 text-white rounded-md font-bold text-lg hover:bg-blue-700 transition"
                    disabled={loading}
                >
                    {loading ? "Registering..." : "Register"}
                </button>
            </form>
        </div>
    );
}
