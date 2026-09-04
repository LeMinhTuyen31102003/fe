import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";

function TeacherOverviewPage() {
  const { userName, fullName } = useAuth();
  const { t } = useTranslation(["teacher", "common"]);

  const stats = [
    { label: t("teacher:overview.stats.classes"), value: 0 },
    { label: t("teacher:overview.stats.students"), value: 0 },
    { label: t("teacher:overview.stats.sessionsThisWeek"), value: 0 },
  ];

  return (
    <>
      <header className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">{t("teacher:overview.title")}</h1>
        <p className="text-muted-foreground">
          {t("teacher:overview.greeting", { name: fullName || userName })}
        </p>
      </header>

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-background p-5">
            <div className="mb-2 text-sm text-muted-foreground">{stat.label}</div>
            <div className="text-3xl font-bold text-foreground">{stat.value}</div>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-dashed border-border bg-background p-10 text-center text-muted-foreground">
        <p>{t("teacher:overview.placeholder")}</p>
      </section>
    </>
  );
}

export default TeacherOverviewPage;
