import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import RequiredMark from "@/components/RequiredMark";
import { Button } from "@/components/ui/button";
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
import {
  addStudentToClass,
  fetchClasses,
  removeStudentFromClass,
  type ClassSummary,
} from "./classesApi";
import { displayGrade, GRADE_OPTIONS } from "./gradeOptions";
import { updateStudent, type Student } from "./studentsApi";

interface StudentDetailModalProps {
  student: Student | null;
  onOpenChange: (open: boolean) => void;
  onUpdated: (student: Student) => void;
}

function StudentDetailModal({ student, onOpenChange, onUpdated }: StudentDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [fullName, setFullName] = useState(student?.fullName ?? "");
  const [grade, setGrade] = useState(student?.grade ?? "");
  const [schoolName, setSchoolName] = useState(student?.schoolName ?? "");
  const [parentName, setParentName] = useState(student?.parentName ?? "");
  const [parentPhone, setParentPhone] = useState(student?.parentPhone ?? "");

  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [isClassBusy, setIsClassBusy] = useState(false);

  useEffect(() => {
    fetchClasses()
      .then(setClasses)
      .catch(() => toast.error("Không thể tải danh sách lớp học."));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!student) return;

    if (!fullName.trim()) {
      toast.error("Vui lòng nhập họ tên học sinh.");
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await updateStudent(student.id, {
        fullName: fullName.trim(),
        grade,
        schoolName: schoolName.trim(),
        parentName: parentName.trim(),
        parentPhone: parentPhone.trim(),
      });
      onUpdated({ ...updated, classes: student.classes });
      setIsEditing(false);
      toast.success("Đã cập nhật thông tin học sinh.");
    } catch {
      toast.error("Cập nhật thất bại. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAddClass() {
    if (!student || !selectedClassId) return;
    setIsClassBusy(true);
    try {
      const classDetail = await addStudentToClass(Number(selectedClassId), student.id);
      const updatedStudent = classDetail.students.find((s) => s.id === student.id);
      if (updatedStudent) {
        onUpdated(updatedStudent);
        if (updatedStudent.active && !student.active) {
          toast.success("Đã thêm vào lớp và tự động kích hoạt tài khoản.");
        } else {
          toast.success("Đã thêm vào lớp.");
        }
      }
      setSelectedClassId("");
    } catch {
      toast.error("Không thể thêm vào lớp học.");
    } finally {
      setIsClassBusy(false);
    }
  }

  async function handleRemoveClass(classId: number) {
    if (!student) return;
    setIsClassBusy(true);
    try {
      await removeStudentFromClass(classId, student.id);
      onUpdated({ ...student, classes: student.classes.filter((c) => c.id !== classId) });
      toast.success("Đã xoá khỏi lớp học.");
    } catch {
      toast.error("Không thể xoá khỏi lớp học.");
    } finally {
      setIsClassBusy(false);
    }
  }

  const availableClasses = student
    ? classes.filter((c) => !student.classes.some((sc) => sc.id === c.id))
    : [];

  return (
    <Dialog open={student !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Chỉnh sửa học sinh" : "Thông tin học sinh"}</DialogTitle>
        </DialogHeader>

        {student && !isEditing && (
          <>
            <dl className="flex flex-col gap-4">
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Họ tên</dt>
                <dd className="text-sm font-medium text-foreground">{student.fullName}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Tên đăng nhập</dt>
                <dd className="text-sm font-medium text-foreground">{student.username}</dd>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Khối lớp</dt>
                  <dd className="text-sm font-medium text-foreground">
                    {student.grade ? displayGrade(student.grade) : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Trường học</dt>
                  <dd className="text-sm font-medium text-foreground">
                    {student.schoolName || "—"}
                  </dd>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Tên phụ huynh</dt>
                  <dd className="text-sm font-medium text-foreground">
                    {student.parentName || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">SĐT phụ huynh</dt>
                  <dd className="text-sm font-medium text-foreground">
                    {student.parentPhone || "—"}
                  </dd>
                </div>
              </div>
              <div>
                <dt className="mb-1 text-xs font-medium text-muted-foreground">Trạng thái</dt>
                <dd>
                  <Badge variant={student.active ? "default" : "secondary"}>
                    {student.active ? "Đã kích hoạt" : "Chưa kích hoạt"}
                  </Badge>
                </dd>
              </div>
            </dl>

            <Button type="button" variant="outline" onClick={() => setIsEditing(true)}>
              Chỉnh sửa
            </Button>

            <div className="flex flex-col gap-3 border-t border-border pt-4">
              <h3 className="text-sm font-semibold text-foreground">Lớp học</h3>

              {student.classes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa thuộc lớp học nào.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {student.classes.map((c) => (
                    <li
                      key={c.id}
                      className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                    >
                      <span className="text-sm font-medium text-foreground">{c.name}</span>
                      <button
                        type="button"
                        className="text-sm font-semibold text-destructive underline-offset-4 hover:underline"
                        onClick={() => handleRemoveClass(c.id)}
                        disabled={isClassBusy}
                      >
                        Xoá
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {availableClasses.length > 0 && (
                <div className="flex gap-2">
                  <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                    <SelectTrigger className="w-full" disabled={isClassBusy}>
                      <SelectValue placeholder="Chọn lớp" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableClasses.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddClass}
                    disabled={!selectedClassId || isClassBusy}
                  >
                    Thêm
                  </Button>
                </div>
              )}
            </div>
          </>
        )}

        {student && isEditing && (
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="d-fullname">
                Họ tên học sinh
                <RequiredMark />
              </Label>
              <Input
                id="d-fullname"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isSubmitting}
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="d-grade">Khối lớp</Label>
                <Select value={grade} onValueChange={setGrade}>
                  <SelectTrigger id="d-grade" className="w-full" disabled={isSubmitting}>
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
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="d-school">Trường học</Label>
                <Input
                  id="d-school"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="d-parent-name">Tên phụ huynh</Label>
                <Input
                  id="d-parent-name"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="d-parent-phone">SĐT phụ huynh</Label>
                <Input
                  id="d-parent-phone"
                  type="tel"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
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
        )}
      </DialogContent>
    </Dialog>
  );
}

export default StudentDetailModal;
