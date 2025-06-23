import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import axios from 'axios';
import img_1 from './assets/1.jpg';
import img_2 from './assets/2.jpg';
import img_3 from './assets/3.jpg';
import img_4 from './assets/4.jpg';
import img_5 from './assets/5.jpg';

const Login = () => {
  const navigate = useNavigate();
  const [financialNumber, setFinancialNumber] = useState('');
  const [password, setPassword] = useState('');
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
      const res = await axios.post('http://localhost:8000/login', { financialNumber, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('lecturer', res.data.lecturer);
      alert('Logged in successfully');
      navigate('/');
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || 'Login failed');
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
      <form onSubmit={handleSubmit} className="login-form" style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Login</h2>
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
        <button type="submit" className="btn btn-primary w-100">Login</button>
        <p style={{ textAlign: 'center', marginTop: '10px' }}>
          Don't have an account? <a href="/register">Register</a>
        </p>
      </form>
    </div>
  );
};

export default Login;