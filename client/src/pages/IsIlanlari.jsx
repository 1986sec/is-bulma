import React from "react";

const ilanlar = [
  { baslik: "Frontend Geliştirici", aciklama: "React ve Tailwind bilen geliştirici arıyoruz." },
  { baslik: "Siber Güvenlik Uzmanı", aciklama: "Penetrasyon testi ve red team tecrübesi olan uzman." }
];

export default function IsIlanlari() {
  return (
    <div className="max-w-2xl mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-4">İş İlanları</h2>
      <p className="mb-2">Tüm açık iş ilanlarını görüntüleyin.</p>
      <div className="grid gap-4">
        {ilanlar.map((i, idx) => (
          <div className="card" key={idx}>
            <h3 className="font-bold text-lg">{i.baslik}</h3>
            <p>{i.aciklama}</p>
          </div>
        ))}
      </div>
    </div>
  );
} 