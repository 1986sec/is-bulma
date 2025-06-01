import React from "react";

export default function UserAvatar({ src, ad }) {
  if (src) {
    return <img src={src} alt="Profil" className="w-12 h-12 rounded-full object-cover" />;
  }
  // Yedek: baş harfli avatar
  return (
    <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-xl font-bold text-gray-700">
      {ad ? ad[0].toUpperCase() : "?"}
    </div>
  );
} 