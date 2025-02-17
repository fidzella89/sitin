import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const usernameRef = useRef(null);
  const passwordRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get("http://localhost:8000/auth/check-session", {
          withCredentials: true, // Ensure cookies are sent
        });
        // If the user is authenticated, redirect based on their role
        if (response.data.authenticated) {
          const user = response.data.user;
          if (user.role === "student") {
            navigate("/student-dashboard");
          } else if (user.role === "admin") {
            navigate("/admin-dashboard");
          } else if (user.role === "staff") {
            navigate("/staff-dashboard");
          }
        }
      } catch (error) {
        // If not authenticated, do nothing (stay on register)
        console.error("User is not authenticated");
      }
    };

    checkAuth();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:8000/auth/login",
        { username, password },
        { withCredentials: true } 
      );
  
      if (response.data.username) {
        const user = response.data;
  
        if (user.role === "student") {
          navigate("/student-dashboard", { state: { username: user.username } });
        } else if (user.role === "admin") {
          navigate("/admin-dashboard", { state: { username: user.username } });
        } else if (user.role === "staff") {
          navigate("/staff-dashboard", { state: { username: user.username } });
        }
      } else {
        setError("Invalid credentials. Please try again.");
      }
    } catch (error) {
      setError("Login failed. Please check your username and password.");
      console.error("Login error:", error);
    }
  };  

  return (
    <motion.div
      className="flex justify-center items-center min-h-screen bg-gradient-to-r from-green-400 to-blue-500"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <div className="bg-white p-8 rounded-lg shadow-lg w-96 transform hover:scale-105 transition-transform duration-500 ease-in-out">
        <h2 className="text-3xl font-bold text-center text-green-600 mb-4">Login</h2>
        <form onSubmit={handleLogin}>
          <input
            ref={usernameRef}
            className="w-full px-4 py-2 mb-3 border rounded focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            type="text"
            placeholder="Username"
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="off"
          />
          <input
            ref={passwordRef}
            className="w-full px-4 py-2 mb-3 border rounded focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            type="password"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
          <input type="hidden" name="username" value="username" />
          <input type="hidden" name="password" value="password" />
          {error && <p className="text-red-600 text-center mt-2">{error}</p>}

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition duration-300"
          >
            Login
          </button>
        </form>
        <div className="text-center mt-4">
          <motion.div whileHover={{ scale: 1.1 }}>
            <Link to="/register" className="text-green-600 hover:text-green-700">
              Don't have an account? Register here.
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
