import React from "react";

export default function Notification({ mesaj, onClose }) {
  if (!mesaj) return null;
  return (
    <div className="fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded shadow z-50 animate-bounce">
      {mesaj}
      <button className="ml-4" onClick={onClose}>Kapat</button>
    </div>
  );
} 