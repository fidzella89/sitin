import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import TypingAnimation from "../components/LoadingAnimation"; 
import axios from "axios";

const PrivateRoute = ({ role, Component }) => {
  const [auth, setAuth] = useState({ isAuthenticated: false, userRole: null, username: "" });
  const [loading, setLoading] = useState(true);
  const location = useLocation(); 

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get("http://localhost:8000/auth/check-session", {
          withCredentials: true, 
        });

        if (response.data.authenticated) {
          setAuth({ 
            isAuthenticated: true, 
            userRole: response.data.user.role, 
            username: response.data.user.username 
          });
        } else {
          setAuth({ isAuthenticated: false, userRole: null, username: "" });
        }
      } catch (error) {
        setAuth({ isAuthenticated: false, userRole: null, username: "" });
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return <TypingAnimation />;
  }

  // 1. If authenticated and trying to access /login or /register, redirect to their dashboard.
  if (auth.isAuthenticated && (location.pathname === "/login" || location.pathname === "/register")) {
    if (auth.userRole === "student") return <Navigate to="/student-dashboard" />;
    if (auth.userRole === "staff") return <Navigate to="/staff-dashboard" />;
    if (auth.userRole === "admin") return <Navigate to="/admin-dashboard" />;
  }

  // 2. If not authenticated and trying to access any route other than /login or /register, redirect to /login.
  if (!auth.isAuthenticated && (location.pathname !== "/login" && location.pathname !== "/register")) {
    return <Navigate to="/login" />;
  }

  // 3. For authenticated users, if they try to access a route that isn't allowed for their role, redirect them accordingly.
  if (auth.isAuthenticated) {
    if (auth.userRole === "student" &&
        !["/student-dashboard", "/rules-and-regulations", "/reservation/calendar"].includes(location.pathname)) {
      return <Navigate to="/student-dashboard" />;
    }
    if (auth.userRole === "staff" && !["/staff-dashboard", "/record", "/upcoming/schedule", "/student/information"].includes(location.pathname)) {
      return <Navigate to="/staff-dashboard" />;
    }
    if (auth.userRole === "admin" && location.pathname !== "/admin-dashboard") {
      return <Navigate to="/admin-dashboard" />;
    }
  }

  // Otherwise, render the intended component.
  return <Component />;
};

export default PrivateRoute;
