import React from "react";

export default function RoleBadge({ rol }) {
  const renk = rol === "is_arayan" ? "bg-green-200 text-green-800" : rol === "isveren" ? "bg-blue-200 text-blue-800" : "bg-gray-200 text-gray-800";
  const yazi = rol === "is_arayan" ? "İş Arayan" : rol === "isveren" ? "İşveren" : "Admin";
  return <span className={`px-2 py-1 rounded text-xs font-semibold ${renk}`}>{yazi}</span>;
} 