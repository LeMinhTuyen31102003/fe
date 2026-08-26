import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import RequiredMark from "@/components/RequiredMark";
import { addStudentToClass, fetchClasses, type ClassSummary } from "./classesApi";
import { GRADE_OPTIONS } from "./gradeOptions";
import { createStudent } from "./studentsApi";

interface StudentFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

function StudentFormModal({ open, onOpenChange, onCreated }: StudentFormModalProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [grade, setGrade] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [activateNow, setActivateNow] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [pendingClasses, setPendingClasses] = useState<ClassSummary[]>([]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetchClasses()
      .then((data) => {
        if (!cancelled) setClasses(data);
      })
      .catch(() => {
        if (!cancelled) toast.error("Không thể tải danh sách lớp học.");
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  function resetForm() {
    setUsername("");
    setPassword("");
    setFullName("");
    setGrade("");
    setSchoolName("");
    setParentName("");
    setParentPhone("");
    setActivateNow(false);
    setSelectedClassId("");
    setPendingClasses([]);
  }

  function handleAddPendingClass() {
    if (!selectedClassId) return;
    const classRoom = classes.find((c) => c.id === Number(selectedClassId));
    if (!classRoom) return;
    setPendingClasses((prev) => [...prev, classRoom]);
    setSelectedClassId("");
  }

  function handleRemovePendingClass(classId: number) {
    setPendingClasses((prev) => prev.filter((c) => c.id !== classId));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!username.trim() || !fullName.trim()) {
      toast.error("Vui lòng nhập đầy đủ tên đăng nhập và họ tên học sinh.");
      return;
    }
    if (password.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createStudent({
        username: username.trim(),
        password,
        fullName: fullName.trim(),
        grade,
        schoolName: schoolName.trim(),
        parentName: parentName.trim(),
        parentPhone: parentPhone.trim(),
        active: activateNow,
      });

      if (pendingClasses.length > 0) {
        const results = await Promise.allSettled(
          pendingClasses.map((c) => addStudentToClass(c.id, created.id)),
        );
        const failed = results.filter((r) => r.status === "rejected").length;
        if (failed > 0) {
          toast.error(`Đã tạo tài khoản nhưng thêm vào ${failed} lớp học thất bại.`);
        }
      }

      onCreated();
      resetForm();
      toast.success("Đã tạo tài khoản học sinh.");
    } catch (err) {
      if (err instanceof Error && err.message === "DUPLICATE_USERNAME") {
        toast.error("Tên đăng nhập đã tồn tại.");
      } else {
        toast.error("Tạo tài khoản thất bại. Vui lòng thử lại.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const availableClasses = classes.filter(
    (c) => !pendingClasses.some((p) => p.id === c.id),
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) resetForm();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tạo tài khoản học sinh</DialogTitle>
          <DialogDescription>
            Nhập thông tin đăng ký cho học sinh. Mặc định tài khoản sẽ ở trạng thái
            chưa kích hoạt cho đến khi được thêm vào lớp, trừ khi bạn chọn kích hoạt
            ngay.
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="s-username">
                Tên đăng nhập
                <RequiredMark />
              </Label>
              <Input
                id="s-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isSubmitting}
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="s-password">
                Mật khẩu
                <RequiredMark />
              </Label>
              <Input
                id="s-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="s-fullname">
              Họ tên học sinh
              <RequiredMark />
            </Label>
            <Input
              id="s-fullname"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="s-grade">Khối lớp</Label>
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger id="s-grade" className="w-full" disabled={isSubmitting}>
                  <SelectValue placeholder="Chọn khối" />
                </SelectTrigger>
                <SelectContent>
                  {GRADE_OPTIONS.map((g) => (
                    <SelectItem key={g} value={g}>
                      {/^\d+$/.test(g) ? `Lớp ${g}` : g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="s-school">Trường học</Label>
              <Input
                id="s-school"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="s-parent-name">Tên phụ huynh</Label>
              <Input
                id="s-parent-name"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="s-parent-phone">SĐT phụ huynh</Label>
              <Input
                id="s-parent-phone"
                type="tel"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Lớp học (không bắt buộc)</Label>
            {pendingClasses.length > 0 && (
              <ul className="flex flex-col gap-1.5">
                {pendingClasses.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-1.5 text-sm"
                  >
                    <span>{c.name}</span>
                    <button
                      type="button"
                      className="text-xs font-semibold text-destructive underline-offset-4 hover:underline"
                      onClick={() => handleRemovePendingClass(c.id)}
                      disabled={isSubmitting}
                    >
                      Xoá
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {availableClasses.length > 0 ? (
              <div className="flex gap-2">
                <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                  <SelectTrigger className="w-full" disabled={isSubmitting}>
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
                  onClick={handleAddPendingClass}
                  disabled={!selectedClassId || isSubmitting}
                >
                  Thêm
                </Button>
              </div>
            ) : classes.length === 0 ? (
              <p className="text-xs text-muted-foreground">Chưa có lớp học nào.</p>
            ) : null}
          </div>

          <Label htmlFor="s-active" className="font-normal">
            <Checkbox
              id="s-active"
              checked={activateNow}
              onCheckedChange={(checked) => setActivateNow(checked === true)}
              disabled={isSubmitting}
            />
            Kích hoạt tài khoản ngay
          </Label>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Đang tạo..." : "Tạo tài khoản"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default StudentFormModal;
