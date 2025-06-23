import { useState, useEffect } from 'react';
import Axios from 'axios';
import img_1 from './assets/1.jpg';
import img_2 from './assets/2.jpg';
import img_3 from './assets/3.jpg';
import img_4 from './assets/4.jpg';
import img_5 from './assets/5.jpg';

const NewStudent = () => {
  const [studentName, setStudentName] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [email, setEmail] = useState('');
  const [file, setFile] = useState(null);
  const [backgroundImage, setBackgroundImage] = useState('');

  // Array of images
  const images = [img_1, img_2, img_3, img_4, img_5];

  // Set a random background on component mount
  useEffect(() => {
    const randomImage = images[Math.floor(Math.random() * images.length)];
    setBackgroundImage(randomImage);
  }, []); // Empty dependency array ensures it runs only once on mount

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('student_name', studentName);
    formData.append('student_number', studentNumber);
    formData.append('student_email', email);
    formData.append('file', file);

    try {
      const response = await Axios.post('http://localhost:8000/add-student', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      alert('Student added successfully!');
      console.log(response.data);

      // Reset form fields after successful submission
      setStudentName('');
      setStudentNumber('');
      setEmail('');
      setFile(null);
      e.target.reset();
    } catch (err) {
      console.error('Error adding student:', err);
      alert(err.response?.data?.message || 'An error occurred while adding the student.');
    }
  };

  return (
    <div
      className="py-4"
      style={{
        backgroundImage: `linear-gradient(to bottom right, rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div className="card p-4 m-auto shadow" style={{ maxWidth: '400px', width: '100%' }}>
        <h2 className="text-center mb-4">Add New Student</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Student Name</label>
            <input
              type="text"
              className="form-control"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Student Number</label>
            <input
              type="number"
              className="form-control"
              value={studentNumber}
              onChange={(e) => setStudentNumber(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Student Image</label>
            <input
              type="file"
              className="form-control"
              onChange={handleFileChange}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary w-100">
            Add Student
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewStudent;