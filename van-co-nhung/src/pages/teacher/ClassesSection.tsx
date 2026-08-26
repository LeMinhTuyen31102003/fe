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

const PAGE_SIZE = 10;

type StatusFilter = "all" | "active" | "inactive";

function ClassesSection() {
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;

    fetchClasses()
      .then((data) => {
        if (!cancelled) setClasses(data);
      })
      .catch(() => {
        if (!cancelled) toast.error("Không thể tải danh sách lớp học.");
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

  async function handleToggleActive(classRoom: ClassSummary, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      const updated = await setClassActive(classRoom.id, !classRoom.active);
      setClasses((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    } catch {
      toast.error("Không thể cập nhật trạng thái lớp học.");
    }
  }

  async function handleRemove(classRoom: ClassSummary, e: React.MouseEvent) {
    e.stopPropagation();
    if (!window.confirm(`Xoá lớp học "${classRoom.name}"?`)) return;
    try {
      await deleteClass(classRoom.id);
      setClasses((prev) => prev.filter((c) => c.id !== classRoom.id));
    } catch {
      toast.error("Không thể xoá lớp học.");
    }
  }

  function handleCreated(classRoom: ClassSummary) {
    setClasses((prev) => [classRoom, ...prev]);
    setIsModalOpen(false);
    toast.success("Đã tạo lớp học.");
  }

  function handleClassUpdated(updated: ClassSummary) {
    setClasses((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return classes.filter((c) => {
      const matchesKeyword = !keyword || c.name.toLowerCase().includes(keyword);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && c.active) ||
        (statusFilter === "inactive" && !c.active);
      return matchesKeyword && matchesStatus;
    });
  }, [classes, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <div className="rounded-xl border border-border bg-background p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-xl font-bold text-foreground">
          Danh sách lớp học
        </h2>
        <div className="flex flex-wrap items-center gap-2.5">
          <Input
            type="search"
            placeholder="Tìm theo tên lớp học..."
            className="w-[260px]"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          <Select
            value={statusFilter}
            onValueChange={(v) => handleStatusFilterChange(v as StatusFilter)}
          >
            <SelectTrigger className="w-[190px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="active">Đang hoạt động</SelectItem>
              <SelectItem value="inactive">Ngừng hoạt động</SelectItem>
            </SelectContent>
          </Select>
          <Button type="button" onClick={() => setIsModalOpen(true)}>
            + Thêm lớp học
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Đang tải...</p>
      ) : classes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa có lớp học nào.</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">Không tìm thấy lớp học phù hợp.</p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên lớp</TableHead>
                <TableHead>Khối lớp</TableHead>
                <TableHead>Lịch học</TableHead>
                <TableHead>Sĩ số</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
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
                    {classRoom.grade ? displayGrade(classRoom.grade) : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatSchedulesCompact(classRoom.schedules) ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{classRoom.studentCount}</TableCell>
                  <TableCell>
                    <Badge variant={classRoom.active ? "default" : "secondary"}>
                      {classRoom.active ? "Đang hoạt động" : "Ngừng hoạt động"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-4">
                      <button
                        type="button"
                        className="text-sm font-semibold text-brand-dark underline-offset-4 hover:underline"
                        onClick={(e) => handleToggleActive(classRoom, e)}
                      >
                        {classRoom.active ? "Ngừng hoạt động" : "Kích hoạt"}
                      </button>
                      <button
                        type="button"
                        className="text-sm font-semibold text-destructive underline-offset-4 hover:underline"
                        onClick={(e) => handleRemove(classRoom, e)}
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
