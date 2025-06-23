import { useState, useEffect } from 'react';
import axios from 'axios';
import img_1 from './assets/1.jpg';
import img_2 from './assets/2.jpg';
import img_3 from './assets/3.jpg';
import img_4 from './assets/4.jpg';
import img_5 from './assets/5.jpg';

const Register = () => {
  const [financialNumber, setFinancialNumber] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [backgroundImage, setBackgroundImage] = useState('');

  // Array of images
  const images = [img_1, img_2, img_3, img_4, img_5];

  // Set a random background on component mount
  useEffect(() => {
    const randomImage = images[Math.floor(Math.random() * images.length)];
    setBackgroundImage(randomImage);
  }, []); // Empty dependency array ensures it runs only once on mount

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:8000/register', { email, financialNumber, password });
      alert('Lecturer registered successfully');
      setEmail('');
      setFinancialNumber('');
      setPassword('');
    } catch (error) {
      alert(error.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div
      className="auth_bg"
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
      <form onSubmit={handleSubmit} className="register-form" style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Register</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="form-control mb-3"
          required
        />
        <input
          type="text"
          placeholder="Financial Number"
          value={financialNumber}
          onChange={(e) => setFinancialNumber(e.target.value)}
          className="form-control mb-3"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="form-control mb-3"
          required
        />
        <button type="submit" className="btn btn-primary w-100">Register</button>
        <p style={{ textAlign: 'center', marginTop: '10px' }}>
          Already have an account? <a href="/login">Login</a>
        </p>
      </form>
    </div>
  );
};

export default Register;