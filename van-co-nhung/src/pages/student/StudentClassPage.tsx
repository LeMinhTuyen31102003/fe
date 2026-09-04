import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Mail, Phone } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { initialsFrom } from "@/lib/utils";
import {
  fetchMyClassmates,
  fetchMyTeacher,
  type MyClassmates,
  type TeacherContact,
} from "./studentApi";

function StudentClassPage() {
  const { t } = useTranslation(["student", "common"]);
  const [classmates, setClassmates] = useState<MyClassmates | null>(null);
  const [teacher, setTeacher] = useState<TeacherContact | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchMyClassmates(), fetchMyTeacher()])
      .then(([classmatesRes, teacherRes]) => {
        setClassmates(classmatesRes);
        setTeacher(teacherRes);
      })
      .catch(() => toast.error(t("student:class.loadError")))
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <header>
        <h1 className="font-heading text-2xl font-bold text-foreground">{t("student:class.title")}</h1>
        <p className="text-muted-foreground">{t("student:class.subtitle")}</p>
      </header>

      {isLoading ? (
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
                    <a
                      href={`mailto:${teacher.email}`}
                      className="flex items-center gap-2 text-foreground hover:text-primary"
                    >
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {teacher.email}
                    </a>
                  )}
                  {teacher.phone && (
                    <a
                      href={`tel:${teacher.phone}`}
                      className="flex items-center gap-2 text-foreground hover:text-primary"
                    >
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {teacher.phone}
                    </a>
                  )}
                </div>
              )}
            </section>
          )}

          <section className="flex flex-col gap-4">
            <h2 className="font-heading text-lg font-bold text-foreground">{t("student:class.myClassesSection")}</h2>
            {(classmates?.classes.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">{t("student:class.emptyState")}</p>
            ) : (
              classmates?.classes.map((group) => (
                <div key={group.classId} className="rounded-xl border border-border bg-background p-6">
                  <h3 className="mb-4 font-heading text-base font-bold text-foreground">{group.className}</h3>
                  {group.classmates.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t("student:class.noClassmates")}</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {group.classmates.map((classmate) => (
                        <div key={classmate.id} className="flex items-center gap-3 rounded-lg bg-muted p-2.5">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground">
                            {initialsFrom(classmate.fullName)}
                          </span>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-foreground">
                              {classmate.fullName}
                            </div>
                            {classmate.grade && (
                              <div className="text-xs text-muted-foreground">{classmate.grade}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default StudentClassPage;
