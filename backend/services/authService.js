import bcrypt from "bcrypt";
import {
  TestUser,
  User,
  Instructor,
  CafExamAnswer,
  PRCAnswer,
  Answer,
} from "../models/index.js";
import fs from "fs";

const PEPPER =
  "c8b378ecb0f4059059036dcc4abd1e76a30bdd72b1429d9c1a2242effbfa19d5";

export const registerUser = async (name, userName, email, password) => {
  const existingUser = await TestUser.findOne({ email });
  if (existingUser) {
    throw new Error("User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new TestUser({
    name,
    email,
    userName,
    password: hashedPassword,
  });
  await newUser.save();

  return newUser;
};

export const loginUser = async (email, password) => {
  const user = await TestUser.findOne({ email });
  if (!user) {
    throw new Error("Invalid email or password");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Invalid email or password");
  }

  return user;
};

export const adminLogin = async (username, password) => {
  const user = await User.findOne({ email: username.toLowerCase() });
  if (!user) {
    throw new Error("Invalid email or password");
  }

  const passwordWithPepper = PEPPER ? password + PEPPER : password;
  const isMatch = await bcrypt.compare(passwordWithPepper, user.password);

  if (!isMatch) {
    throw new Error("Invalid email or password");
  }

  return user;
};

export const getInstructors = async () => {
  const instructors = await Instructor.find({}, "doc_id name userName courses");
  return instructors;
};

export const getAllStudents = async () => {
  return await TestUser.find({}).select("-password");
};

export const updateStudent = async (id, updateData) => {
  if (updateData.userName) {
    const existing = await TestUser.findOne({
      userName: updateData.userName,
      _id: { $ne: id },
    });
    if (existing) {
      throw new Error("Username already taken");
    }
  }

  if (updateData.password) {
    updateData.password = await bcrypt.hash(updateData.password, 10);
  }
  const updatedStudent = await TestUser.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true, runValidators: true },
  ).select("-password");

  if (!updatedStudent) {
    throw new Error("Student not found");
  }

  return updatedStudent;
};

export const deleteStudent = async (id) => {
  // 1. Delete CAF Exam Answers and Files
  const cafAnswers = await CafExamAnswer.find({ Student: id });
  for (const answer of cafAnswers) {
    if (answer.submittedPdfUrl && fs.existsSync(answer.submittedPdfUrl)) {
      try {
        fs.unlinkSync(answer.submittedPdfUrl);
      } catch (err) {
        console.error(`Failed to delete file: ${answer.submittedPdfUrl}`, err);
      }
    }
  }
  await CafExamAnswer.deleteMany({ Student: id });

  // 2. Delete PRC Exam Answers
  // Note: PrcExamAnswer uses 'Student' referring to 'User' but effective usage seems to be consistent with student ID.
  // Wait, looking at PrcExamAnswer definition:
  // Student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  // Yet TestUser is the student model. Assuming the ID passed is suitable for PrcExamAnswer.Student lookup.
  await PRCAnswer.deleteMany({ Student: id });

  // 3. Delete Answers (CFAP/Standard) and associated files
  const answers = await Answer.find({ Student: id });
  for (const answer of answers) {
    if (answer.marksObtained) {
      for (const data of Object.values(answer.marksObtained)) {
        if (data && data.pdfUrl) {
          if (fs.existsSync(data.pdfUrl)) {
            try {
              fs.unlinkSync(data.pdfUrl);
            } catch (err) {
              console.error(`Failed to delete file: ${data.pdfUrl}`, err);
            }
          }
        }
      }
    }
  }
  await Answer.deleteMany({ Student: id });

  // 4. Delete Student Record
  const result = await TestUser.findByIdAndDelete(id);

  if (!result) {
    throw new Error("Student not found");
  }
  return result;
};
