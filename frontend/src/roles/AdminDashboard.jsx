import CourseList from "../components/CourseList.jsx";

export const permissions = { canEnroll: false, canManageCourses: true };

export default function AdminDashboard({
  user,
  courses,
  enrolledIds,
  onViewCourses,
  onEnroll,
  onUnenroll,
  isLoading,
}) {
  const learnerCount = courses.reduce((total, course) => total + course.enrollment_count, 0);

  return (
    <>
      <div className="welcome-row">
        <div>
          <p className="eyebrow">LEARNING, AT A GLANCE</p>
          <h1>Good to see you, {user.username} <span aria-hidden="true">✳</span></h1>
          <p className="muted">Here is an overview of the learning space.</p>
        </div>
        <button className="button button-primary" onClick={onViewCourses}>Explore the library <span aria-hidden="true">↗</span></button>
      </div>
      <div className="stats-grid">
        <div className="stat-card"><span className="stat-icon mint" aria-hidden="true">▤</span><span className="stat-label">COURSES AVAILABLE</span><strong>{courses.length}</strong><span className="stat-foot">In the course library</span></div>
        <div className="stat-card"><span className="stat-icon peach" aria-hidden="true">✳</span><span className="stat-label">ENROLLMENTS</span><strong>{learnerCount}</strong><span className="stat-foot">Across the course library</span></div>
        <div className="stat-card stat-card-feature"><span className="stat-label">A NOTE TO SELF</span><strong>Curiosity looks<br />good on you.</strong><span className="stat-foot">Keep the community growing.</span><span className="feature-sun" aria-hidden="true">✳</span></div>
      </div>
      <div className="section-heading">
        <div><p className="eyebrow">THE COURSE LIBRARY</p><h2>Recently available courses</h2></div>
        <button className="text-button" onClick={onViewCourses}>View all courses <span aria-hidden="true">→</span></button>
      </div>
      <CourseList
        courses={courses.slice(0, 3)}
        enrolledIds={enrolledIds}
        canEnroll={false}
        onEnroll={onEnroll}
        onUnenroll={onUnenroll}
        isLoading={isLoading}
      />
    </>
  );
}
