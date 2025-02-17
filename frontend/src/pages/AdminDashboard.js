import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion"; 
import Sidebar from "../components/Admin-Sidebar";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false); 

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-r from-yellow-400 to-red-500">
      <Sidebar />
      <div className="bg-white p-8 rounded-lg shadow-lg w-96 transform hover:scale-105 transition-transform duration-500 ease-in-out">
        <h2 className="text-3xl font-bold text-center text-red-600 mb-4">Admin Dashboard</h2>
        <p className="text-center mb-4 text-gray-700">Welcome to your admin dashboard!</p>

        {/* Logout Button */}
        <motion.button
          onClick={() => setShowModal(true)} // Show modal on click
          className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 transition duration-300"
        >
          Logout
        </motion.button>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <motion.div
              className="bg-white p-6 rounded-lg shadow-lg w-80"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-xl font-semibold text-center text-gray-800">Are you sure you want to log out?</h3>
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
      </div>
    </div>
  );
}
