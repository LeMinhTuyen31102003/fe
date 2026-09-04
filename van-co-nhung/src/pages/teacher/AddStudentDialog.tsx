import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { addStudentToClass, ClassConflictError, type ClassDetail } from "./classesApi";
import { fetchStudents, type Student } from "./studentsApi";

const SEARCH_DEBOUNCE_MS = 300;

interface AddStudentDialogProps {
  open: boolean;
  classId: number | null;
  onOpenChange: (open: boolean) => void;
  onStudentAdded: (detail: ClassDetail) => void;
}

function AddStudentDialog({ open, classId, onOpenChange, onStudentAdded }: AddStudentDialogProps) {
  const { t } = useTranslation(["teacher", "common"]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [addingId, setAddingId] = useState<number | null>(null);

  useEffect(() => {
    const trimmed = searchInput.trim();
    if (trimmed === search) return;
    const handle = setTimeout(() => {
      setIsLoading(true);
      setSearch(trimmed);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  useEffect(() => {
    if (!open || classId === null) return;
    let cancelled = false;

    fetchStudents({ assignableToClassId: classId, search: search || undefined })
      .then((list) => {
        if (!cancelled) setStudents(list);
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
  }, [open, classId, search]);

  function handleOpenChange(next: boolean) {
    if (next) {
      setIsLoading(true);
    } else {
      setSearchInput("");
      setSearch("");
      setStudents([]);
    }
    onOpenChange(next);
  }

  async function handleAdd(student: Student) {
    if (classId === null) return;
    setAddingId(student.id);
    try {
      const updated = await addStudentToClass(classId, student.id);
      setStudents((prev) => prev.filter((s) => s.id !== student.id));
      onStudentAdded(updated);
      toast.success(
        !student.active
          ? t("teacher:classDetail.addedStudentAutoActivated")
          : t("teacher:classDetail.addedStudent"),
      );
    } catch (err) {
      if (err instanceof ClassConflictError) {
        toast.error(t("teacher:classConflict", { className: err.className }));
        setStudents((prev) => prev.filter((s) => s.id !== student.id));
      } else {
        toast.error(t("teacher:classDetail.addStudentError"));
      }
    } finally {
      setAddingId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("teacher:classDetail.addStudentDialogTitle")}</DialogTitle>
        </DialogHeader>

        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder={t("teacher:classDetail.addStudentSearchPlaceholder")}
          autoFocus
        />

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">{t("common:status.loading")}</p>
          ) : students.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("teacher:classDetail.noStudentsToAdd")}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {students.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{s.fullName}</p>
                    <p className="text-xs text-muted-foreground">{s.username}</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleAdd(s)}
                    disabled={addingId === s.id}
                  >
                    {addingId === s.id ? t("teacher:classDetail.addingStudent") : t("common:actions.add")}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AddStudentDialog;
