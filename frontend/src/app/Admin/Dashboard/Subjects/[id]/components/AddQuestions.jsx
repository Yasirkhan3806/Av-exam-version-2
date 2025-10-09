"use client";

import { useState } from "react";

export default function AddQuestionsPopup({ isOpen, onClose, subjectId }) {
    const [fileName, setFileName] = useState("");
    const [description, setDescription] = useState("");
    const [totalAttempt, setTotalAttempt] = useState("");
    const [numQuestions, setNumQuestions] = useState("");
    const [pdfFile, setPdfFile] = useState(null);
    const [log, setLog] = useState("");
    const BASEURL = process.env.NEXT_PUBLIC_BASEURL || 'http://localhost:5000';

    // Reset form when popup closes
    const handleClose = () => {
        setFileName("");
        setDescription("");
        setTotalAttempt("");
        setNumQuestions("");
        setPdfFile(null);
        setLog("");
        onClose();
    };

    const handleFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (file && file.type === "application/pdf") {
            console.log('Selected file:', file);
            setPdfFile(file);
            setLog(`✅ Selected PDF: ${file.name}`);
        } else {
            setLog("⚠️ Please select a valid PDF file.");
        }
    };

    const handleSaveToDB = async () => {
        console.log('Saving to DB with:', { fileName, description, totalAttempt, numQuestions, pdfFile, subjectId });
        if (!fileName || !totalAttempt || !numQuestions || !pdfFile || !subjectId) {
            setLog("⚠️ Please provide all fields and upload a PDF first.");
            return;
        }

        try {
            const formData = new FormData();
            formData.append("name", fileName);
            formData.append("description", description);
            formData.append("totalAttempt", totalAttempt);
            formData.append("numQuestions", numQuestions);
            formData.append("pdf", pdfFile);
            formData.append("subjectId", subjectId);

            setLog("⏳ Uploading and saving to database...");

            const res = await fetch(`${BASEURL}/questions/addQuestions`, {
                method: "POST",
                body: formData,
                credentials: "include",
            });

            const result = await res.json();
            if (res.ok) {
                setLog(`✅ Data saved successfully with ID: ${result.id}`);
                // Optionally close the popup after successful save
                setTimeout(() => {
                    handleClose();
                }, 1500);
            } else {
                setLog(`❌ Failed to save: ${result.error}`);
            }
        } catch (err) {
            setLog(`❌ Error: ${err.message}`);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-blue-700">
                            Add Questions
                        </h2>
                        <button
                            onClick={handleClose}
                            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                        >
                            &times;
                        </button>
                    </div>

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

                    {/* Logs */}
                    {log && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 mb-4">
                            <strong>Logs:</strong> {log}
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={handleSaveToDB}
                            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-xl hover:bg-blue-700 transition-colors"
                        >
                            Save
                        </button>
                        <button
                            onClick={handleClose}
                            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-xl hover:bg-gray-400 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}