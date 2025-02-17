import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom"; 
import axios from "axios";
import Login from "./pages/Login";
import Register from "./pages/Register"; 
import StudentDashboard from "./pages/StudentDashboard";
import LabRules from "./pages/Rules&Regulations";
import Reservation from "./pages/Reservation";
import StaffDashboard from "./pages/StaffDashboard";
import Record from "./pages/Record";
import ReservationSchedule from "./pages/Upcoming";
import StudentInfo from "./pages/Studentinfo";
import AdminDashboard from "./pages/AdminDashboard";
import PrivateRoute from "./pages/PrivateRoute"; 
import TypingAnimation from "./components/LoadingAnimation"; 

function App() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use((config) => {
      setLoading(true); 
      return config;
    });

    const responseInterceptor = axios.interceptors.response.use(
      (response) => {
        setLoading(false); 
        return response;
      },
      (error) => {
        setLoading(false); 
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  return (
    <>
      {loading && <TypingAnimation />}
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route path="/student-dashboard" element={<PrivateRoute role="student" Component={StudentDashboard} />} />
        <Route path="/rules-and-regulations" element={<PrivateRoute role="student" Component={LabRules} />} />
        <Route path="/reservation/calendar" element={<PrivateRoute role="student" Component={Reservation} />} />
        <Route path="/staff-dashboard" element={<PrivateRoute role="staff" Component={StaffDashboard} />} />
        <Route path="/record" element={<PrivateRoute role="staff" Component={Record} />} />
        <Route path="/upcoming/schedule" element={<PrivateRoute role="staff" Component={ReservationSchedule} />} />
        <Route path="/student/information" element={<PrivateRoute role="staff" Component={StudentInfo} />} />
        <Route path="/admin-dashboard" element={<PrivateRoute role="admin" Component={AdminDashboard} />} />
        
        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/login" />} />  
      </Routes>
    </>
  );
}

export default App;
