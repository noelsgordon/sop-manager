import React from "react";

export function Card({ children, className = "", ...props }) {
  return (
    <div
      className={`border rounded-lg p-4 shadow hover:shadow-md transition bg-white ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
