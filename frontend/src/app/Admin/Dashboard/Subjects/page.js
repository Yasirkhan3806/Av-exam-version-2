import React from 'react';

async function getSubjects(BASEURL) {
    const res = await fetch(`${BASEURL}/subjects/getAllSubjects`, { cache: 'no-store' });
    if (!res.ok) {
        throw new Error('Failed to fetch subjects');
    }
    return res.json();
}

export default async function Page() {
    const BASEURL = process.env.NEXT_PUBLIC_BASEURL || 'http://localhost:5000';
    const subjects = await getSubjects(BASEURL);

    return (
        <main className="p-6 max-w-4xl mx-auto">
            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Subjects</h1>
                    <p className="text-gray-600 mt-1">Manage subjects in the dashboard</p>
                </div>
                <a
                    href="/Admin/Dashboard/Subjects/new"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                >
                    + Add Subject
                </a>
            </header>

            <section className="space-y-4">
                {subjects.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-gray-500 text-lg">No subjects found.</div>
                    </div>
                ) : (
                    subjects.map((s) => (
                        <div 
                            key={s._id} 
                            className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="flex-1">
                                    <h3 className="text-xl font-semibold text-gray-900">{s.name}</h3>
                                    {s?.instructor && (
                                        <div className="mt-2">
                                            <p className="text-gray-700">
                                                <span className="font-medium">Instructor:</span> {s.instructor.name} (<span className="text-gray-500 text-sm">{s.instructor.userName}</span>)
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </section>
        </main>
    );
}