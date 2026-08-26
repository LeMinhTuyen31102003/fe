import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
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
import { cn } from "@/lib/utils";
import { fetchClasses, type ClassSummary } from "./classesApi";
import { compareGrade, displayGrade } from "./gradeOptions";
import StudentDetailModal from "./StudentDetailModal";
import StudentFormModal from "./StudentFormModal";
import {
  deleteStudent,
  fetchStudents,
  setStudentActive,
  type Student,
} from "./studentsApi";

const PAGE_SIZE = 10;

type StatusFilter = "all" | "active" | "inactive";
type SortKey = "fullName" | "grade" | "username" | "active" | "createdAt";
type SortDir = "asc" | "desc";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("vi-VN");
}

interface SortableHeadProps {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  dir: SortDir;
  onSort: (key: SortKey) => void;
  className?: string;
}

function SortableHead({ label, sortKey, activeKey, dir, onSort, className }: SortableHeadProps) {
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

function StudentsSection() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [classFilter, setClassFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>("fullName");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  useEffect(() => {
    let cancelled = false;

    Promise.all([fetchStudents(), fetchClasses()])
      .then(([studentData, classData]) => {
        if (cancelled) return;
        setStudents(studentData);
        setClasses(classData);
      })
      .catch(() => {
        if (!cancelled) toast.error("Không thể tải danh sách học sinh.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleStatusFilterChange(value: StatusFilter) {
    setStatusFilter(value);
    setPage(1);
  }

  function handleClassFilterChange(value: string) {
    setClassFilter(value);
    setPage(1);
  }

  function handleSort(key: SortKey) {
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
      toast.error("Không thể cập nhật trạng thái học sinh.");
    }
  }

  async function handleRemove(student: Student, e: React.MouseEvent) {
    e.stopPropagation();
    if (!window.confirm(`Xoá tài khoản của "${student.fullName}"?`)) return;
    try {
      await deleteStudent(student.id);
      setStudents((prev) => prev.filter((s) => s.id !== student.id));
    } catch {
      toast.error("Không thể xoá học sinh.");
    }
  }

  async function handleCreated() {
    setIsModalOpen(false);
    try {
      setStudents(await fetchStudents());
    } catch {
      toast.error("Không thể tải lại danh sách học sinh.");
    }
  }

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return students.filter((s) => {
      const matchesKeyword =
        !keyword ||
        s.fullName.toLowerCase().includes(keyword) ||
        s.username.toLowerCase().includes(keyword);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && s.active) ||
        (statusFilter === "inactive" && !s.active);
      const matchesClass =
        classFilter === "all" || s.classes.some((c) => String(c.id) === classFilter);
      return matchesKeyword && matchesStatus && matchesClass;
    });
  }, [students, search, statusFilter, classFilter]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "fullName":
          cmp = a.fullName.localeCompare(b.fullName, "vi");
          break;
        case "grade":
          cmp = compareGrade(a.grade ?? "", b.grade ?? "");
          break;
        case "username":
          cmp = a.username.localeCompare(b.username);
          break;
        case "active":
          cmp = Number(a.active) - Number(b.active);
          break;
        case "createdAt":
          cmp = (a.createdAt ?? "").localeCompare(b.createdAt ?? "");
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = sorted.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <div className="rounded-xl border border-border bg-background p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-xl font-bold text-foreground">
          Danh sách học sinh
        </h2>
        <div className="flex flex-wrap items-center gap-2.5">
          <Input
            type="search"
            placeholder="Tìm theo họ tên hoặc tên đăng nhập..."
            className="w-[280px]"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          <Select
            value={statusFilter}
            onValueChange={(v) => handleStatusFilterChange(v as StatusFilter)}
          >
            <SelectTrigger className="w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="active">Đã kích hoạt</SelectItem>
              <SelectItem value="inactive">Chưa kích hoạt</SelectItem>
            </SelectContent>
          </Select>
          <Select value={classFilter} onValueChange={handleClassFilterChange}>
            <SelectTrigger className="w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả lớp</SelectItem>
              {classes.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" onClick={() => setIsModalOpen(true)}>
            + Thêm học sinh
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Đang tải...</p>
      ) : students.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa có học sinh nào.</p>
      ) : sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">Không tìm thấy học sinh phù hợp.</p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHead label="Họ tên" sortKey="fullName" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                <SortableHead label="Khối lớp" sortKey="grade" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                <SortableHead label="Tên đăng nhập" sortKey="username" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                <TableHead>Phụ huynh</TableHead>
                <SortableHead label="Trạng thái" sortKey="active" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                <SortableHead label="Ngày tạo" sortKey="createdAt" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                <TableHead className="text-right">Thao tác</TableHead>
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
                    {student.grade ? displayGrade(student.grade) : "—"}
                  </TableCell>
                  <TableCell>{student.username}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {student.parentName || student.parentPhone
                      ? [student.parentName, student.parentPhone].filter(Boolean).join(" · ")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={student.active ? "default" : "secondary"}>
                      {student.active ? "Đã kích hoạt" : "Chưa kích hoạt"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(student.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-4">
                      <button
                        type="button"
                        className="text-sm font-semibold text-brand-dark underline-offset-4 hover:underline"
                        onClick={(e) => handleToggleActive(student, e)}
                      >
                        {student.active ? "Vô hiệu hoá" : "Kích hoạt"}
                      </button>
                      <button
                        type="button"
                        className="text-sm font-semibold text-destructive underline-offset-4 hover:underline"
                        onClick={(e) => handleRemove(student, e)}
                      >
                        Xoá
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
                ‹ Trước
              </Button>
              <span className="text-sm text-muted-foreground">
                Trang {currentPage}/{totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setPage(currentPage + 1)}
              >
                Sau ›
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
