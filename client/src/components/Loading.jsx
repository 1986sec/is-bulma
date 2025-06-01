import React from "react";

export default function Loading() {
  return (
    <div className="flex justify-center items-center h-40">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      <span className="ml-4 text-blue-600 font-bold">Yükleniyor...</span>
    </div>
  );
} 