import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type SortDir = "asc" | "desc";

interface SortableTableHeadProps<K extends string> {
  label: string;
  sortKey: K;
  activeKey: K;
  dir: SortDir;
  onSort: (key: K) => void;
  className?: string;
}

export function SortableTableHead<K extends string>({
  label,
  sortKey,
  activeKey,
  dir,
  onSort,
  className,
}: SortableTableHeadProps<K>) {
  const isActive = activeKey === sortKey;
  const Icon = isActive ? (dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <TableHead className={className}>
      <button
        type="button"
        className="inline-flex items-center gap-1 hover:text-foreground"
        onClick={() => onSort(sortKey)}
      >
        {label}
        <Icon className={cn("size-3.5", isActive ? "text-foreground" : "text-muted-foreground")} />
      </button>
    </TableHead>
  );
}
