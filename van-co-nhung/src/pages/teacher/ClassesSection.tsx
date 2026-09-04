import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ClassDetailModal from "./ClassDetailModal";
import ClassFormModal from "./ClassFormModal";
import {
  deleteClass,
  fetchClasses,
  setClassActive,
  type ClassSummary,
} from "./classesApi";
import { displayGrade } from "./gradeOptions";
import { formatSchedulesCompact } from "./scheduleOptions";
import { SortableTableHead, type SortDir } from "./SortableTableHead";

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

type StatusFilter = "all" | "active" | "inactive";
type SortKey = "name" | "grade" | "studentCount" | "active";

function ClassesSection() {
  const { t } = useTranslation(["teacher", "common"]);
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  useEffect(() => {
    const trimmed = searchInput.trim();
    if (trimmed === search) return;
    const handle = setTimeout(() => {
      setIsLoading(true);
      setSearch(trimmed);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;

    fetchClasses({ search, status: statusFilter, sortBy: sortKey, sortDir })
      .then((data) => {
        if (!cancelled) setClasses(data);
      })
      .catch(() => {
        if (!cancelled) toast.error(t("teacher:classes.loadError"));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, sortKey, sortDir]);

  function handleSearchInputChange(value: string) {
    setSearchInput(value);
  }

  function handleStatusFilterChange(value: StatusFilter) {
    setIsLoading(true);
    setStatusFilter(value);
    setPage(1);
  }

  function handleSort(key: SortKey) {
    setIsLoading(true);
    setPage(1);
    if (key === sortKey) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function reload() {
    fetchClasses({ search, status: statusFilter, sortBy: sortKey, sortDir })
      .then(setClasses)
      .catch(() => toast.error(t("teacher:classes.loadError")));
  }

  async function handleToggleActive(classRoom: ClassSummary, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      const updated = await setClassActive(classRoom.id, !classRoom.active);
      setClasses((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    } catch {
      toast.error(t("teacher:classes.toggleActiveError"));
    }
  }

  async function handleRemove(classRoom: ClassSummary, e: React.MouseEvent) {
    e.stopPropagation();
    if (!window.confirm(t("teacher:classes.deleteConfirm", { name: classRoom.name }))) return;
    try {
      await deleteClass(classRoom.id);
      setClasses((prev) => prev.filter((c) => c.id !== classRoom.id));
    } catch {
      toast.error(t("teacher:classes.deleteError"));
    }
  }

  function handleCreated() {
    setIsModalOpen(false);
    toast.success(t("teacher:classes.createSuccess"));
    reload();
  }

  function handleClassUpdated(updated: ClassSummary) {
    setClasses((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }

  const totalPages = Math.max(1, Math.ceil(classes.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = classes.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <div className="rounded-xl border border-border bg-background p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-xl font-bold text-foreground">
          {t("teacher:classes.listTitle")}
        </h2>
        <div className="flex flex-wrap items-center gap-2.5">
          <Input
            type="search"
            placeholder={t("teacher:classes.searchPlaceholder")}
            className="w-[260px]"
            value={searchInput}
            onChange={(e) => handleSearchInputChange(e.target.value)}
          />
          <Select
            value={statusFilter}
            onValueChange={(v) => handleStatusFilterChange(v as StatusFilter)}
          >
            <SelectTrigger className="w-[190px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("teacher:classes.statusFilterAll")}</SelectItem>
              <SelectItem value="active">{t("teacher:classStatus.active")}</SelectItem>
              <SelectItem value="inactive">{t("teacher:classStatus.inactive")}</SelectItem>
            </SelectContent>
          </Select>
          <Button type="button" onClick={() => setIsModalOpen(true)}>
            {t("teacher:classes.add")}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t("common:status.loading")}</p>
      ) : classes.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("teacher:classes.noResults")}</p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead label={t("teacher:classes.table.name")} sortKey="name" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                <SortableTableHead label={t("teacher:classes.table.grade")} sortKey="grade" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                <TableHead>{t("teacher:classes.table.schedule")}</TableHead>
                <SortableTableHead label={t("teacher:classes.table.studentCount")} sortKey="studentCount" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                <SortableTableHead label={t("teacher:classes.table.status")} sortKey="active" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                <TableHead className="text-right">{t("teacher:classes.table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((classRoom) => (
                <TableRow
                  key={classRoom.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedClassId(classRoom.id)}
                >
                  <TableCell className="font-medium">{classRoom.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {classRoom.grade ? displayGrade(classRoom.grade, t) : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatSchedulesCompact(classRoom.schedules, t) ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{classRoom.studentCount}</TableCell>
                  <TableCell>
                    <Badge variant={classRoom.active ? "default" : "secondary"}>
                      {classRoom.active ? t("teacher:classStatus.active") : t("teacher:classStatus.inactive")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-4">
                      <button
                        type="button"
                        className="text-sm font-semibold text-brand-dark underline-offset-4 hover:underline"
                        onClick={(e) => handleToggleActive(classRoom, e)}
                      >
                        {classRoom.active ? t("teacher:classStatus.inactive") : t("teacher:classes.activate")}
                      </button>
                      <button
                        type="button"
                        className="text-sm font-semibold text-destructive underline-offset-4 hover:underline"
                        onClick={(e) => handleRemove(classRoom, e)}
                      >
                        {t("common:actions.delete")}
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="mt-5 flex items-center justify-center gap-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setPage(currentPage - 1)}
              >
                {t("teacher:pagination.prev")}
              </Button>
              <span className="text-sm text-muted-foreground">
                {t("teacher:pagination.pageOf", { current: currentPage, total: totalPages })}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setPage(currentPage + 1)}
              >
                {t("teacher:pagination.next")}
              </Button>
            </div>
          )}
        </>
      )}

      <ClassFormModal open={isModalOpen} onOpenChange={setIsModalOpen} onCreated={handleCreated} />

      <ClassDetailModal
        classId={selectedClassId}
        onOpenChange={(open) => {
          if (!open) setSelectedClassId(null);
        }}
        onClassUpdated={handleClassUpdated}
      />
    </div>
  );
}

export default ClassesSection;
