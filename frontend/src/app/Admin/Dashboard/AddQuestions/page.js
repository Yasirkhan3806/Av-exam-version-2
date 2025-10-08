"use client";

import { useState } from "react";
import GetInstructor from "./getInstructor";

export default function AddQuestionsPage() {
    const [fileName, setFileName] = useState("");
    const [description, setDescription] = useState("");
    const [totalAttempt, setTotalAttempt] = useState("");
    const [numQuestions, setNumQuestions] = useState(""); // New state
    const [pdfFile, setPdfFile] = useState(null);
    const [log, setLog] = useState("");
    const BASEURL = process.env.NEXT_PUBLIC_BASEURL || 'http://localhost:5000';
    const [instructors, setInstructors] = useState([]);

    const handleFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (file && file.type === "application/pdf") {
            setPdfFile(file);
            setLog(`✅ Selected PDF: ${file.name}`);
        } else {
            setLog("⚠️ Please select a valid PDF file.");
        }
    };

    const handleSaveToDB = async () => {
        if (!fileName || !description || !totalAttempt || !numQuestions || !pdfFile) {
            setLog("⚠️ Please provide all fields and upload a PDF first.");
            return;
        }

        try {
            const formData = new FormData();
            formData.append("name", fileName);
            formData.append("description", description);
            formData.append("totalAttempt", totalAttempt);
            formData.append("numQuestions", numQuestions); // Send to DB
            formData.append("pdf", pdfFile);
            formData.append("instructors", JSON.stringify(instructors));

            setLog("⏳ Uploading and saving to database...");

            const res = await fetch(`${BASEURL}/questions/addQuestions`, {
                method: "POST",
                body: formData,
                credentials: "include",
            });

            const result = await res.json();
            if (res.ok) {
                setLog(`✅ Data saved successfully with ID: ${result.id}`);
            } else {
                setLog(`❌ Failed to save: ${result.error}`);
            }
        } catch (err) {
            setLog(`❌ Error: ${err.message}`);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
            <div className="w-full max-w-lg bg-blue-50 p-8 rounded-2xl shadow-lg">
                <h1 className="text-2xl font-bold text-blue-700 mb-6 text-center">
                    PDF Uploader
                </h1>

                {/* Input for dataset name */}
                <input
                    type="text"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="Enter dataset name"
                    className="w-full text-black p-3 border border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                />

                {/* Input for description */}
                <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter description of questions"
                    className="w-full text-black p-3 border border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                />

                {/* Input for total to attempt */}
                <input
                    type="number"
                    value={totalAttempt}
                    onChange={(e) => setTotalAttempt(e.target.value)}
                    placeholder="Total to attempt"
                    className="w-full text-black p-3 border border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                />

                {/* Input for number of questions */}
                <input
                    type="number"
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(e.target.value)}
                    placeholder="Number of questions"
                    className="w-full text-black p-3 border border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                />

                {/* File input */}
                <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileUpload}
                    className="w-full text-blue-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-white file:bg-blue-600 hover:file:bg-blue-700 cursor-pointer mb-4"
                />
                {/* Instructor Selector */}
                <GetInstructor SelectInstructors={setInstructors} />

                {/* Logs */}
                {log && (
                    <div className="p-3 bg-white border border-blue-200 rounded-xl text-blue-700">
                        <strong>Logs:</strong> {log}
                    </div>
                )}

                <button
                    onClick={handleSaveToDB}
                    className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-xl hover:bg-blue-700"
                >
                    Save to Database
                </button>
            </div>
        </div>
    );
}
