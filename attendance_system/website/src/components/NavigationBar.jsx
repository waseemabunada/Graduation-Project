import { useNavigate } from 'react-router-dom';
import Axios from 'axios';

const NavigationBar = () => {
  const navigate = useNavigate(); // للتنقل بين الصفحات


  const handleLogout = () => {
    localStorage.clear(); // مسح بيانات المستخدم من localStorage
    navigate('/login'); // التنقل إلى صفحة تسجيل الدخول بعد الخروج
  }
  return (
    <nav className="navbar navbar-expand-lg bg-dark navbar-dark">
      <div className="max-width py-2  d-flex justify-content-between">
          <a className="navbar-brand" href="/">Attendance System</a>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav">
                <li className="nav-item"><a className="nav-link" href="/add-student">Add student to the system</a></li>
                <li className="nav-item"><a className="nav-link" href="/add-course">Add new course</a></li>
                <li className="nav-item"><a className="nav-link" href="/add-fingerprint">Add new fingerprint</a></li>
                <li className="nav-item"><a className="nav-link" href="/students">Students on system</a></li>
            </ul>
          </div>
          <div>
            <button onClick={handleLogout} className="btn btn-outline-danger">Logout</button>
          </div>
      </div>
    </nav>
  );
}

export default NavigationBar;