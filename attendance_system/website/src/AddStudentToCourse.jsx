import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import Axios from 'axios';
import Select from 'react-select';
import makeAnimated from 'react-select/animated';
//صور الخلفية
import img_1 from './assets/1.jpg';
import img_2 from './assets/2.jpg';
import img_3 from './assets/3.jpg';
import img_4 from './assets/4.jpg';
import img_5 from './assets/5.jpg';

const AddStudentToCourse = () => {
  const { id } = useParams();
  const [course, setCourse] = useState({}); //تخزين معلومات الكورس
  const [error, setError] = useState('');
  const [students, setStudents] = useState([]); //قائمة الطلاب غير المسجلين في الكورس
  const [selectedStudents, setSelectedStudents] = useState([]); //الطلاب الذين تم اختيارهم لإضافتهم
  const [backgroundImage, setBackgroundImage] = useState('');//صورة الخلفية التي سيتم تعيينها بشكل عشوائي

  // Array of images  اختيار صورة عشوائية من مجموعة الصور
  const images = [img_1, img_2, img_3, img_4, img_5];

  // Set a random background on component mount
  useEffect(() => {
    const randomImage = images[Math.floor(Math.random() * images.length)];
    setBackgroundImage(randomImage);
  }, []); // Empty dependency array ensures it runs only once on mount

  // Fetch course details الطلاب غير المسجلين في الكورس
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await Axios.get(`http://localhost:8000/course/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        });
        setCourse(res.data);
      } catch (error) {
        console.error(error);
        setError(
          error.response?.data?.message || 'An error occurred while fetching the course'
        );
      }
    };
    fetchCourse();
  }, [id]);

  // Fetch students not already in the course
  useEffect(() => {
    Axios.get(`http://localhost:8000/get-students-not-in-course/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    })
      .then((res) => {
        setStudents(res.data);
      })
      .catch((error) => console.log(error));
  }, [course]);

  // Handle student selection تحديث الطلاب المختارين
  const handleStudentChange = (selectedOptions) => {
    setSelectedStudents(selectedOptions || []); // Store the full selected option objects
  };

  // Handle form submission إضافة الطلاب إلى الكوس
  const handleSubmit = async (e) => {
    e.preventDefault();
    const studentIds = selectedStudents.map((student) => student.value); // Extract IDs
    console.log(studentIds);

    try {
      await Axios.post(
        `http://localhost:8000/add-students-to-course/${id}`,
        { studentIds },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        }
      );
      alert('Students added successfully!');

      // Remove added students from the dropdown
      const updatedStudents = students.filter(
        (student) => !studentIds.includes(student._id)
      );
      setStudents(updatedStudents); // Update the students state

      setSelectedStudents([]); // Reset selection after submission
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to add students to the course.');
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
      }}
    >
      <div className="max-width py-4">
        {error ? (
          <h1 className="text-danger">{error}</h1>
        ) : (
          <>
            <div
              className="card p-4 m-auto shadow"
              style={{ maxWidth: '400px', width: '100%' }}
            >
              <form className="row" onSubmit={handleSubmit}>
                <h2 className="text-center mb-4 fs-5">
                  Add students to <span className="fw-bold"><a href={`/course/${course._id}`}>{course.course_name}</a></span>{' '}
                  ({course.course_number})
                  <p>Section number: {course.section_number}</p>
                </h2>
                <div className="col-12">
                  <label className="form-label">Students:</label>
                  <Select
                    required
                    isMulti
                    components={makeAnimated()}
                    options={students.map((student) => ({
                      value: student._id,
                      label: `${student.student_name} - ${student.student_number}`,
                    }))}
                    onChange={handleStudentChange}
                    value={selectedStudents}
                    className="basic-multi-select"
                    classNamePrefix="select"
                  />
                </div>
                <div className="col-12 mt-4">
                  <button type="submit" className="col-12 btn btn-primary">
                    Add Students
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AddStudentToCourse;