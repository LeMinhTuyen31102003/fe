import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { CalendarClock, ClipboardList, Mail, Phone } from "lucide-react";
import PageBanner from "@/components/PageBanner";
import Pagination from "@/components/Pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, initialsFrom } from "@/lib/utils";
import { onAppEvent } from "@/eventStream";
import {
  fetchMyAssignments,
  submitMyAssignment,
  uploadSubmissionFile,
  type MyAssignment,
} from "./myAssignmentsApi";
import { fetchMyClassmates, fetchMyTeacher, type MyClassmates, type TeacherContact } from "./studentApi";

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

const STATUS_VARIANT: Record<MyAssignment["status"], "default" | "secondary" | "outline"> = {
  PENDING: "outline",
  SUBMITTED: "secondary",
  GRADED: "default",
};

const STATUS_FILTERS: Array<MyAssignment["status"] | "ALL"> = ["ALL", "PENDING", "SUBMITTED", "GRADED"];
const PAGE_SIZE = 10;

function StudentAssignmentsPage() {
  const { t } = useTranslation(["student", "common"]);
  const [assignments, setAssignments] = useState<MyAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<MyAssignment["status"] | "ALL">("ALL");
  const [previewAssignment, setPreviewAssignment] = useState<MyAssignment | null>(null);
  const [page, setPage] = useState(1);

  const [classmates, setClassmates] = useState<MyClassmates | null>(null);
  const [teacher, setTeacher] = useState<TeacherContact | null>(null);
  const [isPeopleLoading, setIsPeopleLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    function load(showLoading: boolean) {
      if (showLoading) setIsLoading(true);
      fetchMyAssignments()
        .then((data) => {
          if (!cancelled) setAssignments(data);
        })
        .catch(() => {
          if (!cancelled && showLoading) toast.error(t("student:assignments.loadError"));
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
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchMyClassmates(), fetchMyTeacher()])
      .then(([classmatesRes, teacherRes]) => {
        if (cancelled) return;
        setClassmates(classmatesRes);
        setTeacher(teacherRes);
      })
      .catch(() => {
        if (!cancelled) toast.error(t("student:class.loadError"));
      })
      .finally(() => {
        if (!cancelled) setIsPeopleLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dueSoon = useMemo(
    () =>
      assignments
        .filter((a) => a.status !== "GRADED" && a.dueDate)
        .sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : 1))
        .slice(0, 5),
    [assignments],
  );

  const visibleAssignments = useMemo(
    () => (statusFilter === "ALL" ? assignments : assignments.filter((a) => a.status === statusFilter)),
    [assignments, statusFilter],
  );

  const totalPages = Math.max(1, Math.ceil(visibleAssignments.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = visibleAssignments.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const bannerTitle = useMemo(() => {
    const classNames = classmates?.classes.map((c) => c.className) ?? [];
    return classNames.length > 0 ? classNames.join(" • ") : t("student:assignments.title");
  }, [classmates, t]);

  async function handleFileChange(assignment: MyAssignment, e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploadingId(assignment.id);
    try {
      const { url, publicId } = await uploadSubmissionFile(file);
      const updated = await submitMyAssignment(assignment.id, url, publicId);
      setAssignments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      toast.success(t("student:assignments.submitSuccess"));
    } catch (err) {
      if (err instanceof Error && err.message === "FILE_TOO_LARGE") {
        toast.error(t("student:assignments.fileTooLargeError"));
      } else if (err instanceof Error && err.message === "CLOUDINARY_NOT_CONFIGURED") {
        toast.error(t("student:assignments.uploadNotConfiguredError"));
      } else {
        toast.error(t("student:assignments.submitError"));
      }
    } finally {
      setUploadingId(null);
    }
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <PageBanner title={bannerTitle} subtitle={t("student:assignments.subtitle")} />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <Tabs defaultValue="work">
            <TabsList className="mb-6">
              <TabsTrigger value="work">{t("student:assignments.tabs.work")}</TabsTrigger>
              <TabsTrigger value="people">{t("student:assignments.tabs.people")}</TabsTrigger>
            </TabsList>

            <TabsContent value="work" className="flex flex-col gap-4">
              {assignments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {STATUS_FILTERS.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => {
                        setStatusFilter(status);
                        setPage(1);
                      }}
                      className={cn(
                        "rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground",
                        statusFilter === status && "border-primary bg-primary text-primary-foreground hover:text-primary-foreground",
                      )}
                    >
                      {status === "ALL" ? t("student:assignments.filter.all") : t(`student:assignments.status.${status}`)}
                    </button>
                  ))}
                </div>
              )}

              {isLoading ? (
                <p className="text-sm text-muted-foreground">{t("common:status.loading")}</p>
              ) : visibleAssignments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {assignments.length === 0
                    ? t("student:assignments.empty")
                    : t("student:assignments.filterEmpty")}
                </p>
              ) : (
                <>
                <ul className="flex flex-col gap-3">
                  {pageItems.map((a) => {
                    const inputId = `assignment-file-${a.id}`;
                    const isUploading = uploadingId === a.id;
                    const canUpload = !a.locked;

                    return (
                      <li
                        key={a.id}
                        className="flex items-start gap-4 rounded-xl border border-border bg-background p-5 transition-colors hover:border-primary/40"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <ClipboardList className="h-5 w-5" />
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="font-heading text-base font-bold text-foreground">{a.title}</h3>
                              <p className="text-xs text-muted-foreground">
                                {a.className}
                                {a.dueDate && ` · ${t("student:assignments.dueDate", { date: formatDate(a.dueDate) })}`}
                              </p>
                            </div>
                            <Badge variant={STATUS_VARIANT[a.status]}>{t(`student:assignments.status.${a.status}`)}</Badge>
                          </div>

                          {a.content && <p className="mb-3 text-sm whitespace-pre-wrap text-foreground">{a.content}</p>}

                          <div className="flex flex-wrap items-center gap-3">
                            {a.fileUrl && (
                              <button
                                type="button"
                                onClick={() => setPreviewAssignment(a)}
                                className="text-sm font-semibold text-brand-dark underline-offset-4 hover:underline"
                              >
                                {t("student:assignments.viewSubmission")}
                              </button>
                            )}

                            {canUpload && (
                              <>
                                <input
                                  id={inputId}
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  disabled={isUploading}
                                  onChange={(e) => handleFileChange(a, e)}
                                />
                                <Button type="button" size="sm" variant={a.fileUrl ? "outline" : "default"} disabled={isUploading} asChild>
                                  <label htmlFor={inputId} className="cursor-pointer">
                                    {isUploading
                                      ? t("student:assignments.uploading")
                                      : a.fileUrl
                                        ? t("student:assignments.resubmitButton")
                                        : t("student:assignments.submitButton")}
                                  </label>
                                </Button>
                              </>
                            )}

                            {!canUpload && a.status !== "GRADED" && (
                              <span className="text-xs text-muted-foreground">{t("student:assignments.lockedPastDue")}</span>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>

                <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
                </>
              )}
            </TabsContent>

            <TabsContent value="people" className="flex flex-col gap-6">
              {isPeopleLoading ? (
                <p className="text-sm text-muted-foreground">{t("common:status.loading")}</p>
              ) : (
                <>
                  {teacher && (
                    <section className="rounded-xl border border-border bg-background p-6">
                      <h2 className="mb-4 font-heading text-lg font-bold text-foreground">{t("student:class.teacherSection")}</h2>
                      <div className="flex items-center gap-4">
                        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                          {initialsFrom(teacher.fullName)}
                        </span>
                        <div>
                          <div className="font-heading text-base font-bold text-foreground">{teacher.fullName}</div>
                          <Badge variant="secondary" className="mt-1">
                            {t("common:role.TEACHER")}
                          </Badge>
                        </div>
                      </div>

                      {!teacher.email && !teacher.phone ? (
                        <p className="mt-4 text-sm text-muted-foreground">{t("student:class.noContactInfo")}</p>
                      ) : (
                        <div className="mt-4 flex flex-col gap-2 text-sm">
                          {teacher.email && (
                            <a href={`mailto:${teacher.email}`} className="flex items-center gap-2 text-foreground hover:text-primary">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              {teacher.email}
                            </a>
                          )}
                          {teacher.phone && (
                            <a href={`tel:${teacher.phone}`} className="flex items-center gap-2 text-foreground hover:text-primary">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              {teacher.phone}
                            </a>
                          )}
                        </div>
                      )}
                    </section>
                  )}

                  <section className="flex flex-col gap-6">
                    {(classmates?.classes.length ?? 0) === 0 ? (
                      <div>
                        <h2 className="mb-4 font-heading text-lg font-bold text-foreground">{t("student:class.myClassesSection")}</h2>
                        <p className="text-sm text-muted-foreground">{t("student:class.emptyState")}</p>
                      </div>
                    ) : (
                      classmates?.classes.map((group) => (
                        <div key={group.classId} className="rounded-xl border border-border bg-background p-6">
                          <div className="mb-1 flex items-center justify-between border-b border-border pb-3">
                            <h3 className="font-heading text-base font-bold text-foreground">{group.className}</h3>
                            <span className="text-sm text-muted-foreground">
                              {t("student:class.classmateCount", { count: group.classmates.length })}
                            </span>
                          </div>
                          {group.classmates.length === 0 ? (
                            <p className="py-3 text-sm text-muted-foreground">{t("student:class.noClassmates")}</p>
                          ) : (
                            <ul>
                              {group.classmates.map((classmate) => (
                                <li
                                  key={classmate.id}
                                  className="flex items-center gap-3 border-b border-border py-3 last:border-0"
                                >
                                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground">
                                    {initialsFrom(classmate.fullName)}
                                  </span>
                                  <span className="truncate text-sm font-medium text-foreground">{classmate.fullName}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))
                    )}
                  </section>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <aside className="w-full shrink-0 lg:w-72">
          <div className="rounded-xl border border-border bg-background p-5">
            <h2 className="mb-3 flex items-center gap-2 font-heading text-sm font-bold text-foreground">
              <CalendarClock className="h-4 w-4 text-muted-foreground" />
              {t("student:assignments.dueSoonTitle")}
            </h2>
            {isLoading ? (
              <p className="text-xs text-muted-foreground">{t("common:status.loading")}</p>
            ) : dueSoon.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t("student:assignments.dueSoonEmpty")}</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {dueSoon.map((a) => (
                  <li key={a.id} className="border-b border-border pb-3 last:border-0 last:pb-0">
                    <p className="truncate text-sm font-medium text-foreground">{a.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.className} · {formatDate(a.dueDate!)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>

      <Dialog open={previewAssignment !== null} onOpenChange={(open) => !open && setPreviewAssignment(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{previewAssignment?.title}</DialogTitle>
          </DialogHeader>
          {previewAssignment?.fileUrl && (
            <img
              src={previewAssignment.fileUrl}
              alt={t("student:assignments.viewSubmission")}
              className="h-auto w-full rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default StudentAssignmentsPage;
