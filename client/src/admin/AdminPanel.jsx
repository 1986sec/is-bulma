import React, { useState } from "react";

const demoKullanicilar = [
  { id: 1, ad: "Ali", soyad: "Yılmaz", rol: "is_arayan", banli: false },
  { id: 2, ad: "Ayşe", soyad: "Kaya", rol: "isveren", banli: true }
];

export default function AdminPanel() {
  const [kullanicilar, setKullanicilar] = useState(demoKullanicilar);

  const banla = id => {
    setKullanicilar(kullanicilar.map(k => k.id === id ? { ...k, banli: true } : k));
  };
  const onayla = id => {
    alert("Kullanıcı onaylandı! (Demo)");
  };

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-4">Admin Paneli</h2>
      <p className="mb-2">Kullanıcı ve ilan yönetimi, eşleşme ve moderasyon işlemleri burada yapılır.</p>
      <table className="w-full mb-4">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">Ad</th>
            <th className="p-2">Soyad</th>
            <th className="p-2">Rol</th>
            <th className="p-2">Durum</th>
            <th className="p-2">İşlem</th>
          </tr>
        </thead>
        <tbody>
          {kullanicilar.map(k => (
            <tr key={k.id} className="text-center">
              <td className="p-2">{k.ad}</td>
              <td className="p-2">{k.soyad}</td>
              <td className="p-2">{k.rol === "is_arayan" ? "İş Arayan" : "İşveren"}</td>
              <td className="p-2">{k.banli ? "Banlı" : "Aktif"}</td>
              <td className="p-2 space-x-2">
                <button className="btn-primary" onClick={() => banla(k.id)} disabled={k.banli}>Banla</button>
                <button className="btn-primary" onClick={() => onayla(k.id)}>Onayla</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Buraya admin paneli fonksiyonları eklenecek */}
    </div>
  );
} 