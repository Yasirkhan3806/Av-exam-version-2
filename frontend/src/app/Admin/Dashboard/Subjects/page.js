// /d:/AVExam/frontend/src/app/Admin/Dashboard/Subjects/page.js
// Basic Next.js App Router page boilerplate for "Subjects"

async function getSubjects() {
    // Replace this with a real data fetch (e.g. fetch('/api/subjects'))
    return [
        { id: 1, name: 'Mathematics', code: 'MATH101', instructor: 'Alice Johnson' },
        { id: 2, name: 'Physics', code: 'PHYS101', instructor: 'Bob Smith' },
        { id: 3, name: 'Chemistry', code: 'CHEM101', instructor: 'Carol Lee' },
    ];
}

export default async function Page() {
    const subjects = await getSubjects();

    return (
        <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ margin: 0 }}>Subjects</h1>
                    <p style={{ margin: '4px 0 0', color: '#666' }}>Manage subjects in the dashboard</p>
                </div>
                <a
                    href="/Admin/Dashboard/Subjects/new"
                    style={{
                        padding: '8px 12px',
                        background: '#0070f3',
                        color: 'white',
                        borderRadius: 6,
                        textDecoration: 'none',
                        fontWeight: 600,
                    }}
                >
                    + Add Subject
                </a>
            </header>

            <section style={{ marginTop: 20 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th style={{ textAlign: 'left', padding: '8px 6px', borderBottom: '1px solid #eee' }}>Code</th>
                            <th style={{ textAlign: 'left', padding: '8px 6px', borderBottom: '1px solid #eee' }}>Name</th>
                            <th style={{ textAlign: 'left', padding: '8px 6px', borderBottom: '1px solid #eee' }}>Instructor</th>
                        </tr>
                    </thead>
                    <tbody>
                        {subjects.map((s) => (
                            <tr key={s.id}>
                                <td style={{ padding: '8px 6px', borderBottom: '1px solid #f5f5f5' }}>{s.code}</td>
                                <td style={{ padding: '8px 6px', borderBottom: '1px solid #f5f5f5' }}>{s.name}</td>
                                <td style={{ padding: '8px 6px', borderBottom: '1px solid #f5f5f5' }}>{s.instructor}</td>
                            </tr>
                        ))}
                        {subjects.length === 0 && (
                            <tr>
                                <td colSpan="3" style={{ padding: 12, color: '#666' }}>
                                    No subjects found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </section>
        </main>
    );
}