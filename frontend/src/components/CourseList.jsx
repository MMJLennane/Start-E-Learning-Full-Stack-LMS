function CourseCard({ course, isEnrolled, canEnroll, onEnroll, onUnenroll }) {
  return (
    <article className="course-card">
      <div className="course-art" aria-hidden="true">
        <span>{course.title.slice(0, 1).toUpperCase()}</span>
      </div>
      <div className="course-content">
        <div className="course-meta">
          <span className="course-tag">SELF-PACED</span>
          {isEnrolled && <span className="enrolled-tag">ENROLLED</span>}
        </div>
        <h3>{course.title}</h3>
        <p>{course.description}</p>
        <div className="course-footer">
          <span className="teacher-name">with {course.teacher_name}</span>
          {canEnroll && (
            <button
              className={`button ${isEnrolled ? "button-quiet" : "button-outline"}`}
              onClick={() => (isEnrolled ? onUnenroll(course.id) : onEnroll(course.id))}
            >
              {isEnrolled ? "Leave course" : "Explore course"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export default function CourseList({
  courses,
  enrolledIds,
  canEnroll,
  onEnroll,
  onUnenroll,
  isLoading,
}) {
  if (isLoading) return <p className="empty-state">Loading courses…</p>;
  if (courses.length === 0) {
    return <p className="empty-state">No courses here just yet. Check back soon for a new place to start.</p>;
  }
  return (
    <div className="course-grid">
      {courses.map((course) => (
        <CourseCard
          key={course.id}
          course={course}
          isEnrolled={enrolledIds.has(course.id)}
          canEnroll={canEnroll}
          onEnroll={onEnroll}
          onUnenroll={onUnenroll}
        />
      ))}
    </div>
  );
}
