import { useState, useEffect } from 'react';
import Axios from 'axios';

const Home = () => {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    Axios.get('http://localhost:8000/my-courses', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    })
      .then((res) => {
        setCourses(res.data);
        console.log(res.data); // Debugging course data
      })
      .catch((error) => console.log(error));
  }, []);

  const calculateEndTime = (startAt, duration) => {
    const [hours, minutes] = startAt.split(':').map(Number);
    const endTime = new Date();
    endTime.setHours(hours);
    endTime.setMinutes(minutes + duration);

    if (endTime.getMinutes() >= 60) {
      endTime.setHours(endTime.getHours() + Math.floor(endTime.getMinutes() / 60));
      endTime.setMinutes(endTime.getMinutes() % 60);
    }

    return endTime.toTimeString().slice(0, 5);
  };

  const isCourseRunning = (course) => {
    const now = new Date();
    const currentDay = now.toLocaleString('en-US', { weekday: 'short' });
    const currentTime = now.toTimeString().slice(0, 5);

    if (!course.days.includes(currentDay)) return false;

    const courseEndTime = calculateEndTime(course.startAt, course.duration_in_minutes);

    if (courseEndTime < course.startAt) {
      return (
        (currentTime >= course.startAt && currentTime <= '23:59') ||
        (currentTime >= '00:00' && currentTime <= courseEndTime)
      );
    }

    return course.startAt <= currentTime && currentTime <= courseEndTime;
  };

  const getDayClass = (day) => {
    const today = new Date().toLocaleString('en-US', { weekday: 'short' });
    return day === today ? 'current-day' : 'normal-day';
  };

  const deleteCourse = (courseId) => {
    const isConfirm = window.confirm('Are you sure you want to delete this course?');
    if (!isConfirm) return;
    Axios.delete(`http://localhost:8000/delete-course/${courseId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    })
    .then(() => {
        alert('Course deleted successfully!');
        setCourses(courses.filter((c) => c._id!== courseId));
      })
      .catch((error) => console.log(error));
  }
  return (
    <div className="max-width py-4">
      {courses.length > 0 ? (
        <>
          <h1 className="mb-4">My Courses</h1>
          <div className="course-list row gap-3">
            {courses.map((course) => {
              const endTime = calculateEndTime(course.startAt, course.duration_in_minutes);
              return (
                <div
                  key={course._id}
                  className={`col-12 col-md-5 course-item ${
                    isCourseRunning(course) ? 'running' : 'not-running'
                  }`}
                >
                  <h3>{course.course_name}</h3>
                  <p>Course Number: {course.course_number}</p>
                  <p>
                    Days:{' '}
                    {course.days.map((day, index) => (
                      <span key={index} className={getDayClass(day)}>
                        {day}
                        {index < course.days.length - 1 && ', '}
                      </span>
                    ))}
                  </p>
                  <p>
                    Start Time: {course.startAt} - {endTime}
                  </p>
                  <p>Duration: {course.duration_in_minutes} minutes</p>
                  <div className='d-flex gap-2 mb-3'>
                    <a className='btn btn-outline-dark' href={`course/${course._id}`}>View course</a>
                    <a className='btn btn-outline-dark' href={`add-students-to-course/${course._id}`}>Add students to the course</a>
                  </div>
                  <button className='btn btn-outline-danger' onClick={() => deleteCourse(course._id)}>Delete course</button>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <h1 className="text-danger">You don't have any courses...</h1>
      )}
    </div>
  );
};

export default Home;