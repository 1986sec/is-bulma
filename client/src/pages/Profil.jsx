import React, { useState } from "react";

export default function Profil() {
  // Demo için örnek kullanıcı
  const [form, setForm] = useState({ ad: "Ali", soyad: "Yılmaz", email: "ali@example.com" });
  const [hata, setHata] = useState("");

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (!form.ad || !form.soyad || !form.email) {
      setHata("Tüm alanları doldurun.");
      return;
    }
    setHata("");
    alert("Profil güncellendi! (Demo)");
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-4">Profilim</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Ad</label>
          <input name="ad" value={form.ad} onChange={handleChange} className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block mb-1">Soyad</label>
          <input name="soyad" value={form.soyad} onChange={handleChange} className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block mb-1">E-posta</label>
          <input name="email" type="email" value={form.email} onChange={handleChange} className="w-full border p-2 rounded" />
        </div>
        {hata && <div className="text-red-600">{hata}</div>}
        <button type="submit" className="btn-primary w-full">Kaydet</button>
      </form>
    </div>
  );
} 