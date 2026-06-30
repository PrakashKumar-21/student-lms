import "./student-dashboard.css";
import { Link, NavLink } from "react-router-dom";

export default function StudentDashboard() {
  return (
    <div className="lms-container">
      {/* ================= SIDEBAR ================= */}
      <aside className="sidebar">
        <div className="logo">AI-LMS</div>

        <button className="join-btn">Join New Courses</button>

        <nav className="menu">
          <NavLink to="/student" end>
            Dashboard
          </NavLink>

          <NavLink to="/student/courses">
            Courses
          </NavLink>

          <NavLink to="/student/notifications">
            Notifications
          </NavLink>

          <NavLink to="/student/free-demos">
            Free Demos
          </NavLink>

          <NavLink to="/student/account">
            Account
          </NavLink>

          <NavLink to="/student/help">
            Help
          </NavLink>
        </nav>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <main className="main">
        {/* ---------- HEADER ---------- */}
        <header className="topbar">
          <h2>
            Welcome back, <span>Prakash Gehlot!</span>
          </h2>

          <input type="text" placeholder="Search here" />

          <div className="profile">Student</div>
        </header>

        {/* ---------- COURSE INFO ---------- */}
        <section className="info-row">
          <div className="info-card">
            <strong>Course Name</strong>
            <p>AI-Lecture</p>
          </div>

          <div className="info-card">
            <strong>Subject Name</strong>
            <p>Accounting Certification Courses</p>
          </div>
        </section>

        {/* ---------- DASHBOARD CARDS ---------- */}
        <section className="card-grid">
          <Link to="/student/course/ten" className="dash-card blue">
            Ten – 10
          </Link>

          <Link to="/student/course/eleven" className="dash-card teal">
            Eleven – 11
          </Link>

          <Link to="/student/course/twelve" className="dash-card orange">
            Twelve – 12
          </Link>

          <Link to="/student/course/eight" className="dash-card pink">
            Eight – 8
          </Link>
        </section>
      </main>
    </div>
  );
}
