import React, { useState, useEffect } from "react";
import Sidebar from "../components/Student-Sidebar";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Modal from "../components/Modal"; 
import MessageModal from "../components/MessageModal"; 
import { FaEye, FaEyeSlash } from "react-icons/fa"; 
import axios from "axios";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [sessionStart, setSessionStart] = useState(null);
  const [liveTime, setLiveTime] = useState("00:00:00");
  const [username, setUsername] = useState("");
  const [student, setStudent] = useState({
    firstname: "",
    midname: "",
    lastname: "",
    course: "",
    yearlevel: "",
    email: "",
    role: "",
    penalties: "",
    session_no: ""
  });
  const [formData, setFormData] = useState({
    firstname: "",
    midname: "",
    lastname: "",
    course: "",
    yearlevel: "",
    email: "",
  });
  const [modalMessage, setModalMessage] = useState("");  
  const [modalType, setModalType] = useState(""); 
  const [showModal, setShowModal] = useState(false);
  const [passwordVisibility, setPasswordVisibility] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [passwordMatch, setPasswordMatch] = useState(true);
  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
    hasUppercase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  // Function to validate password match and requirements
  const validatePasswords = () => {
    const { newPassword, confirmPassword } = passwordData;
    const minLength = newPassword.length >= 8;
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    setPasswordRequirements({ minLength, hasUppercase, hasNumber, hasSpecialChar });
    setPasswordMatch(newPassword === confirmPassword);
  };

  useEffect(() => {
    validatePasswords();
  }, [passwordData]);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const sessionResponse = await axios.get("http://localhost:8000/auth/check-session", {
          withCredentials: true,
        });

        const username = sessionResponse.data.user.username;
        setUsername(username);

        const userResponse = await axios.get(`http://localhost:8000/students/${username}`);

        if (userResponse.data.username) {
          const user = userResponse.data;
          setStudent(user);
          setFormData({
            firstname: user.firstname,
            midname: user.midname,
            lastname: user.lastname,
            course: user.course,
            yearlevel: user.yearlevel,
            email: user.email,
            penalties: user.penalties,
            session_no: user.session_no
          });
          fetchSessionStart(user.username);
        }
      } catch (error) {
        console.error("Error checking session:", error);
        navigate("/login");
      }
    };

    checkSession();
  }, [navigate]);

  useEffect(() => {
    if (sessionStart) {
      const interval = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now - sessionStart) / 1000);
        const hours = String(Math.floor(elapsed / 3600)).padStart(2, "0");
        const minutes = String(Math.floor((elapsed % 3600) / 60)).padStart(2, "0");
        const seconds = String(elapsed % 60).padStart(2, "0");
        setLiveTime(`${hours}:${minutes}:${seconds}`);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [sessionStart]);

  const fetchSessionStart = async (username) => {
    try {
      const sessionResponse = await axios.get(
        `http://localhost:8000/session/get-session-start/${username}`,
        { withCredentials: true }
      );
      setSessionStart(new Date(sessionResponse.data.session_start));
    } catch (error) {
      console.error("Error fetching session start time:", error);
    }
  };

  const handleSaveChanges = async () => {
    if (!formData.firstname || !formData.lastname || !formData.email || !formData.course || !formData.yearlevel) {
      setModalMessage("Fields cannot be empty!");
      setModalType("error");
      setShowModal(true);
      return;
    }

    if (
      formData.firstname === student.firstname &&
      formData.midname === student.midname &&
      formData.lastname === student.lastname &&
      formData.course === student.course &&
      formData.yearlevel === student.yearlevel &&
      formData.email === student.email
    ) {
      setModalMessage("No Changes Made.");
      setModalType("no-changes");
      setShowModal(true);
      setShowEditModal(false);
      return;
    }

    try {
      const response = await axios.put(
        `http://localhost:8000/students/edit/${username}`,
        {
          firstname: formData.firstname,
          midname: formData.midname,
          lastname: formData.lastname,
          course: formData.course,
          yearlevel:  parseInt(formData.yearlevel),
          email: formData.email,
        }
      );

      if (response.data.message === "The Info Already Exists") {
        setModalMessage("The Info Already Exists");
        setModalType("error");
      } else {
        setModalMessage("Success! Your information has been updated.");
        setModalType("success");

        setStudent({ ...student, ...formData });
        setShowEditModal(false);
      }
      setShowModal(true);
    } catch (error) {
      console.error("Error saving changes:", error);
      setModalMessage("An error occurred. Please try again.");
      setModalType("error");
      setShowModal(true);
    }
  };

  const togglePasswordVisibility = (field) => {
    setPasswordVisibility({
      ...passwordVisibility,
      [field]: !passwordVisibility[field],
    });
  };


  const handleChangePassword = async () => {
    if (!passwordMatch || !passwordRequirements.minLength || !passwordRequirements.hasUppercase || !passwordRequirements.hasNumber || !passwordRequirements.hasSpecialChar) {
      setModalMessage("Please ensure all requirements are met.");
      setModalType("error");
      setShowModal(true);
      return;
    }

    try {
      const response = await axios.put(
        `http://localhost:8000/students/change-password/${username}`,
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
          confirmPassword: passwordData.confirmPassword,
        }
      );

      if (response.status === 200) {
        setModalMessage("Password changed successfully!");
        setShowPasswordModal(false);
      }
    } catch (error) {
      console.error("Error changing password:", error);
      if (error.response.data.detail === "Incorrect current password"){
        setModalMessage("Incorrect current password. Please try again.");
        setModalType("error");
      } else {
        setModalMessage("Something went wrong. Please try again later.");
        setModalType("error");
      }
      
    }
    setShowModal(true);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-r from-green-400 to-blue-500">
      <Sidebar onHover={setIsSidebarExpanded} />
      <div className={`p-8 transition-all duration-300 ${isSidebarExpanded ? "ml-48" : "ml-16"}`}>
        <div className="bg-white p-8 rounded-lg shadow-lg w-96">
          <h2 className="text-3xl font-semibold text-center font-bold text-blue-600 mb-4">Profile</h2>
          {username ? (
            <>
              <p className="text-center text-lg text-gray-700">Welcome, {student.lastname}!</p>
              <p className="text-left mt-2"><span className="font-bold text-gray-600">ID No.</span> <span className="text-base">{student.idno}</span></p>
              <p className="text-left mt-2"><span className="font-bold text-gray-600">First Name:</span> <span className="text-base">{student.firstname}</span></p>
              <p className="text-left mt-2"><span className="font-bold text-gray-600">Middle Name:</span>{" "}<span className={student.midname ? "text-base text-black" : "text-sm text-gray-500"}>
                  {student.midname || "N/A"}</span>
              </p>
              <p className="text-left mt-2"><span className="font-bold text-gray-600">Last Name:</span> <span className="text-base">{student.lastname}</span></p>
              <p className="text-left mt-2">
                <span className="font-bold text-gray-600">Email:</span>{" "}
                <span className={student.email ? "text-base text-black" : "text-sm text-gray-500"}>
                  {student.email || "N/A"}
                </span>
              </p>
              <p className="text-left mt-2">
                <span className="font-bold text-gray-600">Course:</span>{" "}
                <span className={student.course ? "text-base text-black" : "text-sm text-gray-500"}>
                  {student.course.toUpperCase() || "N/A"}
                </span>
              </p>
              <p className="text-left mt-2">
                <span className="font-bold text-gray-600">Year:</span>{" "}
                <span className={student.yearlevel ? "text-base text-black" : "text-sm text-gray-500"}>
                  {student.yearlevel
                    ? student.yearlevel === 1
                      ? "1st Year"
                      : student.yearlevel === 2
                      ? "2nd Year"
                      : student.yearlevel === 3
                      ? "3rd Year"
                      : student.yearlevel === 4
                      ? "4th Year"
                      : student.yearlevel === 5
                      ? "5th Year"
                      : "N/A"
                    : "N/A"}
                </span>
              </p>
            </>
          ) : (
            <p className="text-center text-lg">Retrieving data please wait...</p>
          )}
          <p className="text-center text-blue-600 font-semibold mt-4">Remaining Session: {student.session_no || 0}</p>
          <p className="text-center text-green-600 font-semibold mt-2">Runtime: {liveTime}</p>

          <div className="flex justify-center gap-4 mt-6">
            <button
              onClick={() => setShowEditModal(true)}
              className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-600 transition"
            >
              Edit Info
            </button>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="bg-green-600 text-white py-2 px-4 rounded hover:bg-gray-600 transition"
            >
              Change Password
            </button>
          </div>
        </div>
      </div>

      {showEditModal && (
        <Modal title="Edit Information" onClose={() => setShowEditModal(false)}>
          <input
            type="text"
            className="w-full p-2 border rounded"
            placeholder="First Name"
            value={formData.firstname}
            onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
          />
          <input
            type="text"
            className="w-full p-2 border rounded mt-2"
            placeholder="Middle Name"
            value={formData.midname}
            onChange={(e) => setFormData({ ...formData, midname: e.target.value })}
          />
          <input
            type="text"
            className="w-full p-2 border rounded mt-2"
            placeholder="Last Name"
            value={formData.lastname}
            onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
          />
          <input
            type="email"
            className="w-full p-2 border rounded mt-2"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />

          {/* Course Selection */}
          <select
            className="w-full p-2 border rounded mt-2"
            value={formData.course}
            onChange={(e) =>
              setFormData({ ...formData, course: e.target.value, yearlevel: "" }) 
            }
          >
            <option value="">Select Course</option>
            <option value="bsit">Bachelor of Science in Information Technology (BSIT)</option>
            <option value="bsce">Bachelor of Science in Civil Engineering (BSCE)</option>
            <option value="bsee">Bachelor of Science in Electrical Engineering (BSEE)</option>
            <option value="bsba">Bachelor of Science in Business Administration (BSBA)</option>
          </select>

          {/* Year Level Selection - Updates Dynamically */}
          <select
            className="w-full p-2 border rounded mt-2"
            value={formData.yearlevel}
            onChange={(e) => setFormData({ ...formData, yearlevel: e.target.value })}
          >
            <option value="">Select Year Level</option>
            {formData.course === "bsit" || formData.course === "bsba" ? (
              <>
                <option value="1st">1st Year</option>
                <option value="2nd">2nd Year</option>
                <option value="3rd">3rd Year</option>
                <option value="4th">4th Year</option>
              </>
            ) : formData.course === "bsce" || formData.course === "bsee" ? (
              <>
                <option value="1st">1st Year</option>
                <option value="2nd">2nd Year</option>
                <option value="3rd">3rd Year</option>
                <option value="4th">4th Year</option>
                <option value="5th">5th Year</option>
              </>
            ) : null}
          </select>

          <div className="flex justify-end gap-4 mt-4">
            <button
              onClick={handleSaveChanges}
              className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition"
            >
              Save Changes
            </button>
          </div>
        </Modal>
      )}

      {showPasswordModal && (
        <Modal title="Change Password" onClose={() => setShowPasswordModal(false)}>
          <div className="relative">
            <input
              type={passwordVisibility.current ? "text" : "password"}
              className="w-full p-2 border rounded"
              placeholder="Current Password"
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} 
            />
            <button
              onClick={() => togglePasswordVisibility("current")}
              className="absolute right-4 top-2"
            >
              {passwordVisibility.current ? <FaEye /> : <FaEyeSlash />}
            </button>
          </div>

          <div className="relative mt-4">
            <input
              type={passwordVisibility.new ? "text" : "password"}
              className="w-full p-2 border rounded"
              placeholder="New Password"
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} 
            />
            <button
              onClick={() => togglePasswordVisibility("new")}
              className="absolute right-4 top-2"
            >
              {passwordVisibility.new ? <FaEye /> : <FaEyeSlash />}
            </button>
          </div>

          <div className="relative mt-4">
            <input
              type={passwordVisibility.confirm ? "text" : "password"}
              className="w-full p-2 border rounded"
              placeholder="Confirm Password"
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} 
            />
            <button
              onClick={() => togglePasswordVisibility("confirm")}
              className="absolute right-4 top-2"
            >
              {passwordVisibility.confirm ? <FaEye /> : <FaEyeSlash />}
            </button>
          </div>
          <p className={`text-red-600 text-xs mt-2 ${passwordMatch ? "hidden" : "block"}`}>Passwords do not match.</p>
          <div className="mt-2">
              <div className="flex gap-2">
                  <motion.div   
                    className={`text-xs ${passwordRequirements.minLength ? "text-green-500" : "text-red-500"}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    {passwordRequirements.minLength ? "✓ Minimum 8 characters" : "✗ Minimum 8 characters"}
                  </motion.div>
              </div>
              <div className="flex gap-2">
                <motion.div
                  className={`text-xs ${passwordRequirements.hasUppercase ? "text-green-500" : "text-red-500"}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  {passwordRequirements.hasUppercase ? "✓ At least 1 uppercase letter" : "✗ At least 1 uppercase letter"}
                </motion.div>
              </div>
              <div className="flex gap-2">
                <motion.div
                  className={`text-xs ${passwordRequirements.hasNumber ? "text-green-500" : "text-red-500"}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  {passwordRequirements.hasNumber ? "✓ At least 1 number" : "✗ At least 1 number"}
                </motion.div>
              </div>
              <div className="flex gap-2">
                <motion.div
                  className={`text-xs ${passwordRequirements.hasSpecialChar ? "text-green-500" : "text-red-500"}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  {passwordRequirements.hasSpecialChar ? "✓ At least 1 special character (eg. !@#$%^&*())" : "✗ At least 1 special character (eg. !@#$%^&*())"}
                </motion.div>
              </div>
          </div>
          <div className="flex justify-end gap-4 mt-4">
          <button
            onClick={handleChangePassword}
            disabled={!passwordMatch || !passwordRequirements.minLength || !passwordRequirements.hasUppercase || !passwordRequirements.hasNumber || !passwordRequirements.hasSpecialChar}
            className={`w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition ${!passwordMatch || !passwordRequirements.minLength || !passwordRequirements.hasUppercase || !passwordRequirements.hasNumber || !passwordRequirements.hasSpecialChar ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Change Password
          </button>
          </div>
        </Modal>
      )}

      {showModal && (
        <MessageModal title={modalType === "success" ? "Success" : modalType === "error" ? "Error" : "Information"} onClose={() => setShowModal(false)}>
          <p>{modalMessage}</p>
        </MessageModal>
      )}
    </div>
  );
}
