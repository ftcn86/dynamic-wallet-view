
"use client";

import React from 'react';
import { TableHead } from '@/components/ui/table';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

declare module 'react' {
  interface SortConfig<T> {
    key: keyof T | null;
    direction: 'ascending' | 'descending';
  }
}

interface SortableTableHeadProps<T> extends React.ThHTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
  onClick: () => void;
  sortKey: keyof T;
  sortConfig: React.SortConfig<T>;
  isNumeric?: boolean;
}

export function SortableTableHead<T>({
  children,
  onClick,
  sortKey,
  sortConfig,
  className,
  isNumeric = false,
  ...props
}: SortableTableHeadProps<T>) {
  const isSorted = sortConfig.key === sortKey;

  return (
    <TableHead
      className={cn("cursor-pointer hover:bg-muted/50", className)}
      onClick={onClick}
      {...props}
    >
      <div className={cn("flex items-center gap-2", isNumeric ? "justify-end" : "justify-start")}>
        {children}
        {isSorted ? (
          sortConfig.direction === 'ascending' ? <ArrowUp className="h-3 w-3 text-primary" /> : <ArrowDown className="h-3 w-3 text-primary" />
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-30" />
        )}
      </div>
    </TableHead>
  );
}
