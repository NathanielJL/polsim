import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import PageHeader from '../components/PageHeader';
import NavigationMenu from '../components/NavigationMenu';
import WikiAndGMButtons from '../components/WikiAndGMButtons';
import '../styles/LegalBarExamPage.css';

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
}

const allQuestions: Question[] = [
  {
    question: "According to the Constitution Act of 1852, what three bodies comprise the General Assembly of Zealandia?",
    options: [
      "The Governor, Provincial Councils, and Maori Chiefs",
      "The Governor, Legislative Council, and House of Representatives",
      "The Crown, House of Lords, and House of Commons",
      "Provincial Superintendents, Legislative Council, and Judges"
    ],
    correctAnswer: 1
  },
  {
    question: "Which of the following statements about Maori land is TRUE under the Constitution Act?",
    options: [
      "Maori land can be purchased freely by any colonist",
      "All Maori lands are immediately vested in the General Assembly",
      "Maori land can only be purchased by the Crown or its authorized agents",
      "The Provincial Councils have exclusive authority over Maori land sales"
    ],
    correctAnswer: 2
  },
  {
    question: "How many provinces does the Constitution Act of 1852 establish for Zealandia?",
    options: [
      "Five provinces",
      "Six provinces",
      "Seven provinces",
      "Nine provinces"
    ],
    correctAnswer: 2
  },
  {
    question: "Under Section 7 of the Constitution, who is granted special voting rights in Vulteralia?",
    options: [
      "All Maori people regardless of property ownership",
      "French and Spanish colonists only",
      "Colonists of partial Maori and partial French or Spanish descent who meet property qualifications",
      "All residents of Vulteralia regardless of ethnicity"
    ],
    correctAnswer: 2
  },
  {
    question: "What is the relationship between laws passed by the General Assembly and laws passed by Provincial Councils?",
    options: [
      "Provincial laws supersede General Assembly laws within their province",
      "General Assembly laws supersede any laws passed by Provincial Councils",
      "Both have equal authority in their respective domains",
      "The Governor must approve both types of laws separately"
    ],
    correctAnswer: 1
  },
  {
    question: "What is the capital of the Province of New Zealand?",
    options: [
      "Auckland",
      "Wellington",
      "Cook's Landing",
      "Christchurch"
    ],
    correctAnswer: 1
  },
  {
    question: "What is the capital of the Province of Vulteralia?",
    options: [
      "Wellington",
      "Auckland",
      "Cook's Landing",
      "Sydney"
    ],
    correctAnswer: 1
  },
  {
    question: "Who appoints members to the Legislative Council (Upper House)?",
    options: [
      "They are elected by the colonists",
      "The Provincial Superintendents appoint them",
      "The Governor appoints them for life",
      "The Crown appoints them directly from Britain"
    ],
    correctAnswer: 2
  },
  {
    question: "What is the role of the Provincial Superintendent?",
    options: [
      "A judicial officer appointed by the Crown",
      "The chief executive officer of a Province, elected by colonists",
      "A military commander overseeing provincial defense",
      "An advisor to the Governor on native affairs"
    ],
    correctAnswer: 1
  },
  {
    question: "Which powers are reserved for the Provincial Councils under Section 4?",
    options: [
      "Trade, customs, and currency",
      "Defense and foreign relations",
      "Local works, roads, schools, police, and land sales",
      "Appointment of judges and law enforcement"
    ],
    correctAnswer: 2
  },
  {
    question: "Under the electoral qualifications in Section 8, who may vote?",
    options: [
      "All adult colonists regardless of property ownership",
      "Adult male colonists who own freehold land or occupy a tenement of certain value",
      "Only those born in Zealandia",
      "European men and Maori chiefs exclusively"
    ],
    correctAnswer: 1
  },
  {
    question: "What does Section 9 indicate about the franchise?",
    options: [
      "Universal suffrage is granted to all adults",
      "Men of color and those without property are excluded, limiting Maori and lower-class participation",
      "Only Maori are excluded from voting",
      "Women may vote if they own sufficient property"
    ],
    correctAnswer: 1
  },
  {
    question: "What does Section 10 anticipate regarding Responsible Government?",
    options: [
      "The Governor will maintain absolute authority indefinitely",
      "A shift where the Governor follows advice of ministers from the elected House of Representatives",
      "The abolition of the Legislative Council",
      "Direct rule from the British Parliament"
    ],
    correctAnswer: 1
  },
  {
    question: "Which treaty is referenced in Section 6 regarding Maori lands?",
    options: [
      "Treaty of Paris",
      "Treaty of Waitangi (Te Tiriti o Waitangi)",
      "Treaty of Versailles",
      "Treaty of Tordesillas"
    ],
    correctAnswer: 1
  },
  {
    question: "In which city was the Constitution Act of 1852 enacted?",
    options: [
      "Wellington",
      "Cook's Landing",
      "Auckland",
      "Sydney"
    ],
    correctAnswer: 2
  },
  {
    question: "On what date was the Constitution Act of 1852 enacted?",
    options: [
      "February 2, 1852",
      "January 1, 1852",
      "July 4, 1852",
      "December 25, 1851"
    ],
    correctAnswer: 0
  },
  {
    question: "What body has the power to make laws for trade, customs, currency, and defense?",
    options: [
      "The Provincial Councils",
      "The Legislative Council exclusively",
      "The General Assembly",
      "The Governor acting alone"
    ],
    correctAnswer: 2
  },
  {
    question: "How are members of the House of Representatives selected?",
    options: [
      "Appointed by the Governor",
      "Elected by colonists, based on population and distributed across Provinces",
      "Inherited positions from colonial gentry",
      "Nominated by Provincial Superintendents"
    ],
    correctAnswer: 1
  },
  {
    question: "Who holds the prerogative powers in the General Assembly?",
    options: [
      "The Legislative Council",
      "The House of Representatives",
      "The Governor, appointed by the Crown",
      "The Provincial Superintendents collectively"
    ],
    correctAnswer: 2
  },
  {
    question: "According to Section 5, in whom are all lands of the Crown vested?",
    options: [
      "The Provincial Councils",
      "The General Assembly, which may delegate powers to Provincial Councils",
      "The Maori Chiefs",
      "The Governor exclusively"
    ],
    correctAnswer: 1
  }
];

const LegalBarExamPage: React.FC = () => {
  const navigate = useNavigate();
  const { player } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [examStarted, setExamStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [passing, setPassing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);

  const handleStartExam = () => {
    // Select 5 random questions
    const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
    setExamQuestions(shuffled.slice(0, 5));
    setExamStarted(true);
    setCurrentQuestion(0);
    setSelectedAnswers([]);
    setShowResults(false);
  };

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < examQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    // Calculate score
    let correct = 0;
    examQuestions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswer) {
        correct++;
      }
    });

    const passed = correct >= 4;
    setPassing(passed);
    setShowResults(true);

    if (passed) {
      // Grant lawyer status
      setSubmitting(true);
      try {
        await fetch(`http://localhost:5000/api/players/${player?.id}/lawyer`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
      } catch (err) {
        console.error('Error granting lawyer status:', err);
      } finally {
        setSubmitting(false);
      }
    }
  };

  const calculateScore = () => {
    let correct = 0;
    examQuestions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswer) {
        correct++;
      }
    });
    return correct;
  };

  if (!examStarted) {
    return (
      <div className="bar-exam-page">
        <PageHeader title="Bar Exam" menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
        <NavigationMenu isOpen={menuOpen} />

        <div className="exam-content">
          <div className="exam-intro">
            <h2>⚖️ Legal Bar Examination</h2>
            <p>Pass the bar exam to become a certified lawyer and represent clients in court.</p>

            <div className="exam-info">
              <h3>Examination Details</h3>
              <ul>
                <li>5 multiple choice questions</li>
                <li>Must answer 4 out of 5 correctly to pass</li>
                <li>Questions cover New Zealand constitutional and legal principles</li>
                <li>Unlimited attempts allowed</li>
              </ul>
            </div>

            <div className="exam-benefits">
              <h3>Benefits of Becoming a Lawyer</h3>
              <ul>
                <li>Represent plaintiffs or defendants in legal cases</li>
                <li>Earn fees for successful case outcomes</li>
                <li>Increase your reputation and influence</li>
                <li>Access exclusive legal actions and strategies</li>
              </ul>
            </div>

            <button className="start-exam-btn" onClick={handleStartExam}>
              Take the Bar Exam
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showResults) {
    const score = calculateScore();
    return (
      <div className="bar-exam-page">
        <PageHeader title="Bar Exam Results" menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
        <NavigationMenu isOpen={menuOpen} />

        <div className="exam-content">
          <div className="exam-results">
            <div className={`result-header ${passing ? 'pass' : 'fail'}`}>
              <h2>{passing ? '✅ Congratulations!' : '❌ Not Quite'}</h2>
              <div className="score-display">
                <span className="score">{score}</span>
                <span className="total">/ 5</span>
              </div>
            </div>

            {passing ? (
              <div className="pass-message">
                <p>You have passed the bar exam and are now a certified lawyer!</p>
                <p>You can now represent clients in legal cases and earn fees for your services.</p>
                <button onClick={() => navigate('/legal/cases')} className="cases-btn">
                  View Available Cases
                </button>
              </div>
            ) : (
              <div className="fail-message">
                <p>You need at least 4 correct answers to pass (you got {score}).</p>
                <p>Review the questions and try again.</p>
                <button onClick={handleStartExam} className="retry-btn">
                  Retake Exam
                </button>
              </div>
            )}

            <div className="answer-review">
              <h3>Answer Review</h3>
              {questions.map((q, idx) => (
                <div key={idx} className={`review-item ${selectedAnswers[idx] === q.correctAnswer ? 'correct' : 'incorrect'}`}>
                  <div className="review-question">
                    <strong>Q{idx + 1}:</strong> {q.question}
                  </div>
                  <div className="review-answer">
                    Your answer: {q.options[selectedAnswers[idx]]}
                    {selectedAnswers[idx] !== q.correctAnswer && (
                      <div className="correct-answer">
                        Correct answer: {q.options[q.correctAnswer]}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const question = examQuestions[currentQuestion];
  const allAnswered = selectedAnswers.length === examQuestions.length && selectedAnswers.every(a => a !== undefined);

  return (
    <div className="bar-exam-page">
      <PageHeader title="Bar Exam" menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <NavigationMenu isOpen={menuOpen} />

      <div className="exam-content">
        <div className="exam-container">
          <div className="exam-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${((currentQuestion + 1) / examQuestions.length) * 100}%` }}
              />
            </div>
            <div className="progress-text">
              Question {currentQuestion + 1} of {examQuestions.length}
            </div>
          </div>

          <div className="question-card">
            <h3 className="question-text">{question.question}</h3>

            <div className="options-list">
              {question.options.map((option, idx) => (
                <button
                  key={idx}
                  className={`option-btn ${selectedAnswers[currentQuestion] === idx ? 'selected' : ''}`}
                  onClick={() => handleAnswerSelect(idx)}
                >
                  <span className="option-letter">{String.fromCharCode(65 + idx)}</span>
                  <span className="option-text">{option}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="exam-navigation">
            <button 
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className="nav-btn prev-btn"
            >
              ← Previous
            </button>

            {currentQuestion < examQuestions.length - 1 ? (
              <button 
                onClick={handleNext}
                disabled={selectedAnswers[currentQuestion] === undefined}
                className="nav-btn next-btn"
              >
                Next →
              </button>
            ) : (
              <button 
                onClick={handleSubmit}
                disabled={!allAnswered || submitting}
                className="nav-btn submit-btn"
              >
                {submitting ? 'Submitting...' : 'Submit Exam'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalBarExamPage;
