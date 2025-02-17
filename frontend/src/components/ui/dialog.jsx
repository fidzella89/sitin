import React, { useState } from "react";

export function Dialog({ triggerText, children }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)} className="px-4 py-2 bg-blue-600 text-white rounded-md">
        {triggerText}
      </button>
      {open && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-md shadow-lg">
            {children}
            <button onClick={() => setOpen(false)} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md">
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
