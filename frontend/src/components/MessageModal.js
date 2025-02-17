import React from "react";
import { motion } from "framer-motion";

export default function Modal({ title, children, onClose}) {
  const titleColor =
    title === "Success"
      ? "text-green-600"
      : title === "Error"
      ? "text-red-600"
      : "text-black";

  return (
    <div className="fixed inset-0 flex justify-center items-start bg-black bg-opacity-50 z-40">
      <div className="mt-10">
          <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="bg-white rounded-lg p-6 shadow-lg w-96"
        >
          <h2 className={`text-xl font-bold ${titleColor} mb-4 text-center`}>
            {title}
          </h2>
          <div className="text-center text-lg">{children}</div>
          <button
            onClick={onClose}
            className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition w-full"
          >
            Close
          </button>
        </motion.div>
      </div>
    </div>
  );
}
