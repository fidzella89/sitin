import React from "react";

export function Card({ children, className }) {
  return (
    <div className={`p-4 border rounded-lg shadow-md ${className}`}>
      {children}
    </div>
  );
}
