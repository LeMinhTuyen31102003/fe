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
import { addStudentToClass, ClassConflictError, fetchClasses, type ClassSummary } from "./classesApi";
import { displayGrade } from "./gradeOptions";
import type { Student } from "./studentsApi";

const SEARCH_DEBOUNCE_MS = 300;

interface AddClassDialogProps {
  open: boolean;
  student: Student | null;
  onOpenChange: (open: boolean) => void;
  onStudentUpdated: (student: Student) => void;
}

function AddClassDialog({ open, student, onOpenChange, onStudentUpdated }: AddClassDialogProps) {
  const { t } = useTranslation(["teacher", "common"]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [classes, setClasses] = useState<ClassSummary[]>([]);
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
    if (!open || student === null) return;
    let cancelled = false;

    fetchClasses({ assignableToStudentId: student.id, search: search || undefined, status: "active" })
      .then((list) => {
        if (!cancelled) setClasses(list);
      })
      .catch(() => {
        if (!cancelled) toast.error(t("teacher:studentDetail.loadClassesError"));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, student, search]);

  function handleOpenChange(next: boolean) {
    if (next) {
      setIsLoading(true);
    } else {
      setSearchInput("");
      setSearch("");
      setClasses([]);
    }
    onOpenChange(next);
  }

  async function handleAdd(classSummary: ClassSummary) {
    if (student === null) return;
    setAddingId(classSummary.id);
    try {
      const classDetail = await addStudentToClass(classSummary.id, student.id);
      const updatedStudent = classDetail.students.find((s) => s.id === student.id);
      setClasses((prev) => prev.filter((c) => c.id !== classSummary.id));
      if (updatedStudent) {
        onStudentUpdated(updatedStudent);
        toast.success(
          updatedStudent.active && !student.active
            ? t("teacher:studentDetail.addedToClassAutoActivated")
            : t("teacher:studentDetail.addedToClass"),
        );
      }
    } catch (err) {
      if (err instanceof ClassConflictError) {
        toast.error(t("teacher:classConflict", { className: err.className }));
        setClasses((prev) => prev.filter((c) => c.id !== classSummary.id));
      } else {
        toast.error(t("teacher:studentDetail.addToClassError"));
      }
    } finally {
      setAddingId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("teacher:studentDetail.addClassDialogTitle")}</DialogTitle>
        </DialogHeader>

        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder={t("teacher:studentDetail.addClassSearchPlaceholder")}
          autoFocus
        />

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">{t("common:status.loading")}</p>
          ) : classes.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("teacher:studentDetail.noClassesToAdd")}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {classes.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{c.name}</p>
                    {c.grade && <p className="text-xs text-muted-foreground">{displayGrade(c.grade, t)}</p>}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleAdd(c)}
                    disabled={addingId === c.id}
                  >
                    {addingId === c.id ? t("teacher:classDetail.addingStudent") : t("common:actions.add")}
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

export default AddClassDialog;
