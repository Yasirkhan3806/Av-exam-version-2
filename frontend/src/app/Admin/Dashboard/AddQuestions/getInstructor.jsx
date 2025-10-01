"use client";

import React, { useEffect, useState, useContext} from "react";
import { BaseUrlContext} from "@/app/BASEURLContext";

const GetInstructor = ({ SelectInstructors }) => {
    const [instructors, setInstructors] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const BASEURL = useContext(BaseUrlContext);

    useEffect(() => {
        // Replace with your actual API endpoint
        fetch(`${BASEURL}/auth/get-instructors`,{credentials: 'include'})
            .then((res) => res.json())
            .then((data) => setInstructors(data.instructors))
            .catch((err) => console.error("Failed to fetch instructors:", err));
    }, []);

    const handleCheckboxChange = (id) => {
        let updatedSelected;
        if (selectedIds.includes(id)) {
            updatedSelected = selectedIds.filter((instructorId) => instructorId !== id);
        } else {
            updatedSelected = [...selectedIds, id];
        }
        console.log(updatedSelected);
        setSelectedIds(updatedSelected);
        SelectInstructors && SelectInstructors(updatedSelected);
    };

    return (
        <form>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {instructors.map((inst) => (
                    <label key={inst._id} style={{ display: "flex", alignItems: "center" }}>
                        <input
                            type="checkbox"
                            checked={selectedIds.includes(inst._id)}
                            onChange={() => handleCheckboxChange(inst._id)}
                        />
                        <span style={{ marginLeft: "8px" }}>
                            {inst.name} ({inst.userName}) - Courses: {inst.courses.join(", ")}
                        </span>
                    </label>
                ))}
            </div>
        </form>
    );
};

export default GetInstructor;