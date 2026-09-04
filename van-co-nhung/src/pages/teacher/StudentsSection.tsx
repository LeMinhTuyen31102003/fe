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
import { fetchClasses, type ClassSummary } from "./classesApi";
import { displayGrade } from "./gradeOptions";
import { SortableTableHead, type SortDir } from "./SortableTableHead";
import StudentDetailModal from "./StudentDetailModal";
import StudentFormModal from "./StudentFormModal";
import {
  deleteStudent,
  fetchStudents,
  setStudentActive,
  type Student,
} from "./studentsApi";

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

type StatusFilter = "all" | "active" | "inactive";
type SortKey = "fullName" | "grade" | "username" | "active" | "createdAt";

function formatDate(value: string | null, locale: string) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(locale);
}

function StudentsSection() {
  const { t, i18n } = useTranslation(["teacher", "common"]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [classFilter, setClassFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>("fullName");
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
    fetchClasses()
      .then(setClasses)
      .catch(() => toast.error(t("teacher:students.loadError")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetchStudents({
      search,
      status: statusFilter,
      classId: classFilter === "all" ? null : Number(classFilter),
      sortBy: sortKey,
      sortDir,
    })
      .then((data) => {
        if (!cancelled) setStudents(data);
      })
      .catch(() => {
        if (!cancelled) toast.error(t("teacher:students.loadError"));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, classFilter, sortKey, sortDir]);

  function handleStatusFilterChange(value: StatusFilter) {
    setIsLoading(true);
    setStatusFilter(value);
    setPage(1);
  }

  function handleClassFilterChange(value: string) {
    setIsLoading(true);
    setClassFilter(value);
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

  async function handleToggleActive(student: Student, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      const updated = await setStudentActive(student.id, !student.active);
      setStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setSelectedStudent((prev) => (prev?.id === updated.id ? updated : prev));
    } catch {
      toast.error(t("teacher:students.toggleActiveError"));
    }
  }

  async function handleRemove(student: Student, e: React.MouseEvent) {
    e.stopPropagation();
    if (!window.confirm(t("teacher:students.deleteConfirm", { name: student.fullName }))) return;
    try {
      await deleteStudent(student.id);
      setStudents((prev) => prev.filter((s) => s.id !== student.id));
    } catch {
      toast.error(t("teacher:students.deleteError"));
    }
  }

  async function handleCreated() {
    setIsModalOpen(false);
    try {
      setStudents(
        await fetchStudents({
          search,
          status: statusFilter,
          classId: classFilter === "all" ? null : Number(classFilter),
          sortBy: sortKey,
          sortDir,
        }),
      );
    } catch {
      toast.error(t("teacher:students.reloadError"));
    }
  }

  const totalPages = Math.max(1, Math.ceil(students.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = students.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <div className="rounded-xl border border-border bg-background p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-xl font-bold text-foreground">
          {t("teacher:students.listTitle")}
        </h2>
        <div className="flex flex-wrap items-center gap-2.5">
          <Input
            type="search"
            placeholder={t("teacher:students.searchPlaceholder")}
            className="w-[280px]"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <Select
            value={statusFilter}
            onValueChange={(v) => handleStatusFilterChange(v as StatusFilter)}
          >
            <SelectTrigger className="w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("teacher:students.statusFilterAll")}</SelectItem>
              <SelectItem value="active">{t("teacher:studentStatus.active")}</SelectItem>
              <SelectItem value="inactive">{t("teacher:studentStatus.inactive")}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={classFilter} onValueChange={handleClassFilterChange}>
            <SelectTrigger className="w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("teacher:students.classFilterAll")}</SelectItem>
              {classes.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" onClick={() => setIsModalOpen(true)}>
            {t("teacher:students.add")}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t("common:status.loading")}</p>
      ) : students.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("teacher:students.noResults")}</p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead label={t("teacher:students.table.fullName")} sortKey="fullName" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                <SortableTableHead label={t("teacher:students.table.grade")} sortKey="grade" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                <SortableTableHead label={t("teacher:students.table.username")} sortKey="username" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                <TableHead>{t("teacher:students.table.parent")}</TableHead>
                <SortableTableHead label={t("teacher:students.table.status")} sortKey="active" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                <SortableTableHead label={t("teacher:students.table.createdAt")} sortKey="createdAt" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                <TableHead className="text-right">{t("teacher:students.table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((student) => (
                <TableRow
                  key={student.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedStudent(student)}
                >
                  <TableCell className="font-medium">{student.fullName}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {student.grade ? displayGrade(student.grade, t) : "—"}
                  </TableCell>
                  <TableCell>{student.username}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {student.parentName || student.parentPhone
                      ? [student.parentName, student.parentPhone].filter(Boolean).join(" · ")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={student.active ? "default" : "secondary"}>
                      {student.active ? t("teacher:studentStatus.active") : t("teacher:studentStatus.inactive")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(student.createdAt, i18n.language === "en" ? "en-US" : "vi-VN")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-4">
                      <button
                        type="button"
                        className="text-sm font-semibold text-brand-dark underline-offset-4 hover:underline"
                        onClick={(e) => handleToggleActive(student, e)}
                      >
                        {student.active ? t("teacher:students.deactivate") : t("teacher:students.activate")}
                      </button>
                      <button
                        type="button"
                        className="text-sm font-semibold text-destructive underline-offset-4 hover:underline"
                        onClick={(e) => handleRemove(student, e)}
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

      <StudentFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onCreated={handleCreated}
      />

      <StudentDetailModal
        key={selectedStudent?.id ?? "none"}
        student={selectedStudent}
        onOpenChange={(open) => {
          if (!open) setSelectedStudent(null);
        }}
        onUpdated={(updated) => {
          setStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
          setSelectedStudent(updated);
        }}
      />
    </div>
  );
}

export default StudentsSection;
