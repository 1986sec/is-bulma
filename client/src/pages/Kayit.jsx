import React, { useState } from "react";

export default function Kayit() {
  const [form, setForm] = useState({
    ad: "",
    soyad: "",
    email: "",
    sifre: "",
    rol: "is_arayan"
  });
  const [hata, setHata] = useState("");

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (!form.ad || !form.soyad || !form.email || !form.sifre) {
      setHata("Tüm alanları doldurun.");
      return;
    }
    // API isteği burada yapılacak
    setHata("");
    alert("Kayıt başarılı! (Demo)");
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-4">Kayıt Ol</h2>
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
        <div>
          <label className="block mb-1">Şifre</label>
          <input name="sifre" type="password" value={form.sifre} onChange={handleChange} className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block mb-1">Kullanıcı Türü</label>
          <select name="rol" value={form.rol} onChange={handleChange} className="w-full border p-2 rounded">
            <option value="is_arayan">İş Arayan</option>
            <option value="isveren">İşveren</option>
          </select>
        </div>
        {hata && <div className="text-red-600">{hata}</div>}
        <button type="submit" className="btn-primary w-full">Kayıt Ol</button>
      </form>
    </div>
  );
} 