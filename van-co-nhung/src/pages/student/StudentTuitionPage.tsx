import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import PageBanner from "@/components/PageBanner";
import Pagination from "@/components/Pagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchBankSettings, type BankSettings } from "../teacher/bankSettingsApi";
import { fetchMyTuitionHistory, type MyTuitionHistoryEntry } from "./myTuitionApi";
import TuitionCard, { type TuitionCardData } from "./TuitionCard";

const PAGE_SIZE = 10;

const MONTH_KEY = (entry: { year: number; month: number }) => `${entry.year}-${entry.month}`;

interface MonthGroup {
  year: number;
  month: number;
  entries: MyTuitionHistoryEntry[];
}

function groupByMonth(list: MyTuitionHistoryEntry[]): MonthGroup[] {
  const map = new Map<string, MonthGroup>();
  for (const entry of list) {
    const key = MONTH_KEY(entry);
    if (!map.has(key)) {
      map.set(key, { year: entry.year, month: entry.month, entries: [] });
    }
    map.get(key)!.entries.push(entry);
  }
  return Array.from(map.values());
}

function StudentTuitionPage() {
  const { t, i18n } = useTranslation(["student", "common"]);
  const [entries, setEntries] = useState<MyTuitionHistoryEntry[]>([]);
  const [bank, setBank] = useState<BankSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusTab, setStatusTab] = useState<"unpaid" | "paid">("unpaid");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchBankSettings()
      .then(setBank)
      .catch(() => {
        /* QR simply won't render if this fails */
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchMyTuitionHistory()
      .then((res) => {
        if (cancelled) return;
        setEntries(res.entries);
      })
      .catch(() => {
        if (cancelled) return;
        toast.error(t("student:tuitionPage.loadError"));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unpaidGroups = useMemo(
    () => groupByMonth(entries.filter((e) => e.status !== "PAID")),
    [entries],
  );
  const paidGroups = useMemo(
    () => groupByMonth(entries.filter((e) => e.status === "PAID")),
    [entries],
  );

  function handleConfirmed(updated: TuitionCardData, year: number, month: number) {
    setEntries((prev) =>
      prev.map((e) =>
        e.classId === updated.classId && e.year === year && e.month === month ? { ...e, ...updated } : e,
      ),
    );
  }

  function renderGroups(groups: MonthGroup[], emptyMessage: string) {
    if (groups.length === 0) {
      return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
    }

    const totalPages = Math.max(1, Math.ceil(groups.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const visibleGroups = groups.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    return (
      <>
        {visibleGroups.map(({ year, month, entries: monthEntries }) => (
          <section key={`${year}-${month}`} className="flex flex-col gap-4">
            <h2 className="font-heading text-lg font-bold text-foreground">
              {t("student:tuitionPage.monthLabel", { month, year })}
            </h2>
            {monthEntries.map((entry) => (
              <TuitionCard
                key={entry.classId}
                classTuition={entry}
                finalized
                bank={bank}
                year={year}
                month={month}
                onConfirmed={(updated) => handleConfirmed(updated, year, month)}
                t={t}
                language={i18n.language}
                collapsible
                defaultOpen={entry.status !== "PAID"}
              />
            ))}
          </section>
        ))}
        <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
      </>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <PageBanner title={t("student:tuitionPage.title")} subtitle={t("student:tuitionPage.subtitle")} />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t("common:status.loading")}</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("student:tuitionPage.emptyState")}</p>
      ) : (
        <Tabs
          value={statusTab}
          onValueChange={(v) => {
            setStatusTab(v as "unpaid" | "paid");
            setPage(1);
          }}
        >
          <TabsList>
            <TabsTrigger value="unpaid">
              {t("student:tuitionPage.tabs.unpaid")} ({unpaidGroups.reduce((sum, g) => sum + g.entries.length, 0)})
            </TabsTrigger>
            <TabsTrigger value="paid">
              {t("student:tuitionPage.tabs.paid")} ({paidGroups.reduce((sum, g) => sum + g.entries.length, 0)})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="unpaid" className="flex flex-col gap-8">
            {renderGroups(unpaidGroups, t("student:tuitionPage.noUnpaid"))}
          </TabsContent>
          <TabsContent value="paid" className="flex flex-col gap-8">
            {renderGroups(paidGroups, t("student:tuitionPage.noPaid"))}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

export default StudentTuitionPage;
