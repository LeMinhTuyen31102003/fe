import { useState } from "react";
import { toast } from "sonner";
import type { TFunction } from "i18next";
import { Check, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/ConfirmDialog";
import { cn } from "@/lib/utils";
import type { BankSettings } from "../teacher/bankSettingsApi";
import { confirmMyPayment, type TuitionStatus } from "./myTuitionApi";

export interface TuitionCardData {
  classId: number;
  className: string;
  feePerSession: number;
  sessionCount: number;
  amount: number;
  classFund: number;
  totalAmount: number;
  status: TuitionStatus;
  requestedAt: string | null;
  paidAt: string | null;
  note: string | null;
}

function formatCurrency(value: number) {
  return `${value.toLocaleString("vi-VN")}đ`;
}

function formatDateTime(value: string | null, language: string) {
  if (!value) return "";
  return new Date(value).toLocaleString(language === "en" ? "en-US" : "vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildQrUrl(bank: BankSettings, classTuition: TuitionCardData, year: number, month: number) {
  const info = `Hoc phi ${classTuition.className} T${month}-${year}`;
  const params = new URLSearchParams({
    amount: String(classTuition.totalAmount),
    addInfo: info,
    accountName: bank.accountName ?? "",
  });
  return `https://img.vietqr.io/image/${bank.bankId}-${bank.accountNumber}-compact2.png?${params.toString()}`;
}

function TuitionCard({
  classTuition,
  finalized,
  bank,
  year,
  month,
  onConfirmed,
  t,
  language,
  collapsible = false,
  defaultOpen = true,
}: {
  classTuition: TuitionCardData;
  finalized: boolean;
  bank: BankSettings | null;
  year: number;
  month: number;
  onConfirmed: (updated: TuitionCardData) => void;
  t: TFunction;
  language: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  const {
    classId,
    className,
    sessionCount,
    feePerSession,
    amount,
    classFund,
    totalAmount,
    status,
    requestedAt,
    paidAt,
    note,
  } = classTuition;
  const [isConfirming, setIsConfirming] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const showDetails = !collapsible || isOpen;

  async function handleConfirm() {
    setIsConfirming(true);
    try {
      const updated = await confirmMyPayment(classId, year, month);
      onConfirmed(updated);
      setIsConfirmDialogOpen(false);
      toast.success(t("student:home.tuitionCard.confirmSuccess"));
    } catch {
      toast.error(t("student:home.tuitionCard.confirmError"));
    } finally {
      setIsConfirming(false);
    }
  }

  const header = (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-heading text-lg font-bold text-foreground">{className}</h3>
        {collapsible && (
          <span className="text-sm font-semibold text-muted-foreground">{formatCurrency(totalAmount)}</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Badge
          variant={status === "PAID" ? "default" : status === "PENDING" ? "outline" : "secondary"}
          className={status === "PENDING" ? "border-amber-300 bg-amber-100 text-amber-800" : undefined}
        >
          {t(`student:home.tuitionCard.status.${status}`)}
        </Badge>
        {collapsible && (
          <ChevronDown
            className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")}
          />
        )}
      </div>
    </div>
  );

  return (
    <div className="rounded-xl border border-border bg-background p-6">
      {collapsible ? (
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={cn("w-full text-left", showDetails && "mb-4")}
        >
          {header}
        </button>
      ) : (
        <div className="mb-4">{header}</div>
      )}

      {showDetails && (
        <>
          <dl className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div>
              <dt className="text-xs text-muted-foreground">{t("student:home.tuitionCard.sessionCount")}</dt>
              <dd className="text-sm font-semibold text-foreground">
                {t("student:home.tuitionCard.sessionCountValue", { count: sessionCount })}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{t("student:home.tuitionCard.feePerSession")}</dt>
              <dd className="text-sm font-semibold text-foreground">
                {t("student:home.tuitionCard.feePerSessionValue", { amount: formatCurrency(feePerSession) })}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{t("student:home.tuitionCard.amount")}</dt>
              <dd className="text-sm font-semibold text-foreground">{formatCurrency(amount)}</dd>
            </div>
            {classFund > 0 && (
              <div>
                <dt className="text-xs text-muted-foreground">{t("student:home.tuitionCard.classFund")}</dt>
                <dd className="text-sm font-semibold text-foreground">{formatCurrency(classFund)}</dd>
              </div>
            )}
            {classFund > 0 && (
              <div>
                <dt className="text-xs text-muted-foreground">{t("student:home.tuitionCard.totalAmount")}</dt>
                <dd className="text-sm font-semibold text-foreground">{formatCurrency(totalAmount)}</dd>
              </div>
            )}
          </dl>

          {status === "PAID" ? (
            <p className="text-sm text-muted-foreground">
              {paidAt
                ? t("student:home.tuitionCard.paidNoteWithDate", { date: formatDateTime(paidAt, language) })
                : t("student:home.tuitionCard.paidNote")}
            </p>
          ) : status === "PENDING" ? (
            <p className="rounded-lg border border-dashed border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
              {t("student:home.tuitionCard.pendingNote", { date: formatDateTime(requestedAt, language) })}
            </p>
          ) : totalAmount <= 0 ? (
            <p className="text-sm text-muted-foreground">{t("student:home.tuitionCard.noFeeThisMonth")}</p>
          ) : !finalized ? (
            <p className="text-sm text-muted-foreground">{t("student:home.tuitionCard.paymentNotOpenYet")}</p>
          ) : (
            <div className="flex flex-col gap-3">
              {note && (
                <p className="rounded-lg border border-dashed border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                  {t("student:home.tuitionCard.rejectedNotePrefix")}{" "}
                  <span className="font-medium">{note}</span>{" "}
                  {t("student:home.tuitionCard.rejectedNoteSuffix")}
                </p>
              )}
              {!bank || !bank.configured ? (
                <p className="text-sm text-muted-foreground">{t("student:home.tuitionCard.noBankConfigured")}</p>
              ) : (
                <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-4">
                  <img
                    src={buildQrUrl(bank, classTuition, year, month)}
                    alt={t("student:home.tuitionCard.qrAlt", { className })}
                    className="h-auto w-full max-w-[260px]"
                  />
                  <p className="text-center text-xs text-muted-foreground">
                    {t("student:home.tuitionCard.qrInstructions", {
                      amount: formatCurrency(totalAmount),
                      accountName: bank.accountName,
                      bankName: bank.bankName,
                    })}
                  </p>
                  <Button
                    type="button"
                    onClick={() => setIsConfirmDialogOpen(true)}
                    disabled={isConfirming}
                    className="w-full max-w-[260px]"
                  >
                    <Check />
                    {isConfirming ? t("common:status.sending") : t("student:home.tuitionCard.confirmButton")}
                  </Button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
        title={t("student:home.tuitionCard.confirmDialogTitle")}
        description={t("student:home.tuitionCard.confirmDialog", {
          amount: formatCurrency(totalAmount),
          className,
        })}
        isConfirming={isConfirming}
        onConfirm={handleConfirm}
      />
    </div>
  );
}

export default TuitionCard;
