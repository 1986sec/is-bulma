import React, { useState } from "react";

export default function Giris() {
  const [form, setForm] = useState({ email: "", sifre: "" });
  const [hata, setHata] = useState("");

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (!form.email || !form.sifre) {
      setHata("Tüm alanları doldurun.");
      return;
    }
    // API isteği burada yapılacak
    setHata("");
    alert("Giriş başarılı! (Demo)");
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-4">Giriş Yap</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">E-posta</label>
          <input name="email" type="email" value={form.email} onChange={handleChange} className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block mb-1">Şifre</label>
          <input name="sifre" type="password" value={form.sifre} onChange={handleChange} className="w-full border p-2 rounded" />
        </div>
        {hata && <div className="text-red-600">{hata}</div>}
        <button type="submit" className="btn-primary w-full">Giriş Yap</button>
      </form>
    </div>
  );
} 