import { Link } from "react-router-dom";
import "./student.css";

const courses = [
  {
    id: "ai-basics",
    title: "AI Basics",
    description: "Understand fundamentals of Artificial Intelligence",
    lessons: 12,
    level: "Beginner",
  },
  {
    id: "machine-learning",
    title: "Machine Learning",
    description: "Learn supervised & unsupervised learning",
    lessons: 18,
    level: "Intermediate",
  },
  {
    id: "deep-learning",
    title: "Deep Learning",
    description: "Neural networks, CNNs, RNNs explained",
    lessons: 20,
    level: "Advanced",
  },
];

export default function StudentCourses() {
  return (
    <div className="student-page">
      {/* BACK */}
      <Link to="/student" className="back-link">
        ← Back to Dashboard
      </Link>

      <h1 className="page-title">My Courses</h1>

      <div className="course-list">
        {courses.map((course) => (
          <div key={course.id} className="course-card">
            <h3>{course.title}</h3>
            <p>{course.description}</p>

            <div className="course-meta">
              <span> {course.lessons} Lessons</span>
              <span> {course.level}</span>
            </div>

            <Link
              to={`/student/course/${course.id}`}
              className="open-course-btn"
            >
              Open Course →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
