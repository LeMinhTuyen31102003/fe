import { useEffect, useState, type FormEvent } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CurrencyInput from "@/components/CurrencyInput";
import PageBanner from "@/components/PageBanner";
import Pagination from "@/components/Pagination";
import RequiredMark from "@/components/RequiredMark";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  fetchClassDetail,
  removeStudentFromClass,
  updateClass,
  type ClassDetail,
  type ScheduleSlotInput,
} from "./classesApi";
import AddStudentDialog from "./AddStudentDialog";
import ClassAssignmentsSection from "./ClassAssignmentsSection";
import { displayGrade, GRADE_OPTIONS } from "./gradeOptions";
import ScheduleSlotEditor from "./ScheduleSlotEditor";
import { formatScheduleSlot, sortSchedules } from "./scheduleOptions";

const STUDENTS_PAGE_SIZE = 10;

function ClassDetailPage() {
  const { t } = useTranslation(["teacher", "common"]);
  const { classId: classIdParam } = useParams<{ classId: string }>();
  const classId = Number(classIdParam);
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab = tabParam === "assignments" || tabParam === "students" ? tabParam : "info";

  const [detail, setDetail] = useState<ClassDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [studentsPage, setStudentsPage] = useState(1);

  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");
  const [schedules, setSchedules] = useState<ScheduleSlotInput[]>([]);
  const [note, setNote] = useState("");
  const [feePerSession, setFeePerSession] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadError(false);
    setStudentsPage(1);

    fetchClassDetail(classId)
      .then((classDetail) => {
        if (cancelled) return;
        setDetail(classDetail);
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
        setFeePerSession(classDetail.feePerSession);
      })
      .catch(() => {
        if (cancelled) return;
        setLoadError(true);
        toast.error(t("teacher:classDetail.loadError"));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  async function handleSaveInfo(e: FormEvent) {
    e.preventDefault();
    if (!detail) return;
    if (!name.trim()) {
      toast.error(t("teacher:classForm.nameRequiredError"));
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await updateClass(detail.id, {
        name: name.trim(),
        grade,
        schedules,
        note: note.trim(),
        feePerSession,
      });
      setDetail((prev) => (prev ? { ...prev, ...updated } : prev));
      setIsEditing(false);
      toast.success(t("teacher:classDetail.updateSuccess"));
    } catch {
      toast.error(t("teacher:classDetail.updateError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleStudentAdded(updated: ClassDetail) {
    setDetail(updated);
  }

  async function handleRemoveStudent(studentId: number) {
    if (!detail) return;
    try {
      const updated = await removeStudentFromClass(detail.id, studentId);
      setDetail(updated);
      toast.success(t("teacher:classDetail.removedStudent"));
    } catch {
      toast.error(t("teacher:classDetail.removeStudentError"));
    }
  }

  const students = detail?.students ?? [];
  const studentsTotalPages = Math.max(1, Math.ceil(students.length / STUDENTS_PAGE_SIZE));
  const studentsCurrentPage = Math.min(studentsPage, studentsTotalPages);
  const studentsPageItems = students.slice(
    (studentsCurrentPage - 1) * STUDENTS_PAGE_SIZE,
    studentsCurrentPage * STUDENTS_PAGE_SIZE,
  );

  return (
    <>
      <PageBanner
        title={isLoading ? t("common:status.loading") : (detail?.name ?? t("teacher:classDetail.titleView"))}
        backTo="/admin/classes"
        className="mb-6"
      />

      <Tabs
        value={activeTab}
        onValueChange={(value) => setSearchParams(value === "info" ? {} : { tab: value }, { replace: true })}
      >
        <TabsList className="mb-6">
          <TabsTrigger value="info">{t("teacher:classDetail.tabs.info")}</TabsTrigger>
          <TabsTrigger value="students">{t("teacher:classDetail.tabs.students")}</TabsTrigger>
          <TabsTrigger value="assignments">{t("teacher:classDetail.tabs.assignments")}</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <div className="rounded-xl border border-border bg-background p-6">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t("common:status.loading")}</p>
        ) : loadError || !detail ? (
          <p className="text-sm text-muted-foreground">{t("teacher:classDetail.loadError")}</p>
        ) : isEditing ? (
          <form className="flex flex-col gap-4" onSubmit={handleSaveInfo}>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ce-name">
                {t("teacher:classForm.fields.name")}
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
              <Label htmlFor="ce-grade">{t("teacher:classForm.fields.grade")}</Label>
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger id="ce-grade" className="w-full" disabled={isSubmitting}>
                  <SelectValue placeholder={t("teacher:classForm.fields.gradePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {GRADE_OPTIONS.map((g) => (
                    <SelectItem key={g} value={g}>
                      {displayGrade(g, t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ScheduleSlotEditor slots={schedules} onChange={setSchedules} disabled={isSubmitting} />

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ce-fee-per-session">{t("teacher:classForm.fields.feePerSession")}</Label>
              <CurrencyInput
                id="ce-fee-per-session"
                value={feePerSession}
                onChange={setFeePerSession}
                disabled={isSubmitting}
                placeholder={t("teacher:classForm.fields.feePerSessionPlaceholder")}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ce-note">{t("teacher:classForm.fields.note")}</Label>
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
                {t("common:actions.cancel")}
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? t("common:status.saving") : t("common:actions.save")}
              </Button>
            </div>
          </form>
        ) : (
          <>
            <dl className="flex flex-col gap-4">
              <div>
                <dt className="text-xs font-medium text-muted-foreground">
                  {t("teacher:classDetail.labels.name")}
                </dt>
                <dd className="text-sm font-medium text-foreground">{detail.name}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">
                  {t("teacher:classDetail.labels.grade")}
                </dt>
                <dd className="text-sm font-medium text-foreground">
                  {detail.grade ? displayGrade(detail.grade, t) : "—"}
                </dd>
              </div>
              <div>
                <dt className="mb-1 text-xs font-medium text-muted-foreground">
                  {t("teacher:classDetail.labels.schedule")}
                </dt>
                {detail.schedules.length === 0 ? (
                  <dd className="text-sm font-medium text-foreground">—</dd>
                ) : (
                  <dd className="flex flex-col gap-1">
                    {sortSchedules(detail.schedules).map((slot) => (
                      <span key={slot.id} className="text-sm font-medium text-foreground">
                        {formatScheduleSlot(slot, t)}
                      </span>
                    ))}
                  </dd>
                )}
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">
                  {t("teacher:classDetail.labels.feePerSession")}
                </dt>
                <dd className="text-sm font-medium text-foreground">
                  {detail.feePerSession != null ? `${detail.feePerSession.toLocaleString("vi-VN")}đ` : "—"}
                </dd>
              </div>
              {detail.note && (
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">
                    {t("teacher:classDetail.labels.note")}
                  </dt>
                  <dd className="text-sm text-foreground whitespace-pre-wrap">{detail.note}</dd>
                </div>
              )}
              <div>
                <dt className="mb-1 text-xs font-medium text-muted-foreground">
                  {t("teacher:classDetail.labels.status")}
                </dt>
                <dd>
                  <Badge variant={detail.active ? "default" : "secondary"}>
                    {detail.active ? t("teacher:classStatus.active") : t("teacher:classStatus.inactive")}
                  </Badge>
                </dd>
              </div>
            </dl>

            <Button type="button" variant="outline" className="mt-4" onClick={() => setIsEditing(true)}>
              {t("common:actions.edit")}
            </Button>
          </>
        )}
          </div>
        </TabsContent>

        <TabsContent value="students">
          {!isLoading && detail && (
            <div className="rounded-xl border border-border bg-background p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-heading text-xl font-bold text-foreground">
                  {t("teacher:classDetail.studentsTitle", { count: detail.students.length })}
                </h2>
                <Button type="button" onClick={() => setIsAddStudentOpen(true)}>
                  {t("teacher:classDetail.addStudentLabel")}
                </Button>
              </div>

              {detail.students.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("teacher:classDetail.noStudents")}</p>
              ) : (
                <>
                <ul className="flex flex-col gap-2">
                  {studentsPageItems.map((student) => (
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
                        {t("common:actions.delete")}
                      </button>
                    </li>
                  ))}
                </ul>

                <Pagination
                  page={studentsCurrentPage}
                  totalPages={studentsTotalPages}
                  onPageChange={setStudentsPage}
                />
                </>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="assignments">
          {!isLoading && detail && <ClassAssignmentsSection classId={detail.id} />}
        </TabsContent>
      </Tabs>

      <AddStudentDialog
        open={isAddStudentOpen}
        classId={detail?.id ?? null}
        onOpenChange={setIsAddStudentOpen}
        onStudentAdded={handleStudentAdded}
      />
    </>
  );
}

export default ClassDetailPage;
