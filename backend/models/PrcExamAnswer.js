import mongoose from "mongoose";

const PrcExamAnswerSchema = new mongoose.Schema({
  Student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  questionSet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
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

const PrcExamAnswer = mongoose.model('PrcExamAnswer', PrcExamAnswerSchema);
export default PrcExamAnswer;
