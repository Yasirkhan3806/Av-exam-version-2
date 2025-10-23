import express from 'express';
import mongoose from 'mongoose';
const router = express.Router();
import { Subject,TestUser,Questions,Answer } from './schema.js';
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
    if (!studentId) {
      return res.status(400).send('studentId is required.');
    }
    const student = await TestUser.findById(studentId).populate({
      path: 'subjectsEnrolled',
      select: '_id name description'
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

router.get('/getExamsForSubject/:id', verifyToken, async (req, res) => {
  try {
    const subjectId = req.params.id;
    const userId = req.user.userId; // ✅ assuming verifyToken attaches user info to req.user

    if (!subjectId) {
      return res.status(400).send('subjectId is required.');
    }

    const exams = await Questions.aggregate([
      {
        $match: { subject: new mongoose.Types.ObjectId(subjectId) }
      },
      {
        $lookup: {
          from: 'Answers',
          let: { examId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$questionSet', '$$examId'] },
                    { $eq: ['$Student', new mongoose.Types.ObjectId(userId)] }
                  ]
                }
              }
            },
            { $limit: 1 } // only need to know if it exists
          ],
          as: 'userAnswer'
        }
      },
      {
        $addFields: {
          completed: { $gt: [{ $size: '$userAnswer' }, 0] }
        }
      },
      {
        $project: {
          _id: 1,
          questionSetName: '$name',
          totalQuestions: 1,
          totalTime: '$totalAttempt',
          mockExam: 1,
          description: 1,
          totalMarks: 1,
          completed: 1
        }
      }
    ]);

    res.status(200).json(exams);
  } catch (error) {
    console.error('Error fetching exams for subject:', error);
    res.status(500).send('Error fetching exams for subject: ' + error.message);
  }
});

router.get("/getResults/:studentId",verifyToken
, async (req, res) => {
  try {
    const { studentId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "Invalid student ID" });
    }
    const results = await Answer.find({ Student: studentId, status: "checked" }).populate("questionSet", "_id name totalAttempt totalMarks totalQuestions").sort({ checkedAt: -1 });

    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching results:", error);
    res.status(500).send("Error fetching results: " + error.message);
  }
});

router.get("/getStudentAnswers/:studentId/:examId", verifyToken, async (req, res) => {
  try {
    const { studentId, examId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(studentId) || !mongoose.Types.ObjectId.isValid(examId)) {
      console.error("Invalid student ID or exam ID");
      return res.status(400).json({ message: "Invalid student ID or exam ID" });
    }

    const answers = await Answer.findOne({
      Student: studentId,
      questionSet: examId
    }).populate("questionSet", "_id name totalAttempt totalMarks totalQuestions");

    if (!answers) {
      return res.status(404).json({ 
        success: false,
        message: "No answers found for this student and exam" 
      });
    }

    return res.status(200).json({
      success: true,
      message: "✅ Student answers fetched successfully",
      answers
    });

  } catch (error) {
    console.error("❌ Error fetching student answers:", error);
    return res.status(500).json({
      success: false, 
      message: "Server error",
      error: error.message
    });
  }
});

router.get("/grade/:studentId/:subjectId", async (req, res) => {
  try {
    const { studentId, subjectId } = req.params;

    // 1️⃣ Find all question sets under the given subject
    const questionSets = await Questions.find({ subject: subjectId });
    if (!questionSets.length) {
      return res.status(404).json({ message: "No question sets found for this subject." });
    }

    const questionSetIds = questionSets.map(q => q._id);

    // 2️⃣ Find all checked answers for this student related to the subject
    const answers = await Answer.find({
      Student: studentId,
      questionSet: { $in: questionSetIds },
      status: "checked",
    });

    if (!answers.length) {
      return res.status(404).json({ message: "No checked answers found for this student in this subject." });
    }

    // 3️⃣ Calculate obtained & total marks
    let totalMarks = 0;
    let obtainedMarks = 0;

    for (const answer of answers) {
      const relatedQuestionSet = questionSets.find(q => q._id.equals(answer.questionSet));
      if (!relatedQuestionSet) continue;

      totalMarks += relatedQuestionSet.totalMarks;

      // Extract marks from nested structure: marksObtained.q1.marks
      const marksData = Object.values(answer.marksObtained || {});
      const studentMarks = marksData.reduce((sum, item) => {
        return sum + (item?.marks ? Number(item.marks) : 0);
      }, 0);

      obtainedMarks += studentMarks;
    }

    // 4️⃣ Calculate percentage and grade
    const percentage = ((obtainedMarks / totalMarks) * 100).toFixed(2);
    let grade = "F";
    if (percentage >= 85) grade = "A";
    else if (percentage >= 70) grade = "B";
    else if (percentage >= 55) grade = "C";
    else if (percentage >= 40) grade = "D";

    // 5️⃣ Get subject details
    const subject = await Subject.findById(subjectId);

    // 6️⃣ Send response
    res.json({
      subject: subject?.name || "Unknown Subject",
      totalMarks,
      obtainedMarks,
      percentage: Number(percentage),
      grade,
    });

  } catch (error) {
    console.error("Error calculating grade:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});


export default router;