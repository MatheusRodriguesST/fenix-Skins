// src/components/SkeletonCard.tsx
import React from "react";

export default function SkeletonCard() {
  return (
    <div className="animate-pulse p-4 bg-neutral-900/60 rounded-2xl border border-neutral-800/60 shadow-md">
      <div className="w-full h-32 bg-neutral-800 rounded-xl mb-4" />
      <div className="h-4 bg-neutral-800 rounded w-3/4 mb-2" />
      <div className="h-3 bg-neutral-800 rounded w-1/2" />
    </div>
  );
}