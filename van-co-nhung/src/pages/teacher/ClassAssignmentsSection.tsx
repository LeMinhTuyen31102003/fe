import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Pagination from "@/components/Pagination";
import { onAppEvent } from "@/eventStream";
import AssignmentDetailDialog from "./AssignmentDetailDialog";
import AssignmentFormDialog from "./AssignmentFormDialog";
import { fetchAssignments, type Assignment } from "./assignmentsApi";

const PAGE_SIZE = 10;

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

interface ClassAssignmentsSectionProps {
  classId: number;
}

function ClassAssignmentsSection({ classId }: ClassAssignmentsSectionProps) {
  const { t } = useTranslation(["teacher", "common"]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;

    function load(showLoading: boolean) {
      if (showLoading) {
        setIsLoading(true);
        setPage(1);
      }
      fetchAssignments(classId)
        .then((data) => {
          if (!cancelled) setAssignments(data);
        })
        .catch(() => {
          if (!cancelled && showLoading) toast.error(t("teacher:assignments.loadError"));
        })
        .finally(() => {
          if (!cancelled && showLoading) setIsLoading(false);
        });
    }

    load(true);
    const unsubscribe = onAppEvent((scope) => {
      if (scope === "assignment") load(false);
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  function handleSaved(saved: Assignment) {
    setAssignments((prev) => {
      const exists = prev.some((a) => a.id === saved.id);
      return exists ? prev.map((a) => (a.id === saved.id ? saved : a)) : [saved, ...prev];
    });
    setSelectedAssignment((prev) => (prev?.id === saved.id ? saved : prev));
  }

  function handleDeleted(assignmentId: number) {
    setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
  }

  function openCreate() {
    setEditingAssignment(null);
    setIsFormOpen(true);
  }

  function openEdit(assignment: Assignment) {
    setEditingAssignment(assignment);
    setSelectedAssignment(null);
    setIsFormOpen(true);
  }

  const totalPages = Math.max(1, Math.ceil(assignments.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = assignments.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="rounded-xl border border-border bg-background p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-xl font-bold text-foreground">{t("teacher:assignments.listTitle")}</h2>
        <Button type="button" onClick={openCreate}>
          {t("teacher:assignments.add")}
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t("common:status.loading")}</p>
      ) : assignments.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("teacher:assignments.empty")}</p>
      ) : (
        <>
          <ul className="flex flex-col gap-2">
            {pageItems.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => setSelectedAssignment(a)}
                  className="flex w-full flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3 text-left hover:bg-cream"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{a.title}</p>
                    {a.dueDate && (
                      <p className="text-xs text-muted-foreground">
                        {t("teacher:assignments.dueDate", { date: formatDate(a.dueDate) })}
                      </p>
                    )}
                  </div>
                  <Badge variant="secondary">
                    {t("teacher:assignments.submittedCount", { submitted: a.submittedCount, total: a.totalStudents })}
                  </Badge>
                </button>
              </li>
            ))}
          </ul>

          <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <AssignmentFormDialog
        open={isFormOpen}
        classId={classId}
        assignment={editingAssignment}
        onOpenChange={setIsFormOpen}
        onSaved={handleSaved}
      />

      <AssignmentDetailDialog
        classId={classId}
        assignment={selectedAssignment}
        onOpenChange={(open) => {
          if (!open) setSelectedAssignment(null);
        }}
        onEdit={openEdit}
        onDeleted={handleDeleted}
      />
    </div>
  );
}

export default ClassAssignmentsSection;
