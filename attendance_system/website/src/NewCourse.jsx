import { useState, useEffect } from 'react';
import Axios from 'axios';
import Select from 'react-select';
import makeAnimated from 'react-select/animated';
import img_1 from './assets/1.jpg';
import img_2 from './assets/2.jpg';
import img_3 from './assets/3.jpg';
import img_4 from './assets/4.jpg';
import img_5 from './assets/5.jpg';

// قائمة الأيام لاختيار أيام الدورة.
const NewCourse = () => {
  const [days] = useState([
    { value: 'Sat', label: 'Saturday' },
    { value: 'Sun', label: 'Sunday' },
    { value: 'Mon', label: 'Monday' },
    { value: 'Tue', label: 'Tuesday' },
    { value: 'Wed', label: 'Wednesday' },
    { value: 'Thu', label: 'Thursday' },
    { value: 'Fri', label: 'Friday' },
  ]);

  const [formData, setFormData] = useState({
    course_name: '',
    course_number: '',
    startAt: '',
    duration_in_minutes: '',
    section_number: '',
    days: [],
  });

  const [backgroundImage, setBackgroundImage] = useState('');

  // Array of images
  const images = [img_1, img_2, img_3, img_4, img_5];

  // Set a random background on component mount
  useEffect(() => {
    const randomImage = images[Math.floor(Math.random() * images.length)];
    setBackgroundImage(randomImage);
  }, []); // Empty dependency array ensures it runs only once on mount

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
// تحديث الأيام عند تغيير القائمة المختارة.
  const handleDaysChange = (selectedOptions) => {
    setFormData({
      ...formData,
      days: selectedOptions ? selectedOptions.map((option) => option.value) : [],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await Axios.post('http://localhost:8000/add-course', formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      alert('Course created successfully!');
      setFormData({
        course_name: '',
        course_number: '',
        startAt: '',
        duration_in_minutes: '',
        section_number: '',
        days: [],
      });
      e.target.reset();
    } catch (error) {
      alert(error.response?.data?.message || 'An error occurred while creating the course.');
      console.error(error);
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
      <div className="card shadow m-auto p-4" style={{ maxWidth: '650px', width: '100%' }}>
        <h2 className="text-center mb-4">Create New Course</h2>
        <form onSubmit={handleSubmit}>
          <div className="row mb-4 row-gap-2">
            <div className="col-md-6">
              <label className="form-label">Course Name:</label>
              <input
                type="text"
                name="course_name"
                className="form-control"
                value={formData.course_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Course Number:</label>
              <input
                type="text"
                name="course_number"
                className="form-control"
                value={formData.course_number}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="row mb-4 row-gap-2">
            <div className="col-md-6">
              <label className="form-label">Start Time:</label>
              <input
                type="time"
                name="startAt"
                className="form-control"
                value={formData.startAt}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Duration (minutes):</label>
              <input
                type="number"
                name="duration_in_minutes"
                className="form-control"
                value={formData.duration_in_minutes}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="row mb-4 row-gap-2">
            <div className="col-md-6">
              <label className="form-label">Days:</label>
              <Select
                required
                isMulti
                components={makeAnimated()}
                options={days}
                onChange={handleDaysChange}
                value={days.filter((day) => formData.days.includes(day.value))}
                className="basic-multi-select"
                classNamePrefix="select"
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Section Number:</label>
              <input
                type="number"
                name="section_number"
                className="form-control"
                value={formData.section_number}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-100">
            Create Course
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewCourse;