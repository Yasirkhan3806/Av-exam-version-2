import mongoose from "mongoose";

const PrcExamAnswerSchema = new mongoose.Schema({
  Student: {
    type: mongoose.Schema.Types.ObjectId,
    // Was 'User' (the admin/instructor login model) — wrong collection.
    // Students are TestUser docs, matching Answer.js/CafExamAnswer.js.
    ref: 'TestUser',
    required: true
  },
  questionSet: {
    type: mongoose.Schema.Types.ObjectId,
    // Was 'Exam' — that model doesn't exist anywhere in this codebase, so
    // any .populate('questionSet') call would throw MissingSchemaError.
    ref: 'PRCExam',
    required: true
  },
  total: {
    type: Number,
    required: true
  },
  correct: {
    type: Number,
    required: true
  },
  wrong: {
    type: Number,
    required: true
  },
  detailed: [
    {
      questionId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
      },
      questionText: {
        type: String,
        required: true
      },
      selectedOption: {
        type: String,
        required: true
      },
      correctAnswer: {
        type: String,
        required: true
      },
      isCorrect: {
        type: Boolean,
        required: true
      },
      options: [
        {
          label: { type: String, required: true },
          text: { type: String, required: true },
          _id: { type: mongoose.Schema.Types.ObjectId, required: true }
        }
      ]
    }
  ]
}, { timestamps: true });

// Unlike Answer/CafExamAnswer, this vertical had no submission guard at all
// — nothing stopped a student from retaking and saving multiple results for
// the same exam. One result per student per exam, enforced at the DB level.
PrcExamAnswerSchema.index({ questionSet: 1, Student: 1 }, { unique: true });

const PrcExamAnswer = mongoose.model('PrcExamAnswer', PrcExamAnswerSchema);
export default PrcExamAnswer;
