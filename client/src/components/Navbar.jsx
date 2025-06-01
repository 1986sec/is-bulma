import React from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="bg-white shadow p-4 flex justify-between items-center">
      <Link to="/" className="font-bold text-lg text-blue-600">İş Platformu</Link>
      <div className="space-x-4">
        <Link to="/is-ilanlari">İş İlanları</Link>
        <Link to="/kayit">Kayıt Ol</Link>
        <Link to="/giris">Giriş Yap</Link>
        <Link to="/profil">Profil</Link>
        <Link to="/premium">Premium</Link>
        <Link to="/admin">Admin</Link>
      </div>
    </nav>
  );
} 