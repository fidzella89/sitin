import React from "react";

export function Table({ children }) {
  return <table className="w-full border-collapse border">{children}</table>;
}

export function TableHead({ children }) {
  return <thead className="bg-gray-200">{children}</thead>;
}

export function TableRow({ children }) {
  return <tr className="border-b">{children}</tr>;
}

export function TableCell({ children }) {
  return <td className="p-2 border">{children}</td>;
}
