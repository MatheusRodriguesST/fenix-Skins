// src/components/Pagination.tsx
import React from "react";

interface PaginationProps {
  filteredLength: number;
  page: number;
  pageCount: number;
  setPage: (p: number) => void;
  pageSize: number;
}

export default function Pagination({ filteredLength, page, pageCount, setPage, pageSize }: PaginationProps) {
  const pageItemsLength = Math.min(filteredLength - (page - 1) * pageSize, pageSize);

  return (
    <div className="mt-8 flex items-center justify-between text-sm text-gray-300">
      <p>Mostrando {pageItemsLength} de {filteredLength} itens</p>
      <div className="flex gap-3">
        <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-4 py-2 rounded-full bg-neutral-800/50 disabled:opacity-50 hover:bg-yellow-700/50 transition shadow">Anterior</button>
        <button onClick={() => setPage(Math.min(pageCount, page + 1))} disabled={page === pageCount} className="px-4 py-2 rounded-full bg-neutral-800/50 disabled:opacity-50 hover:bg-yellow-700/50 transition shadow">Próxima</button>
      </div>
    </div>
  );
}