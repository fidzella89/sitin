import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "../components/Student-Sidebar"; // Import Sidebar

export default function RulesRegulations() {
  const [activePanel, setActivePanel] = useState(1);

  const rules = {
    1: `1. Students must present their ID before entering the lab.
        2. Computers must be used for academic purposes only.
        3. Students should not install unauthorized software.
        4. Always log out after using a computer.
        5. Keep the lab environment clean at all times.`,

    2: `1. No food or drinks are allowed inside the lab.
        2. Mobile phones should be set to silent mode.
        3. Students must maintain silence to avoid disturbing others.
        4. Any form of cyberbullying or harassment is strictly prohibited.
        5. Misuse of equipment may result in penalties.`,

    3: `1. Respect others and maintain a quiet study environment.
        2. Tampering with lab equipment is strictly prohibited.
        3. Do not attempt to access restricted websites.
        4. Follow the lab assistant's instructions at all times.
        5. Failure to comply with rules may lead to disciplinary actions.`
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-r from-blue-500 to-green-400">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 p-8 transition-all ml-16 md:ml-38">
        <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-3xl mx-auto">
          <h2 className="text-3xl font-semibold text-center text-blue-600 mb-6">
           Laboratory Rules & Regulations
          </h2>

          {/* Tab Buttons */}
          <div className="flex justify-center gap-4 mb-6">
            {[1, 2, 3].map((num) => (
              <button
                key={num}
                onClick={() => setActivePanel(num)}
                className={`px-4 py-2 rounded-md transition ${
                  activePanel === num
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                }`}
              >
                Rule {num}
              </button>
            ))}
          </div>

          {/* Animated Scrollable Panel */}
          <div className="relative min-h-[200px] max-h-[250px] overflow-y-auto border p-4 rounded-lg bg-gray-100 shadow-inner">
            <AnimatePresence mode="wait">
              <motion.div
                key={activePanel}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3 }}
                className="text-gray-700 text-left leading-relaxed whitespace-pre-line"
              >
                {rules[activePanel]}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
