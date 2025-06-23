import React, { useState } from 'react';
import Axios from 'axios';
import { useParams } from 'react-router-dom';

const Students_in_course = ({ students, sessions }) => {
  const id = useParams().id;// يحصل على الاي دي الدورة من عنوان الرابط.

  const [showModal, setShowModal] = useState(false); // يتحكم في ظهور النافذة المنبثقة لعرض كل الطلاب

  const calculateAttendance = (studentId) => { // تحسب عدد المرات التي حضر فيها الطالب الجلسات
    let attendanceCount = 0;
    sessions.forEach((session) => {  // تمر على كل جلسة.
      session.attendance.forEach((record) => {
        if (record.student === studentId) {  // تبحث عن السجلات المرتبطة بالطالب
          attendanceCount++; // تزيد العدد إذا وجد الطالب في الجلسة
        }
      });
    });
    return attendanceCount; // تعيد العدد النهائي للحضور
  };

  const Exceeded_the_allowed_absence = (studentId, totalSessions) => { // تتحقق إذا كان الطالب تجاوز الحد المسموح به من الغياب
    const attendance_count = calculateAttendance(studentId); // تحسب عدد مرات الحضور
    if (totalSessions - attendance_count >= 3) return 'exceeded'; // إذا كان الغياب 3 أو أكثر، تُرجع exceeded
    return '';
  };

  const Remove_student_from_course = (student) => {  // حذف الطالب من الدورة
    const isConfirm = window.confirm(`Are you sure you want to remove (${student.student_name}) from this course?`);
    if (!isConfirm) return;
    Axios.delete(`http://localhost:8000/delete-student-from-course/${id}?student_id=${student._id}`, {  // يرسل طلب حذف إلى الخادم.
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    })
      .then(() => {
        alert('Student removed successfully!');
        window.location.reload();
      })
      .catch((error) => {
        console.error('Error removing student from course:', error); // يعرض أي خطأ في وحدة التحكم.
      });
  };

  return (
    <div className="col-4 student_col">
      {students?.length > 0 ? (
        <>
          <h2>Students ({students?.length})</h2>
          <div className="d-flex flex-column gap-4 student_list">
            {students.slice(0, 5).map((student) => (
              <div className={`${Exceeded_the_allowed_absence(student._id, sessions.length)}`} key={student._id}>
                <div className="student-card">
                  <img
                    src={`http://localhost:8000/students/${student.student_image}`}
                    alt={`${student.student_number} image`}
                  />
                  <div>
                    <h5 className="mb-0">{student.student_name}</h5>
                    <p className="mb-0">{student.student_number}</p>
                  </div>
                </div>
                <p className="m-0">Attendance: {calculateAttendance(student._id)} / {sessions.length}</p>
                <button className="btn btn-danger mt-2" onClick={() => Remove_student_from_course(student)}>
                  Remove student from course
                </button>
              </div>
            ))}
          </div>
          {/* Show More Button */}
            <button
              className="btn btn-outline-primary mt-3"
              onClick={() => setShowModal(true)}
            >
              Show More
            </button>
        </>
      ) : (
        <h3 className="text-danger">No student in this course yet...</h3>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className='mb-3 d-flex align-items-center justify-content-between'>
              <h3 className='mb-0'>All Students ({students.length})</h3>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Close</button>
            </div>
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Attendance</th>
                  <th>Control</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student._id}>
                    <td>
                      <img
                        src={`http://localhost:8000/students/${student.student_image}`}
                        alt={`${student.student_number} image`}
                        style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                      />
                    </td>  
                    <td>{student.student_name}</td>
                    <td>{student.student_email}</td>
                    <td>{student.student_number}</td>
                    <td className='d-flex align-items-center gap-2'>
                      {calculateAttendance(student._id)} / {sessions.length}{" "}
                      {sessions.length - calculateAttendance(student._id) >= 3 ? (
                        <img width="25" height="25" src="https://img.icons8.com/fluency/48/general-warning-sign.png" alt="general-warning-sign"/> // Warning sign in orange
                      ) : (
                        ""
                      )}
                    </td>
                    <td>
                      <button className="btn btn-danger mt-2" onClick={() => Remove_student_from_course(student)}>
                        Remove from course
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students_in_course;
