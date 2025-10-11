import express from 'express';
const router = express.Router();
import { Subject,TestUser } from './schema.js';
import { verifyToken } from './middleware.js';

router.get('/', async (req, res) => {
    res.send('Subject routes are under construction.');
});

router.post('/addSubject',verifyToken, async (req, res) => {
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


router.get('/getAllSubjects', async (req, res) => {
  try {
    const subjects = await Subject.find()
      .populate('instructor', 'name userName'); // only return these fields

    res.status(200).json(subjects);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).send('Error fetching subjects: ' + error.message);
  }
});

router.get('/getSubject/:id', async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id)
      .populate('instructor', 'name userName'); // only return these fields

    if (!subject) {
      return res.status(404).send('Subject not found.');
    }

    res.status(200).json(subject);
  } catch (error) {
    console.error('Error fetching subject:', error);
    res.status(500).send('Error fetching subject: ' + error.message);
  }
});

router.get('/getNotEnrolledStudents/:id', verifyToken, async (req, res) => {
  try {
    const subjectId = req.params.id;
    if (!subjectId) {
      return res.status(400).send('subjectId is required.');
    }
    const enrolledStudents = await TestUser.find({ subjectsEnrolled: subjectId }).select('_id');
    const enrolledStudentIds = enrolledStudents.map(student => student._id);
    const notEnrolledStudents = await TestUser.find({ _id: { $nin: enrolledStudentIds } }).select('name userName email');
    res.status(200).json(notEnrolledStudents);
  } catch (error) {
    console.error('Error fetching not enrolled students:', error);
    res.status(500).send('Error fetching not enrolled students: ' + error.message);
  }
});

router.post('/EnrollStudent/:id', verifyToken, async (req, res) => {
  try {
    const subjectId = req.params.id;
    const { studentId } = req.body;
    if (!studentId) {
      return res.status(400).send('studentId is required.');
    }
   const student = await TestUser.findByIdAndUpdate(
      studentId,
      { $addToSet: { subjectsEnrolled: subjectId } }, // addToSet prevents duplicates
      { new: true }
   );

   if (!student) {
      return res.status(404).send('Student not found.');
   }

   res.status(200).json(student);
  } catch (error) {
    console.error('Error enrolling student:', error);
    res.status(500).send('Error enrolling student: ' + error.message);
  }
});

router.get('/getEnrolledStudents/:id', verifyToken, async (req, res) => {
  try {
    const subjectId = req.params.id;
    if (!subjectId) {
      return res.status(400).send('subjectId is required.');
    }
    const enrolledStudents = await TestUser.find({ subjectsEnrolled: subjectId }).select('name userName email');
    res.status(200).json(enrolledStudents);
  } catch (error) {
    console.error('Error fetching enrolled students:', error);
    res.status(500).send('Error fetching enrolled students: ' + error.message);
  }
});

router.delete('/UnenrollStudent/:id', verifyToken, async (req, res) => {
  try {
    const subjectId = req.params.id;
    const { studentId } = req.body;
    if (!studentId) {
      return res.status(400).send('studentId is required.');
    }
    const student = await TestUser.findByIdAndUpdate(
      studentId,
      { $pull: { subjectsEnrolled: subjectId } },
      { new: true }
    );

    if (!student) {
      return res.status(404).send('Student not found.');
    }

    res.status(200).json(student);
  } catch (error) {
    console.error('Error unenrolling student:', error);
    res.status(500).send('Error unenrolling student: ' + error.message);
  }
});

router.get('/getEnrolledSubjects/:id', verifyToken, async (req, res) => {
  try {
    const studentId = req.params.id;
    console.log('Fetching enrolled subjects for studentId:', studentId);
    if (!studentId) {
      return res.status(400).send('studentId is required.');
    }
    const student = await TestUser.findById(studentId).populate({
      path: 'subjectsEnrolled',
      select: 'name description'
    });

    if (!student) {
      return res.status(404).send('Student not found.');
    }

    res.status(200).json(student.subjectsEnrolled);
  } catch (error) {
    console.error('Error fetching enrolled subjects:', error);
    res.status(500).send('Error fetching enrolled subjects: ' + error.message);
  }
});

export default router;