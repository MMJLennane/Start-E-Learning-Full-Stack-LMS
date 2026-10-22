import CourseList from "../components/CourseList.jsx";

export const permissions = { canEnroll: false, canManageCourses: true };

export default function TeacherDashboard({
  user,
  courses,
  enrolledIds,
  onViewCourses,
  onEnroll,
  onUnenroll,
  isLoading,
}) {
  const ownCourses = courses.filter((course) => course.teacher === user.id);
  const learnerCount = ownCourses.reduce((total, course) => total + course.enrollment_count, 0);

  return (
    <>
      <div className="welcome-row">
        <div>
          <p className="eyebrow">YOUR TEACHING, AT A GLANCE</p>
          <h1>Good to see you, {user.username} <span aria-hidden="true">✳</span></h1>
          <p className="muted">Share what you know and help learners take their next step.</p>
        </div>
        <button className="button button-primary" onClick={onViewCourses}>Explore the library <span aria-hidden="true">↗</span></button>
      </div>
      <div className="stats-grid">
        <div className="stat-card"><span className="stat-icon mint" aria-hidden="true">▤</span><span className="stat-label">YOUR COURSES</span><strong>{ownCourses.length}</strong><span className="stat-foot">Published by you</span></div>
        <div className="stat-card"><span className="stat-icon peach" aria-hidden="true">✳</span><span className="stat-label">LEARNERS</span><strong>{learnerCount}</strong><span className="stat-foot">Across your courses</span></div>
        <div className="stat-card stat-card-feature"><span className="stat-label">A NOTE TO SELF</span><strong>Knowledge grows<br />when shared.</strong><span className="stat-foot">Keep inspiring learners.</span><span className="feature-sun" aria-hidden="true">✳</span></div>
      </div>
      <div className="section-heading">
        <div><p className="eyebrow">A PLACE TO BEGIN</p><h2>Your courses</h2></div>
        <button className="text-button" onClick={onViewCourses}>View course library <span aria-hidden="true">→</span></button>
      </div>
      <CourseList
        courses={ownCourses.slice(0, 3)}
        enrolledIds={enrolledIds}
        canEnroll={false}
        onEnroll={onEnroll}
        onUnenroll={onUnenroll}
        isLoading={isLoading}
      />
    </>
  );
}
