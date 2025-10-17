"use client";
import React, { use, useEffect, useState } from 'react';
import QuestionPanel from '../../components/QuestionWindow';
import AnswerPanel from '../../components/AnswerWindow';
import GradingPanel from '../../components/GradingPanel';
import useInstructorStore from '../../components/StateManagement';
import { useParams } from 'next/navigation';

const mockQuestions = [
  {
    id: 1,
    title: "Question 1: Advanced Algorithms",
    content: "Explain the time complexity of Dijkstra's algorithm and provide an optimized implementation using a priority queue.",
    pdfUrl: "#"
  },
  {
    id: 2,
    title: "Question 2: Database Design",
    content: "Design a normalized database schema for an e-commerce platform with users, products, orders, and inventory management.",
    pdfUrl: "#"
  },
  {
    id: 3,
    title: "Question 3: Machine Learning",
    content: "Compare supervised and unsupervised learning approaches with practical examples and implementation considerations.",
    pdfUrl: "#"
  }
];

const mockAnswers = [
  {
    id: 1,
    studentId: "STU001",
    studentName: "Ali Ahmed",
    htmlContent: `<div class="prose max-w-none">
      <h3>Dijkstra's Algorithm Analysis</h3>
      <p>Dijkstra's algorithm has a time complexity of O((V + E) log V) when implemented with a binary heap, where V is the number of vertices and E is the number of edges.</p>
      <p>The algorithm works by maintaining a priority queue of vertices, initially containing the source vertex with distance 0 and all other vertices with distance infinity.</p>
      <h4>Optimized Implementation</h4>
      <pre><code>function dijkstra(graph, source) {
  const distances = new Map();
  const pq = new PriorityQueue();
  
  // Initialize distances
  for (const vertex of graph.vertices) {
    distances.set(vertex, vertex === source ? 0 : Infinity);
  }
  
  pq.enqueue(source, 0);
  
  while (!pq.isEmpty()) {
    const current = pq.dequeue();
    const currentDist = distances.get(current);
    
    for (const [neighbor, weight] of graph.getNeighbors(current)) {
      const newDist = currentDist + weight;
      if (newDist < distances.get(neighbor)) {
        distances.set(neighbor, newDist);
        pq.enqueue(neighbor, newDist);
      }
    }
  }
  
  return distances;
}</code></pre>
    </div>`
  },
  {
    id: 2,
    studentId: "STU002",
    studentName: "Fatima Khan",
    htmlContent: `<div class="prose max-w-none">
      <h3>Database Schema Design</h3>
      <p>For an e-commerce platform, I propose the following normalized schema:</p>
      <ul>
        <li><strong>Users</strong>: user_id (PK), email, password_hash, first_name, last_name, created_at</li>
        <li><strong>Products</strong>: product_id (PK), name, description, price, category_id, created_at</li>
        <li><strong>Categories</strong>: category_id (PK), name, parent_category_id</li>
        <li><strong>Orders</strong>: order_id (PK), user_id (FK), total_amount, status, created_at</li>
        <li><strong>Order_Items</strong>: order_item_id (PK), order_id (FK), product_id (FK), quantity, price_at_time</li>
        <li><strong>Inventory</strong>: inventory_id (PK), product_id (FK), quantity_available, last_updated</li>
      </ul>
      <p>This design follows 3NF and ensures data integrity through proper foreign key relationships.</p>
    </div>`
  },
  {
    id: 3,
    studentId: "STU003",
    studentName: "Omar Hassan",
    htmlContent: `<div class="prose max-w-none">
      <h3>Machine Learning Comparison</h3>
      <table class="min-w-full divide-y divide-gray-300">
        <thead>
          <tr>
            <th class="px-4 py-2 text-left">Aspect</th>
            <th class="px-4 py-2 text-left">Supervised Learning</th>
            <th class="px-4 py-2 text-left">Unsupervised Learning</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="px-4 py-2">Data Requirement</td>
            <td class="px-4 py-2">Labeled training data</td>
            <td class="px-4 py-2">Unlabeled data</td>
          </tr>
          <tr>
            <td class="px-4 py-2">Examples</td>
            <td class="px-4 py-2">Classification, Regression</td>
            <td class="px-4 py-2">Clustering, Dimensionality Reduction</td>
          </tr>
          <tr>
            <td class="px-4 py-2">Algorithms</td>
            <td class="px-4 py-2">SVM, Random Forest, Neural Networks</td>
            <td class="px-4 py-2">K-means, PCA, Autoencoders</td>
          </tr>
        </tbody>
      </table>
      <p>Supervised learning is suitable when we have clear input-output mappings, while unsupervised learning helps discover hidden patterns in data.</p>
    </div>`
  }
];
// Main App Component
export default function ReviewAnswer() {
  const params = useParams();
  const studentId = params.studentId;
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentMarks, setCurrentMarks] = useState(0);
  const [showAnswer, setShowAnswer] = useState(true);

  const maxMarks = 20;
  const {fetchExamById,fetchAnswersByQuestionId,examQuestions, studentAnswers,currentQuestion,nextQuestion,prevQuestion} = useInstructorStore((state)=>state);

  useState(()=>{
    fetchExamById();
    fetchAnswersByQuestionId(studentId);
  },[]);
  useEffect(()=>{
    if(!studentAnswers[`q${currentQuestion}`]){
      setShowAnswer(false)
    }else{
      setShowAnswer(true)
    }
  },[currentQuestion])
  

  // const currentQuestion = mockQuestions[currentQuestionIndex];
  const currentAnswer = studentAnswers[`q${currentQuestion}`];


  const handleMarksChange = (marks) => {
    setCurrentMarks(marks);
  };

  const handleSave = () => {
    console.log(`Saving ${currentMarks} marks for question ${currentQuestion.id}`);
    if (currentQuestionIndex < mockQuestions.length - 1) {
      handleNavigate(1);
    }
  };

  const handleSkip = () => {
    if (currentQuestionIndex < mockQuestions.length - 1) {
      handleNavigate(1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Question and Answer Panels - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[100vh]">
          <QuestionPanel 
            currentQuestionPath={examQuestions[`q${currentQuestion}`]}
            currentQuestionIndex={currentQuestion}
            totalQuestions={Object.keys(examQuestions).length}
            nextQuestion={nextQuestion}
            prevQuestion={prevQuestion}
          />
          <AnswerPanel 
            answer={currentAnswer}
            showAnswer={showAnswer}
            onToggleAnswer={() => setShowAnswer(!showAnswer)}
          />
        </div>

        {/* Grading Panel - Full Width */}
        <GradingPanel 
          currentMarks={currentMarks}
          maxMarks={maxMarks}
          onMarksChange={handleMarksChange}
          onSave={handleSave}
          onSkip={handleSkip}
        />
      </main>
    </div>
  );
}