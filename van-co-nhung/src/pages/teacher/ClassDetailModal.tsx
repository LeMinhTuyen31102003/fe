import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import RequiredMark from "@/components/RequiredMark";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  addStudentToClass,
  fetchClassDetail,
  removeStudentFromClass,
  updateClass,
  type ClassDetail,
  type ClassSummary,
  type ScheduleSlotInput,
} from "./classesApi";
import { displayGrade, GRADE_OPTIONS } from "./gradeOptions";
import ScheduleSlotEditor from "./ScheduleSlotEditor";
import { formatScheduleSlot, sortSchedules } from "./scheduleOptions";
import { fetchStudents, type Student } from "./studentsApi";

interface ClassDetailModalProps {
  classId: number | null;
  onOpenChange: (open: boolean) => void;
  onClassUpdated: (classRoom: ClassSummary) => void;
}

function ClassDetailModal({ classId, onOpenChange, onClassUpdated }: ClassDetailModalProps) {
  const [detail, setDetail] = useState<ClassDetail | null>(null);
  const [loadedClassId, setLoadedClassId] = useState<number | null>(null);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState("");

  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");
  const [schedules, setSchedules] = useState<ScheduleSlotInput[]>([]);
  const [note, setNote] = useState("");

  const isLoading = classId !== null && loadedClassId !== classId;

  useEffect(() => {
    if (classId === null) return;
    let cancelled = false;

    Promise.all([fetchClassDetail(classId), fetchStudents()])
      .then(([classDetail, students]) => {
        if (cancelled) return;
        setDetail(classDetail);
        setLoadedClassId(classId);
        setIsEditing(false);
        setName(classDetail.name);
        setGrade(classDetail.grade ?? "");
        setSchedules(
          classDetail.schedules.map((s) => ({
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
          })),
        );
        setNote(classDetail.note ?? "");
        setAllStudents(students);
      })
      .catch(() => {
        if (cancelled) return;
        setLoadedClassId(classId);
        toast.error("Không thể tải thông tin lớp học.");
      });

    return () => {
      cancelled = true;
    };
  }, [classId]);

  async function handleSaveInfo(e: FormEvent) {
    e.preventDefault();
    if (!detail) return;
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên lớp học.");
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await updateClass(detail.id, {
        name: name.trim(),
        grade,
        schedules,
        note: note.trim(),
      });
      setDetail((prev) => (prev ? { ...prev, ...updated } : prev));
      onClassUpdated(updated);
      setIsEditing(false);
      toast.success("Đã cập nhật thông tin lớp học.");
    } catch {
      toast.error("Cập nhật thất bại. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAddStudent() {
    if (!detail || !selectedStudentId) return;
    const wasInactive = allStudents.find((s) => s.id === Number(selectedStudentId))?.active === false;

    setIsAddingStudent(true);
    try {
      const updated = await addStudentToClass(detail.id, Number(selectedStudentId));
      setDetail(updated);
      setSelectedStudentId("");
      onClassUpdated({
        id: updated.id,
        name: updated.name,
        grade: updated.grade,
        schedules: updated.schedules,
        note: updated.note,
        active: updated.active,
        studentCount: updated.students.length,
      });
      toast.success(
        wasInactive
          ? "Đã thêm học sinh vào lớp và tự động kích hoạt tài khoản."
          : "Đã thêm học sinh vào lớp.",
      );
    } catch {
      toast.error("Không thể thêm học sinh vào lớp.");
    } finally {
      setIsAddingStudent(false);
    }
  }

  async function handleRemoveStudent(studentId: number) {
    if (!detail) return;
    try {
      const updated = await removeStudentFromClass(detail.id, studentId);
      setDetail(updated);
      onClassUpdated({
        id: updated.id,
        name: updated.name,
        grade: updated.grade,
        schedules: updated.schedules,
        note: updated.note,
        active: updated.active,
        studentCount: updated.students.length,
      });
      toast.success("Đã xoá học sinh khỏi lớp.");
    } catch {
      toast.error("Không thể xoá học sinh khỏi lớp.");
    }
  }

  const availableStudents = detail
    ? allStudents.filter((s) => !detail.students.some((cs) => cs.id === s.id))
    : [];

  return (
    <Dialog open={classId !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Chỉnh sửa lớp học" : "Thông tin lớp học"}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Đang tải...</p>
        ) : !detail ? (
          <p className="text-sm text-muted-foreground">Không thể tải thông tin lớp học.</p>
        ) : isEditing ? (
          <form className="flex flex-col gap-4" onSubmit={handleSaveInfo}>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ce-name">
                Tên lớp học
                <RequiredMark />
              </Label>
              <Input
                id="ce-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ce-grade">Khối lớp</Label>
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger id="ce-grade" className="w-full" disabled={isSubmitting}>
                  <SelectValue placeholder="Chọn khối" />
                </SelectTrigger>
                <SelectContent>
                  {GRADE_OPTIONS.map((g) => (
                    <SelectItem key={g} value={g}>
                      {displayGrade(g)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ScheduleSlotEditor slots={schedules} onChange={setSchedules} disabled={isSubmitting} />

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ce-note">Ghi chú</Label>
              <Textarea
                id="ce-note"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setIsEditing(false)}
                disabled={isSubmitting}
              >
                Huỷ
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? "Đang lưu..." : "Lưu"}
              </Button>
            </div>
          </form>
        ) : (
          <>
            <dl className="flex flex-col gap-4">
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Tên lớp học</dt>
                <dd className="text-sm font-medium text-foreground">{detail.name}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Khối lớp</dt>
                <dd className="text-sm font-medium text-foreground">
                  {detail.grade ? displayGrade(detail.grade) : "—"}
                </dd>
              </div>
              <div>
                <dt className="mb-1 text-xs font-medium text-muted-foreground">Lịch học</dt>
                {detail.schedules.length === 0 ? (
                  <dd className="text-sm font-medium text-foreground">—</dd>
                ) : (
                  <dd className="flex flex-col gap-1">
                    {sortSchedules(detail.schedules).map((slot) => (
                      <span key={slot.id} className="text-sm font-medium text-foreground">
                        {formatScheduleSlot(slot)}
                      </span>
                    ))}
                  </dd>
                )}
              </div>
              {detail.note && (
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Ghi chú</dt>
                  <dd className="text-sm text-foreground whitespace-pre-wrap">{detail.note}</dd>
                </div>
              )}
              <div>
                <dt className="mb-1 text-xs font-medium text-muted-foreground">Trạng thái</dt>
                <dd>
                  <Badge variant={detail.active ? "default" : "secondary"}>
                    {detail.active ? "Đang hoạt động" : "Ngừng hoạt động"}
                  </Badge>
                </dd>
              </div>
            </dl>

            <Button type="button" variant="outline" onClick={() => setIsEditing(true)}>
              Chỉnh sửa
            </Button>

            <div className="flex flex-col gap-3 border-t border-border pt-4">
              <h3 className="text-sm font-semibold text-foreground">
                Học sinh trong lớp ({detail.students.length})
              </h3>

              {detail.students.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa có học sinh nào trong lớp.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {detail.students.map((student) => (
                    <li
                      key={student.id}
                      className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{student.fullName}</p>
                        <p className="text-xs text-muted-foreground">{student.username}</p>
                      </div>
                      <button
                        type="button"
                        className="text-sm font-semibold text-destructive underline-offset-4 hover:underline"
                        onClick={() => handleRemoveStudent(student.id)}
                      >
                        Xoá
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {availableStudents.length > 0 ? (
                <div className="flex items-end gap-2">
                  <div className="flex flex-1 flex-col gap-1.5">
                    <Label htmlFor="add-student">Thêm học sinh</Label>
                    <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                      <SelectTrigger id="add-student" className="w-full" disabled={isAddingStudent}>
                        <SelectValue placeholder="Chọn học sinh" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableStudents.map((s) => (
                          <SelectItem key={s.id} value={String(s.id)}>
                            {s.fullName} ({s.username})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    onClick={handleAddStudent}
                    disabled={!selectedStudentId || isAddingStudent}
                  >
                    {isAddingStudent ? "Đang thêm..." : "Thêm"}
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Không còn học sinh nào để thêm vào lớp.
                </p>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default ClassDetailModal;
