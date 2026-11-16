import CourseList from "./CourseList.jsx";

const coursePreviews = [
  {
    title: "Computer Hardware 101",
    description: "Understand PC components, upgrades, and safe assembly and repair.",
    label: "BUILD WITH CONFIDENCE",
  },
  {
    title: "Computer Science: Less Waste, Better Privacy",
    description: "Make computing more efficient and learn practical ways to protect personal information.",
    label: "SMARTER COMPUTING",
  },
  {
    title: "Night Vision and Low-Light Safety",
    description: "Explore how night-vision technology works, its limitations, and safe low-light practices.",
    label: "SEE THE BIG PICTURE",
  },
];

function TeacherContacts({ enrollments }) {
  const teachers = new Map();
  enrollments.forEach(({ course, teacher_email }) => {
    const key = course.teacher ?? teacher_email ?? course.teacher_name;
    const existing = teachers.get(key);
    if (existing) {
      existing.courses.push(course.title);
    } else {
      teachers.set(key, {
        name: course.teacher_name,
        email: teacher_email,
        courses: [course.title],
      });
    }
  });

  return (
    <section className="lounge-contact-card" aria-labelledby="teacher-contacts-title">
      <p className="eyebrow">YOUR LEARNING TEAM</p>
      <h2 id="teacher-contacts-title">Your teachers</h2>
      {teachers.size ? (
        <ul className="teacher-contact-list">
          {[...teachers.entries()].map(([key, teacher]) => (
            <li key={key}>
              <strong>{teacher.name}</strong>
              <span>{teacher.courses.join(", ")}</span>
              {teacher.email
                ? <a href={`mailto:${teacher.email}`}>{teacher.email}</a>
                : <span className="muted">Email not on file</span>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">Enroll in a course to see the contact details for its teacher here.</p>
      )}
    </section>
  );
}

export default function StudentLounge({
  courses,
  enrollments,
  enrolledIds,
  onEnroll,
  onUnenroll,
  isLoading,
}) {
  return (
    <div className="student-lounge">
      <section className="lounge-hero">
        <div className="lounge-copy">
          <p className="eyebrow">YOUR STUDENT LOUNGE</p>
          <h1>Settle in. Find your next spark.</h1>
          <p>Take a breather, explore the course library, and pick a new skill to make your own.</p>
          <div className="lounge-overview">
            <span><strong>{courses.length}</strong> courses to explore</span>
            <span><strong>{enrollments.length}</strong> in your learning list</span>
          </div>
        </div>
        <div className="lounge-illustration" role="img" aria-label="A cozy virtual couch and recliner with headphones and pizza">
          <span className="lounge-couch" aria-hidden="true">🛋️</span>
          <span className="lounge-recliner" aria-hidden="true">🪑</span>
          <span className="lounge-headphones" aria-hidden="true">🎧</span>
          <span className="lounge-pizza" aria-hidden="true">🍕</span>
        </div>
      </section>

      <div className="lounge-content-grid">
        <section className="lounge-previews" aria-labelledby="course-previews-title">
          <div className="section-heading lounge-section-heading">
            <div>
              <p className="eyebrow">A FEW IDEAS TO GET YOU STARTED</p>
              <h2 id="course-previews-title">Course previews</h2>
            </div>
          </div>
          <div className="preview-grid">
            {coursePreviews.map((course) => (
              <article className="preview-card" key={course.title}>
                <span className="preview-label">{course.label}</span>
                <h3>{course.title}</h3>
                <p>{course.description}</p>
              </article>
            ))}
          </div>
        </section>
        <TeacherContacts enrollments={enrollments} />
      </div>

      <section className="lounge-library" aria-labelledby="lounge-library-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">THE COURSE LIBRARY</p>
            <h2 id="lounge-library-title">Explore what's available</h2>
          </div>
        </div>
        <CourseList
          courses={courses}
          enrolledIds={enrolledIds}
          canEnroll
          onEnroll={onEnroll}
          onUnenroll={onUnenroll}
          isLoading={isLoading}
        />
      </section>
    </div>
  );
}
