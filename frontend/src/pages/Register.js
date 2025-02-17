import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom"; 
import axios from "axios";
import { motion } from "framer-motion";

export default function Register() {
  const [idno, setIdno] = useState("");
  const [lastname, setLastname] = useState("");
  const [firstname, setFirstname] = useState("");
  const [midname, setMidname] = useState("");
  const [yearLevel, setYearLevel] = useState("");
  const [course, setCourse] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");  
  const [showModal, setShowModal] = useState(false);  
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
  
  useEffect(() => {
    const newId = Math.floor(Math.random() * 1000000);
    setIdno(newId);
    setUsername(newId.toString());  // Username same as ID
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setEmailError("");  
  
    try {
      const response = await axios.post("http://localhost:8000/register/", {
        idno: parseInt(idno),
        lastname: lastname.trim(),
        firstname: firstname.trim(),
        midname: midname ? midname.trim() : null,
        course: course.trim(),
        yearlevel: parseInt(yearLevel),
        email: email.trim(),
        username: username.trim(),
        password: password,
      }, {
        headers: { "Content-Type": "application/json" },
      });
  
      if (response.data.message) {
        navigate("/login");
      } else if (response.data.error === "name_exists") {
        setShowModal(true);
      } else if (response.data.error === "email_exists") {
        setEmailError(response.data.message);
      }
    } catch (error) {
      console.error("Registration error:", error);
      alert("Error registering user. Please check your input.");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold text-center text-green-600 mb-4">
          Register
        </h2>
        <form onSubmit={handleRegister}>
          <h1>Student ID No. {idno}</h1>
          
          <label className="block text-gray-700 font-medium mb-2">*Firstname</label>
          <input
            className="w-full px-3 py-2 mb-3 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            type="text"
            placeholder="Firstname"
            value={firstname}
            onChange={(e) => setFirstname(e.target.value)}
            required
          />

          <label className="block text-gray-700 font-medium mb-2">Middle Name: (Optional)</label>
          <input
            className="w-full px-3 py-2 mb-3 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            type="text"
            placeholder="Midname"
            value={midname}
            onChange={(e) => setMidname(e.target.value)}
          />

          <label className="block text-gray-700 font-medium mb-2">*Lastname:</label>
          <input
            className="w-full px-3 py-2 mb-3 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            type="text"
            placeholder="Lastname"
            value={lastname}
            onChange={(e) => setLastname(e.target.value)}
            required
          />

          <label className="block text-gray-700 font-medium mb-2">*Email</label>
          <input
            className={`w-full px-3 py-2 mb-3 border rounded focus:outline-none focus:ring-2 ${
              emailError ? "border-red-500" : "focus:ring-green-500"
            }`}
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {emailError && <p className="text-red-500 text-sm">{emailError}</p>}

          <h1>Username: {username}</h1>

          <label className="block text-gray-700 font-medium mb-2">*Course</label>
          <select
            className="w-full px-3 py-2 mb-3 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            value={course}
            onChange={(e) => {
              setCourse(e.target.value);
              setYearLevel(""); 
            }}
            required
          >
            <option value="">Select Course</option>
            <option value="BSIT">Bachelor of Science in Information Technology (BSIT)</option>
            <option value="BSCS">Bachelor of Science in Computer Science (BSCS)</option>
            <option value="BSCE">Bachelor of Science in Civil Engineering (BSCE)</option>
            <option value="BSEE">Bachelor of Science in Electrical Engineering (BSEE)</option>
            <option value="BSBA">Bachelor of Science in Business Administration (BSBA)</option>
          </select>

          <label className="block text-gray-700 font-medium mb-2">*Year Level</label>
          <select
            className="w-full px-3 py-2 mb-3 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            value={yearLevel}
            onChange={(e) => setYearLevel(e.target.value)}
            required
          >
            <option value="">Select Year Level</option>
            {course === "BSIT" || course === "BSBA" || course === "BSCS"? (
              <>
                <option value="1st">1st Year</option>
                <option value="2nd">2nd Year</option>
                <option value="3rd">3rd Year</option>
                <option value="4th">4th Year</option>
              </>
            ) : course === "BSCE" || course === "BSEE" ? (
              <>
                <option value="1st">1st Year</option>
                <option value="2nd">2nd Year</option>
                <option value="3rd">3rd Year</option>
                <option value="4th">4th Year</option>
                <option value="5th">5th Year</option>
              </>
            ) : null}
          </select>

          <label className="block text-gray-700 font-medium mb-2">*Password:</label>
          <input
            className="w-full px-3 py-2 mb-3 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 transition duration-200"
          >
            Register
          </button>
        </form>
        <div className="text-center mt-4">
          <motion.div whileHover={{ scale: 1.1 }}>
            <Link to="/login" className="text-green-500 hover:text-green-700">
              Already have an account? Login now.
            </Link>
          </motion.div>
        </div>
      </div>
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow-lg w-96 text-center">
            <h2 className="text-red-600 font-bold text-xl mb-4">Already Registered</h2>
            <p className="text-gray-700">You already registered. Please login.</p>
            <button 
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={() => setShowModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
