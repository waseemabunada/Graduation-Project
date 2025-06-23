import { useState, useEffect } from 'react';
import Axios from 'axios';
import img_1 from './assets/1.jpg';
import img_2 from './assets/2.jpg';
import img_3 from './assets/3.jpg';
import img_4 from './assets/4.jpg';
import img_5 from './assets/5.jpg';

const NewFingerPrint = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    user_id: '',
    name: '',
    university_id: '',
  });
  const [loadingMessage, setLoadingMessage] = useState('');
  const [backgroundImage, setBackgroundImage] = useState('');

  // Array of images
  const images = [img_1, img_2, img_3, img_4, img_5];

  // Set a random background on component mount
  useEffect(() => {
    const randomImage = images[Math.floor(Math.random() * images.length)];
    setBackgroundImage(randomImage);
  }, []); // Empty dependency array to run only once on component mount

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value.trimStart() });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Client-side validation
    if (formData.user_id < 1 || formData.user_id > 100) {
      alert('ID must be between 1 and 100.');
      return;
    }

    setLoading(true);
    setLoadingMessage('Please put your finger');

    // Make API request
    try {
      const response = await Axios.post('http://localhost:8000/add-fingerprint', formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      alert('Fingerprint data added successfully!');
      console.log(response.data);
      setLoading(false);
      setLoadingMessage('');

      // Reset form fields after successful submission
      setFormData({
        user_id: '',
        name: '',
        university_id: '',
      });
    } catch (err) {
      console.error('Error adding fingerprint data:', err);
      setLoading(false);
      setLoadingMessage('');
      alert(err.response?.data?.message || 'An error occurred while adding the fingerprint data.');
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
      <div className="card p-4 m-auto shadow" style={{ maxWidth: '400px', width: '100%' }}>
        <h2 className="text-center mb-4">Add New Fingerprint</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">User ID</label>
            <input
              type="text"
              name="user_id"
              className="form-control"
              value={formData.user_id}
              min={1}
              max={100}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Student Name</label>
            <input
              type="text"
              name="name"
              className="form-control"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Student Number</label>
            <input
              type="number"
              name="university_id"
              className="form-control"
              value={formData.university_id}
              onChange={handleChange}
              required
            />
          </div>

          {/* Show the loading message only when loading is true */}
          {loading && <p>{loadingMessage}</p>}

          <p>
            <button disabled={loading} className="btn btn-primary w-100 mt-4" type="submit">
              {loading ? (
                <>
                  <div className="spinner-border spinner-border-sm" role="status"></div> Loading...
                </>
              ) : (
                'Add new fingerprint'
              )}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default NewFingerPrint;