import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiUser, FiBook, FiUsers, FiCalendar , FiLogOut } from "react-icons/fi";
import Logo from '../assets/image/CCS_Logo.png';
import axios from "axios";

export default function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axios.post("http://localhost:8000/auth/logout", {}, { withCredentials: true });
      localStorage.clear();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (e.target === e.currentTarget) {
        setShowModal(false);
      }
    };

    document.body.addEventListener("click", handleOutsideClick);

    return () => {
      document.body.removeEventListener("click", handleOutsideClick);
    };
  }, []);

  return (
    <motion.div
      className="fixed top-0 left-0 h-full bg-blue-900 text-white flex flex-col p-3 shadow-lg z-50"
      initial={{ width: "60px" }}
      animate={{ width: isExpanded ? "200px" : "60px" }}
      transition={{ duration: 0.3 }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Sidebar Header (Logo is always visible) */}
      <NavLink to="/student-dashboard" className="flex items-center justify-center">
        <img
          src={Logo}
          className="w-12 h-12"
          alt="Logo"
        />
      </NavLink>

      {/* System Name (Visible only when expanded) */}
      {isExpanded && (
        <motion.h1
          className="text-lg font-bold text-center mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.1 }}
        >
          Sit-in Monitoring System
        </motion.h1>
      )}

      {/* Navigation Links */}
      <div className={`${isExpanded ? '' : 'mt-20'}`}>
        <nav className="flex flex-col space-y-4">
          <NavItem to="/student-dashboard" icon={<FiUser />} label="Dashboard" isExpanded={isExpanded} />
          <NavItem to="/student/information" icon={<FiUsers />} label="Student" isExpanded={isExpanded} />
          <NavItem to="/record" icon={<FiBook />} label="Record" isExpanded={isExpanded} />
          <NavItem to="/upcoming/schedule" icon={<FiCalendar />} label="Reservation" isExpanded={isExpanded} />
        </nav>
      </div>

      {/* Logout Button */}
      <motion.button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-3 px-2 py-2 mt-auto bg-red-600 rounded-md hover:bg-red-700 transition w-full"
      >
        <FiLogOut className="text-xl" />
        {isExpanded && <span>Logout</span>}
      </motion.button>

      {/* Logout Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <motion.div
            className="bg-white p-6 rounded-lg shadow-lg w-80"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-xl font-semibold text-center text-gray-800">
              Are you sure you want to log out?
            </h3>
            <div className="flex justify-center gap-4 mt-4">
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition duration-300"
              >
                Yes
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400 transition duration-300"
              >
                No
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

// Sidebar Item Component
function NavItem({ to, icon, label, isExpanded }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-2 py-3 rounded-md transition ${isActive ? "bg-blue-700" : "hover:bg-blue-800"}`
      }
    >
      {icon}
      {isExpanded && <span>{label}</span>}
    </NavLink>
  );
}
