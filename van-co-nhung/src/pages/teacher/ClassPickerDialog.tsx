import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { fetchClasses, type ClassSummary } from "./classesApi";
import { displayGrade } from "./gradeOptions";

const SEARCH_DEBOUNCE_MS = 300;

interface ClassPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (classSummary: ClassSummary) => void;
}

function ClassPickerDialog({ open, onOpenChange, onSelect }: ClassPickerDialogProps) {
  const { t } = useTranslation(["teacher", "common"]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
    if (!open) return;
    let cancelled = false;

    fetchClasses({ search: search || undefined, status: "active" })
      .then((list) => {
        if (!cancelled) setClasses(list);
      })
      .catch(() => {
        if (!cancelled) toast.error(t("teacher:studentForm.loadClassesError"));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, search]);

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

  function handlePick(classSummary: ClassSummary) {
    onSelect(classSummary);
    handleOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("teacher:studentForm.classPickerTitle")}</DialogTitle>
        </DialogHeader>

        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder={t("teacher:studentForm.classSearchPlaceholder")}
          autoFocus
        />

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">{t("common:status.loading")}</p>
          ) : classes.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("teacher:studentForm.noClasses")}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {classes.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className="flex w-full flex-col items-start rounded-lg border border-border px-3 py-2 text-left hover:bg-accent"
                    onClick={() => handlePick(c)}
                  >
                    <span className="text-sm font-medium text-foreground">{c.name}</span>
                    {c.grade && (
                      <span className="text-xs text-muted-foreground">{displayGrade(c.grade, t)}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ClassPickerDialog;
