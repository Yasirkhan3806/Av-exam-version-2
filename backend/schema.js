import mongoose from 'mongoose';

const userTestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  userName: { type: String, required: true, unique: true },
  subjectsEnrolled: { type: [mongoose.Schema.Types.ObjectId], ref: 'Subject', default: [] },
}, {
  collection: 'Test_User_Data'  // Specify collection name here
});

export const TestUser = mongoose.model('TestUser', userTestSchema);


const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  userName: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
}, {
  collection: 'User_Data'  // Specify collection name here
});

export const User = mongoose.model('User', userSchema);

const instructorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  userName: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  courses: { type: [String], default: [] },
}, {
  collection: 'Instructor_Data'  // Specify collection name here
});

export const Instructor = mongoose.model('Instructor', instructorSchema);

const questionsSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    totalQuestions: {
      type: Number,
      required: true,
      min: 1,
    },
    pdfName: {
      type: String,
      required: true,
    },
    pagesData: {
      type: {},
      required: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    totalAttempt: {
      type: Number,
      required: true,
      min: 1,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject', // Reference to Subject collection
    },

    mockExam: {
      type: Boolean,
      default: false,
    },
    totalMarks: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);



export const Questions = mongoose.model("Questions", questionsSchema);




const answerSchema = new mongoose.Schema({
  answers: {
    type: Map,
    of: String, // Each key (e.g., 'q1') maps to an answer string
    required: true,
  },
  questionSet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Questions', // Reference to Questions collection
    required: true,
  },
  status: {
    type: String,
    enum: ['submitted', 'draft', 'checked'],
    default: 'submitted',
  },
  marksObtained: {
    type: Object,
    default: {},
  },
  checkedAt: {
    type: Date,
  },

  Student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestUser', // Reference to TestUser model
    required: true,
  },
},
  {
    timestamps: true,
    collection: 'Answers'
  });

export const Answer = mongoose.model('Answer', answerSchema);
const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Instructor',
    required: true
  },
  courses: {
    type: [String],
    default: []
  }
}, {
  timestamps: true,
  collection: 'Subject_Data'
});

export const Subject = mongoose.model('Subject', subjectSchema);
