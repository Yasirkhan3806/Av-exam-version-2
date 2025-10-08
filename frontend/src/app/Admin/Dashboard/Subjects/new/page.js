"use client";

import React, { useState,useContext, useEffect } from 'react';
import { BaseUrlContext } from '../../../../BASEURLContext';
import fetchInstructors from './fetchInstructorFunc'

/**
 * AddSubject
 * Simple boilerplate form to create a new subject in Admin Dashboard.
 * - Controlled inputs
 * - Basic client-side validation
 * - Calls onSubmit(formData) if provided, otherwise POSTs to /api/subjects (placeholder)
 */

export default function AddSubject() {
    const BASEURL = useContext(BaseUrlContext);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        instructor: '',
        courses: []
    });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [courseInput, setCourseInput] = useState('');
    const [instructors, setInstructors] = useState([]); // New state for instructors

    useEffect(() => {
        console.log(BASEURL);
        fetchInstructors(BASEURL)
            .then((data) => {
                setInstructors(data.instructors);
            })
            .catch((error) => {
                setErrors((prev) => ({ ...prev, fetch: "Error fetching instructors: " + error.message }));
            });
    }, [BASEURL]);

    function validate(values) {
        const e = {};
        if (!values.name.trim()) e.name = 'Name is required';
        return e;
    }

    function handleChange(e) {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: undefined }));
    }

    const handleCourseInputChange = (e) => {
        setCourseInput(e.target.value);
    };

    const handleAddCourse = (e) => {
        if (e.key === 'Enter' && courseInput.trim() !== '') {
            e.preventDefault();
            setFormData(prev => ({
                ...prev,
                courses: [...prev.courses, courseInput.trim()]
            }));
            setCourseInput('');
        }
    };

    const handleRemoveCourse = (index) => {
        setFormData(prev => ({
            ...prev,
            courses: prev.courses.filter((_, i) => i !== index)
        }));
    };

    async function handleSubmit(e) {
        e.preventDefault();
        setMessage('');
        const validation = validate(formData);
        setErrors(validation);
        if (Object.keys(validation).length) return;

        setSubmitting(true);
        try {
            // default placeholder API call
            const res = await fetch(`${BASEURL}/Subjects/AddSubject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (!res.ok) throw new Error(`Request failed: ${res.status}`);
            // setTimeout(() => {}, 1000); // simulate network delay
            setMessage('Subject added successfully. with data ' + JSON.stringify(formData));

            setFormData({
                name: '',
                description: '',
                instructor: '',
                courses: []
            });
            setCourseInput('');
        } catch (err) {
            setMessage(err.message || 'Failed to add subject.');
        } finally {
            setSubmitting(false);
        }
    }

    function handleReset() {
        setFormData({
            name: '',
            description: '',
            instructor: '',
            courses: []
        });
        setErrors({});
        setMessage('');
        setCourseInput('');
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100">
            <form onSubmit={handleSubmit} aria-label="Add Subject Form" className="w-full max-w-2xl mx-4">
                <h3 className="text-xl font-semibold mb-4">Add Subject</h3>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name
                    </label>
                    <input
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-invalid={!!errors.name}
                    />
                    {errors.name && <div className="text-red-600 text-sm mt-1">{errors.name}</div>}
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                    </label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows="3"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Instructor
                    </label>
                    <select
                        name="instructor"
                        value={formData.instructor}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Select Instructor</option>
                        {instructors.map((inst) => (
                            <option key={inst._id} value={inst._id}>
                                {inst.name} ({inst.userName})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mb-4 space-y-2">
                    <label htmlFor="courses" className="block text-sm font-medium text-gray-700">
                        Category
                    </label>
                    <div className="border border-gray-300 rounded-lg p-3">
                        <input
                            type="text"
                            id="courses"
                            value={courseInput}
                            onChange={handleCourseInputChange}
                            onKeyDown={handleAddCourse}
                            className="w-full px-3 py-2 border-none outline-none text-gray-800 placeholder-gray-400"
                            placeholder="Type course name and press Enter to add"
                        />

                        {formData.courses.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {formData.courses.map((course, index) => (
                                    <span
                                        key={index}
                                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                                    >
                                        {course}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveCourse(index)}
                                            className="ml-2 text-blue-600 hover:text-blue-800 focus:outline-none"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                    <p className="text-xs text-gray-500">Press Enter after typing each course name to add it</p>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        {submitting ? 'Saving...' : 'Save'}
                    </button>
                    <button
                        type="button"
                        onClick={handleReset}
                        disabled={submitting}
                        className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                        Reset
                    </button>
                </div>

                {message && <div className="mt-4 p-3 rounded-md bg-blue-50 text-blue-800 text-sm">{message}</div>}
            </form>
        </div>
    );
}