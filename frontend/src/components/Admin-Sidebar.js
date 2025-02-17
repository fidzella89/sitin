import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiHome, FiUser, FiLogOut, FiBarChart2 } from "react-icons/fi";

export default function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <motion.div
      className="fixed top-0 left-0 h-full bg-blue-900 text-white flex flex-col p-2 shadow-lg"
      initial={{ width: "60px" }}
      animate={{ width: isExpanded ? "200px" : "60px" }}
      transition={{ duration: 0.3 }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Sidebar Header (Logo is always visible) */}
      <div className="flex items-center justify-center p-3">
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg"
          className="w-12 h-12"
          alt="Logo"
        />
      </div>

      {/* System Name (Visible only when expanded) */}
      {isExpanded && (
        <motion.h1
          className="text-lg font-bold text-center mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          Sit-in Monitoring System
        </motion.h1>
      )}

      {/* Navigation Links */}
      <nav className="mt-5 flex flex-col space-y-4">
        <NavItem to="/dashboard" icon={<FiHome />} label="Home" isExpanded={isExpanded} />
        <NavItem to="/profile" icon={<FiUser />} label="Profile" isExpanded={isExpanded} />
        <NavItem to="/reports" icon={<FiBarChart2 />} label="Reports" isExpanded={isExpanded} />
      </nav>

      {/* Logout Button */}
      <motion.button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-3 px-2 py-3 mt-auto bg-red-600 rounded-md hover:bg-red-700 transition w-full"
      >
        <FiLogOut className="text-xl" />
        {isExpanded && <span>Logout</span>}
      </motion.button>

      {/* Logout Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
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
        `flex items-center gap-3 px-2 py-3 rounded-md transition ${
          isActive ? "bg-blue-700" : "hover:bg-blue-800"
        }`
      }
    >
      {icon}
      {isExpanded && <span>{label}</span>}
    </NavLink>
  );
}
