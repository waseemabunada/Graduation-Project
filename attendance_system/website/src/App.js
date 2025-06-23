import React, { lazy, Suspense, useEffect, useState, useContext } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation, useNavigate } from 'react-router-dom';

import Login from './Login'
import Register from './Register'
import Home from './Home'
import NewCourse from './NewCourse';
import Course from './Course';
import NewStudent from './newStudent';
import AddStudentToCourse from './AddStudentToCourse';
import Notfound from './Notfound';
import Students from './Students';

import NavigationBar from './components/NavigationBar';
import NewFingerPrint from './NewFingerPrint';

const App = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const showNavbar = location.pathname !== '/login' && location.pathname !== '/register';

    useEffect(() => {
      const token = localStorage.getItem('token');
      const isLoginOrRegisterPage = ['/login', '/register'].includes(location.pathname);
      if (!localStorage.getItem('token') && location.pathname !== '/register') {
        return navigate('/login');
      }
    }, [navigate, location.pathname]);
      
  return (
    <>
      {showNavbar && <NavigationBar />}
        <Routes>
            <Route path="/" exact element={<Home />} />
            <Route path="/register" element={<Register /> } />
            <Route path="/login" element={<Login /> } />
            <Route path="/students" element={<Students /> } />
            <Route path="/add-course" element={<NewCourse /> } />
            <Route path="/add-student" element={<NewStudent /> } />
            <Route path="/add-fingerprint" element={<NewFingerPrint /> } />
            <Route path="/add-students-to-course/:id" element={<AddStudentToCourse /> } />
            <Route path="/course/:id" element={<Course /> } />
            <Route path="*" element={<Notfound /> } />
        </Routes>
    </>
  )
}

export default App