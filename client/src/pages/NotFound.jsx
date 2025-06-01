import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="text-center mt-20">
      <h2 className="text-4xl font-bold mb-4">404</h2>
      <p className="text-lg mb-4">Aradığınız sayfa bulunamadı.</p>
      <Link to="/" className="btn-primary">Ana Sayfa</Link>
    </div>
  );
} 