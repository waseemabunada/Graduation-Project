import { useEffect, useState } from 'react';
import Axios from 'axios';
import { useParams } from 'react-router';
import Session from './components/Session';
import Students_in_course from './components/Students_in_course';
import * as XLSX from 'xlsx';

const Course = () => {
  const [course, setCourse] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false); // for email loading
  const [minutes, setMinutes] = useState('');
  const [attendanceCount, setAttendanceCount] = useState('');
  const [filterDate, setFilterDate] = useState(''); // State for chosen date
  const [filteredSessions, setFilteredSessions] = useState([]); // State for filtered sessions
  const { id } = useParams();

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await Axios.get(`http://localhost:8000/course/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        });
        setCourse(response.data);
        setFilteredSessions(response.data.sessions || []); // Initialize filtered sessions
        console.log(response.data);
      } catch (error) {
        console.log(error);
        setError(error.response?.data?.message || 'Failed to fetch course details.');
      }
    };
    fetchCourse();
  }, [id]);

  const getDayClass = (day) => {
    const today = new Date().toLocaleString('en-US', { weekday: 'short' });
    return day === today ? 'current-day' : 'normal-day';
  };

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

  const handleMinutesChange = (e) => {
    setMinutes(e.target.value.trim());
  };

  const handleAttendanceCountChange = (e) => {
    setAttendanceCount(e.target.value.trim());
  };

  const handleFilterDateChange = (e) => {
    setFilterDate(e.target.value);
  };

  const applyDateFilter = () => {
    if (filterDate) {
      const filtered = course.sessions?.filter(session => 
        new Date(session.date).toISOString().slice(0, 10) === filterDate
      );
      setFilteredSessions(filtered || []);
    }
  };

  const clearDateFilter = () => {
    setFilterDate('');
    setFilteredSessions(course.sessions || []);
  };

  const startAttendanceSession = (e) => {
    e.preventDefault();
    setLoading(true);
    Axios.post(`http://localhost:8000/start-attendance/${course._id}`, { minutes, attendanceCount }, {
      headers: {
        'Content-Type': 'Application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    })
      .then(res => {
        setLoading(false);
        alert('Attendance session started successfully!');
        window.location.reload();
      })
      .catch(error => {
        console.log(error);
        setLoading(false);
        window.alert(error.response?.data?.message || 'Failed to start attendance session.');
      });
  };
  const sendWaningEmail = () => {
    setEmailLoading(true); // Set email loading to true when the process starts
    Axios.post(`http://localhost:8000/send-warning-email/${course._id}`, {}, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    })
      .then(() => {
        alert('Warning email sent successfully!');
        setEmailLoading(false); // Set email loading to false after success
      })
      .catch(error => {
        console.log(error);
        window.alert(error.response?.data?.message || 'Failed to send warning email.');
        setEmailLoading(false); // Set email loading to false after failure
      });
  };
  
  const downloadExcel = () => {
    const sessionRecords = [];
    course.sessions.forEach((session) => {
      const sessionDate = new Date(session.date).toLocaleString('en-US', {
        weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'UTC'
      });

      sessionRecords.push({ "Session Date": sessionDate, "Student Name": "", "Student Number": "", "Attendance Status": "", "Time of Attendance": "" });

      course.students.forEach((student) => {
        const attendance = session.attendance.find((a) => a.student === student._id);
        const attendanceStatus = attendance ? 'Present' : 'Absent';
        const attendanceTime = attendance ? new Date(attendance.time_of_attendance).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'N/A';

        sessionRecords.push({
          "Session Date": "",
          "Student Name": student.student_name,
          "Student Number": student.student_number,
          "Attendance Status": attendanceStatus,
          "Time of Attendance": attendanceTime,
          "Attendance Count": attendance ? attendance.attendance_count : "0",
        });
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(sessionRecords);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

    XLSX.writeFile(workbook, `${course.course_number}_${course.course_name}_${course.section_number}_attendance_report.xlsx`);
  };

  return (
    <div className="max-width py-4">
      {error ? <h1 className="text-danger">{error}</h1> : 
      <div className='course-container row w-100 gap-4'>
        <div className='col-8 custom-col-8 course_details'>
          <div className="course-header">
            <h1 className="course-title">
              {course.course_name} ({course.course_number})
            </h1>
            <p className="course-section mb-0">Section: {course.section_number}</p>
          </div>
          <div className="course-info">
            <p>
              <strong>Days:{' '}</strong> 
              {course.days?.map((day, index) => (
                <span key={index} className={getDayClass(day)}>
                  {day}
                  {index < course.days?.length - 1 && ', '}
                </span>
              ))}
            </p>
            <p>
              <strong>Start Time:</strong>{' '}
              {course.startAt 
                ? `${course.startAt} - ${calculateEndTime(course.startAt, course.duration_in_minutes)}`
                : 'N/A'}
            </p>
            <p>
              <strong>Duration:</strong> {course.duration_in_minutes} minutes
            </p>
            <p><a className='btn btn-outline-dark' href={`/add-students-to-course/${course._id}`}>Add students to course</a></p>
            <p className='d-flex gap-2'>
              <button className='btn btn-outline-primary' onClick={downloadExcel}>Download Attendance in Excel</button>
              <button 
                disabled={emailLoading} 
                className='btn btn-outline-danger' 
                onClick={sendWaningEmail}
              >
                {emailLoading ? (
                  <>
                    <div className="spinner-border spinner-border-sm" role="status"></div>
                    {" "} Sending...
                  </>
                ) : 'Send Warning Email for Students Absent 3 or More'}
              </button>
              </p>
            <form className='bg-white p-3' onSubmit={startAttendanceSession}>
              <div className="row">
                <div className='col-6'>
                  <input 
                    value={minutes} 
                    onChange={handleMinutesChange} 
                    required 
                    className='form-control mb-3' 
                    type="text" 
                    placeholder='Put Minutes for attendance...' 
                  />
                </div>
                <div className='col-6'>
                  <input 
                    value={attendanceCount} 
                    onChange={handleAttendanceCountChange} 
                    required 
                    className='form-control mb-3' 
                    type="number" 
                    placeholder='Number of attendance taken...' 
                  />
                </div>
              </div>
              <button 
                disabled={loading} 
                className='btn btn-outline-success' 
              >
                {loading ? (
                  <>
                    <div className="spinner-border spinner-border-sm" role="status"></div>
                    {" "} Loading...
                  </>
                ) : 'Start Attendance Session'}
              </button>
            </form>
          </div>
        </div>
        <Students_in_course students={course.students} sessions={course.sessions} />
      </div>
      }
      <div className="row col-7 my-4 gap-3">
        <h3>Filter Attendance Sessions</h3>
        <input
          type="date"
          className="form-control"
          value={filterDate}
          onChange={handleFilterDateChange}
          placeholder="Filter sessions by date"
        />
        <div className='p-0 d-flex gap-2'>
          <button className="btn btn-outline-primary" onClick={applyDateFilter}>Apply Filter</button>
          <button className="btn btn-outline-secondary" onClick={clearDateFilter}>Clear Filter</button>
        </div>
      </div>
      <div className='sessions mt-4 row w-100'>
        {filteredSessions?.length > 0 ?
          filteredSessions?.map((session) => (
            <Session session={session} studentsInCourse={course.students} key={session._id} />
          ))
        : <h3 className='text-danger'>No attendance sessions found for this course yet...</h3>}
      </div>
    </div>
  );
};

export default Course;