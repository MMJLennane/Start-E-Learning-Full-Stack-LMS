import CourseList from "../components/CourseList.jsx";

export const permissions = { canEnroll: true, canManageCourses: false };

export default function StudentDashboard({
  user,
  courses,
  enrollments,
  enrolledIds,
  onViewCourses,
  onEnroll,
  onUnenroll,
  isLoading,
}) {
  return (
    <>
      <div className="welcome-row">
        <div>
          <p className="eyebrow">YOUR LEARNING, AT A GLANCE</p>
          <h1>Good to see you, {user.username} <span aria-hidden="true">✳</span></h1>
          <p className="muted">A little progress each day adds up to big results.</p>
        </div>
        <button className="button button-primary" onClick={onViewCourses}>Find a course <span aria-hidden="true">↗</span></button>
      </div>
      <div className="stats-grid">
        <div className="stat-card"><span className="stat-icon mint" aria-hidden="true">▤</span><span className="stat-label">COURSES IN PROGRESS</span><strong>{enrollments.length}</strong><span className="stat-foot">Your learning journey</span></div>
        <div className="stat-card"><span className="stat-icon peach" aria-hidden="true">✳</span><span className="stat-label">YOUR ROLE</span><strong className="role-stat">Student</strong><span className="stat-foot">Your workspace is ready</span></div>
        <div className="stat-card stat-card-feature"><span className="stat-label">A NOTE TO SELF</span><strong>Curiosity looks<br />good on you.</strong><span className="stat-foot">Keep showing up.</span><span className="feature-sun" aria-hidden="true">✳</span></div>
      </div>
      <div className="section-heading">
        <div><p className="eyebrow">A PLACE TO BEGIN</p><h2>Picked for your next step</h2></div>
        <button className="text-button" onClick={onViewCourses}>View all courses <span aria-hidden="true">→</span></button>
      </div>
      <CourseList
        courses={courses.slice(0, 3)}
        enrolledIds={enrolledIds}
        canEnroll
        onEnroll={onEnroll}
        onUnenroll={onUnenroll}
        isLoading={isLoading}
      />
    </>
  );
}
