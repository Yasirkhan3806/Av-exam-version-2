import express from 'express';
const router = express.Router();
import { Subject } from './schema.js';

router.get('/', async (req, res) => {
    res.send('Subject routes are under construction.');
});

router.post('/addSubject', async (req, res) => {
    try{
        const { name, description, instructor, courses } = req.body;
        if (!name || !description || !instructor) {
            return res.status(400).send('Name, description, and instructor are required.');
        }
        const existingSubject = await Subject.findOne({ name, instructor });
        if (existingSubject) {
            return res.status(409).send('Subject already exists for this instructor.');
        }
        const newSubject = new Subject({
            name,
            description,
            instructor,
            courses
        });
        await newSubject.save();
        res.status(201).send('Subject added successfully.');
    }catch(error){
        console.error('Error adding subject:', error);
        res.status(500).send('Error adding subject: ' + error.message);
    }
});

export default router;