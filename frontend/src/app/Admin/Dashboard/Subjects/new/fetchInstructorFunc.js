const fetchInstructors = async (BASEURL) => {
    try {
        const response = await fetch(`${BASEURL}/instructors/get-instructors`, { credentials: 'include' });
        const data = await response.json();
        console.log(data);
        if (!data.success) {
            throw new Error(`Error fetching instructors: ${response.statusText}`);
        }
        
        return data;
    } catch (error) {
        console.error(error);
        throw new Error('Failed to fetch instructors');
    }
};
export default fetchInstructors;