import {useState} from 'react'
import Axios from 'axios' //http
import {useParams} from 'react-router-dom' //url
const Session = ({session, studentsInCourse}) => {
  const [fingerPrintSessionLoading, setFingerPrintSessionLoading] = useState(false);
  const id = useParams().id; //استخراج id من الرابط

  //  تتحقق من حالة الحضور بناءً على الوقت المحدد
  const checkAttendanceStatus = (attendanceTime) => {
    if (!attendanceTime) return 'absent'; // Absent
  
    const sessionStart = new Date(session.date); // Assuming session.date is a valid date string
    const attendanceDate = new Date(attendanceTime);
  
    // Calculate the difference in milliseconds
    const diffMilliseconds = attendanceDate - sessionStart;
  
    // Convert milliseconds to minutes
    const diffInMinutes = Math.floor(diffMilliseconds / 60000); // Use Math.floor to round down
    
    // Check attendance status
    if (diffInMinutes >= 10) {
      return 'late'; // Late
    } else {
      return 'present'; // On time
    }
  };

  // time minutes
  const [minutes, setMinutes] = useState('');
  const handleMinutesChange = (e) => {
    setMinutes(e.target.value.trim());
  }
  //إرسال طلب POST إلى الخادم على العنوان
  const RegsiterAttendance = (e) => {
    e.preventDefault();
    setFingerPrintSessionLoading(true);
    Axios.post(`http://localhost:8000/register-attendance/${id}/${session._id}`, {minutes}, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'Application/json'
      },
    })
     .then((res) => {
      setFingerPrintSessionLoading(false);
      console.log(res.data);
      alert(res.data.message); // عرض رسالة من الخادم
      window.location.reload();  // إعادة تحميل الصفحة
      })
      .catch((error) => {
        window.alert(error.response.data.message || 'Failed to get attendance from fingerprint');
        setFingerPrintSessionLoading(false); // إيقاف التحميل في حالة الفشل
      }
    );
  }
  //حذف المحاضرة 
  const delete_session = (course_id, session_id) => {
    const isConfirm = window.confirm(`Are you sure you want to remove the session?`);
    if (!isConfirm) return; //إذا رفض المستخدم، لا يتم الحذف
    console.log(course_id, session_id);
    Axios.delete(`http://localhost:8000/session/${course_id}/${session_id}`)
    .then(() => {
      alert('Session deleted successfully');
      window.location.reload();  // إعادة تحميل الصفحة بعد الحذف
    })
    .catch((err) => {
      console.log(err);
      alert(err.response?.data?.error || 'Error while deleteing session')
    })
  }
  return (
    <div className='session'>
    <div className='mb-3'>
      <button className='btn btn-outline-danger' onClick={() => delete_session(id, session._id)}>
        Delete Session
      </button>
    </div>
    <form className='bg-white my-3 p-3' onSubmit={RegsiterAttendance}>
      <input value={minutes} onChange={handleMinutesChange} required className='form-control mb-3' type="text" placeholder='Put Minutes for fingerprint attendance...' />
      <button disabled={fingerPrintSessionLoading} className='btn btn-outline-primary mb-3'>
      {fingerPrintSessionLoading ? ( // عرض زر التحميل أثناء الانتظار
          <>
            <div className="spinner-border spinner-border-sm" role="status"></div>
            {" "} Loading...
          </>
        ) : 'Get attendance from fingerprint'}
      </button>
    </form>
      <h5>Session date: <span className='text-primary'>{new Date(session.date).toLocaleString('en-US', { timeZone: 'UTC' ,year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric'})}</span></h5>
      <p>Session attendance: {session.attendance.length}/{studentsInCourse.length}, <span className='fw-bold'>{(((session.attendance.length / studentsInCourse.length) || 0) * 100).toFixed(2) || 0}% of students</span></p>
      {session.attendance.length === 0 && <h3 className='text-danger'>No students attended this session.</h3> }
      {session.attendance.length > 0 && <h5>Students:</h5>}
      <div className='d-flex flex-column gap-3'>
        {studentsInCourse.map((student) => {
          const attendance = session.attendance.find((att) => att.student === student._id);          
          const attendanceStatus = checkAttendanceStatus(attendance?.time_of_attendance);
          return (
            <li key={student._id}>
              <div key={student._id} className={`student-card ${attendanceStatus}`} style={{background: attendanceStatus}}>
                <div className='d-flex gap-2'>
                  <img src={`http://localhost:8000/students/${student.student_image}`} alt={`${student.student_number} image`} />
                  <div>
                      <h5 className='mb-0'>{student.student_name}</h5>
                      <p className='mb-0'>{student.student_number} - <span className='attend_status'>{attendanceStatus}</span></p>
                  </div>
                </div>
                <div>
                  {attendanceStatus === 'late' && <div className='late-info'>Late by {(Math.floor(new Date(attendance.time_of_attendance) - (new Date(session.date))) / 60000).toFixed(0)} minutes</div>}
                </div>
                <p className='mt-2 mb-0'>Attendance Count: {attendance?.attendance_count || 0}/{session.attendance_max_count}</p>
              </div>
            </li>
          );
        })}
      </div>
      {/* </>} */}
    </div>
  )
}

export default Session
