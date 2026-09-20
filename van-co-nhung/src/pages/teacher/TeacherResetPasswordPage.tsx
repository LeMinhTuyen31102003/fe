import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Check, Copy, KeyRound, Search, ShieldAlert, UserRound } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";
import ConfirmDialog from "@/components/ConfirmDialog";
import PageBanner from "@/components/PageBanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { displayGrade } from "./gradeOptions";
import {
  fetchStudents,
  resetStudentPassword,
  type ResetPasswordResult,
  type Student,
} from "./studentsApi";

const SEARCH_DEBOUNCE_MS = 300;
const MAX_SUGGESTIONS = 5;

function TeacherResetPasswordPage() {
  const { t } = useTranslation(["teacher", "common"]);
  const [username, setUsername] = useState("");
  const [suggestions, setSuggestions] = useState<Student[]>([]);
  const [hasPickedSuggestion, setHasPickedSuggestion] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastReset, setLastReset] = useState<ResetPasswordResult | null>(null);
  const [justCopied, setJustCopied] = useState(false);

  // Typing a username from memory is error-prone, so offer matches as they type —
  // the teacher usually knows the student's name, not their exact login.
  useEffect(() => {
    const term = username.trim();
    let cancelled = false;

    const timer = setTimeout(() => {
      // Clearing happens inside the timer too, so the effect body itself never
      // calls setState — picking a suggestion already empties the list instantly.
      if (hasPickedSuggestion || term.length < 2) {
        setSuggestions([]);
        return;
      }
      fetchStudents({ search: term })
        .then((list) => {
          if (!cancelled) setSuggestions(list.slice(0, MAX_SUGGESTIONS));
        })
        .catch(() => {
          if (!cancelled) setSuggestions([]);
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [username, hasPickedSuggestion]);

  function pickSuggestion(student: Student) {
    setUsername(student.username);
    setHasPickedSuggestion(true);
    setSuggestions([]);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!username.trim()) {
      toast.error(t("teacher:resetPassword.usernameRequired"));
      return;
    }
    setIsConfirmOpen(true);
  }

  async function handleConfirm() {
    setIsSubmitting(true);
    try {
      const result = await resetStudentPassword(username.trim());
      setLastReset(result);
      setUsername("");
      setHasPickedSuggestion(false);
      setSuggestions([]);
      setIsConfirmOpen(false);
      toast.success(t("teacher:resetPassword.success", { name: result.fullName }));
    } catch (err) {
      if (err instanceof Error && err.message === "STUDENT_NOT_FOUND") {
        toast.error(t("teacher:resetPassword.notFound"));
      } else {
        toast.error(t("teacher:resetPassword.error"));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function copyPassword() {
    if (!lastReset) return;
    try {
      await navigator.clipboard.writeText(lastReset.newPassword);
      setJustCopied(true);
      setTimeout(() => setJustCopied(false), 2000);
    } catch {
      toast.error(t("teacher:resetPassword.copyError"));
    }
  }

  return (
    <>
      <PageBanner
        title={t("teacher:resetPassword.pageTitle")}
        subtitle={t("teacher:resetPassword.pageSubtitle")}
        className="mb-6"
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <div className="rounded-xl border border-border bg-background p-6">
            <div className="mb-5 flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15">
                <Search className="h-4 w-4 text-[color-mix(in_oklch,var(--brand-yellow-dark),black_25%)]" />
              </span>
              <div>
                <h2 className="font-heading text-base font-bold text-foreground">
                  {t("teacher:resetPassword.formTitle")}
                </h2>
                <p className="text-xs text-muted-foreground">{t("teacher:resetPassword.formHint")}</p>
              </div>
            </div>

            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <div className="relative flex flex-col gap-1.5">
                <Label htmlFor="reset-username">{t("teacher:resetPassword.fields.username")}</Label>
                <Input
                  id="reset-username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setHasPickedSuggestion(false);
                  }}
                  disabled={isSubmitting}
                  placeholder={t("teacher:resetPassword.fields.usernamePlaceholder")}
                  autoComplete="off"
                  className="h-10 px-3.5"
                />

                {suggestions.length > 0 && (
                  <ul className="absolute top-full right-0 left-0 z-20 mt-1 max-h-72 overflow-y-auto rounded-lg border border-border bg-background py-1 shadow-lg">
                    {suggestions.map((student) => (
                      <li key={student.id}>
                        <button
                          type="button"
                          onClick={() => pickSuggestion(student)}
                          className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-cream"
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15">
                            <UserRound className="h-4 w-4 text-[color-mix(in_oklch,var(--brand-yellow-dark),black_25%)]" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-foreground">
                              {student.fullName}
                            </span>
                            <span className="block truncate text-xs text-muted-foreground">
                              @{student.username}
                              {student.grade ? ` · ${displayGrade(student.grade, t)}` : ""}
                            </span>
                          </span>
                          {!student.active && (
                            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                              {t("teacher:studentStatus.inactive")}
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full gap-2 sm:w-auto sm:self-start sm:px-8"
              >
                <KeyRound className="h-4 w-4" />
                {isSubmitting ? t("teacher:resetPassword.submitting") : t("teacher:resetPassword.submit")}
              </Button>
            </form>
          </div>

          {lastReset && (
            <div className="rounded-xl border border-status-success/30 bg-status-success-bg p-6">
              <div className="mb-4 flex items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-status-success/20">
                  <Check className="h-4 w-4 text-status-success-fg" />
                </span>
                <h2 className="font-heading text-base font-bold text-foreground">
                  {t("teacher:resetPassword.resultTitle")}
                </h2>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{t("teacher:resetPassword.resultStudent")}</p>
                  <p className="font-heading text-lg font-bold text-foreground">{lastReset.fullName}</p>
                  <p className="text-sm text-muted-foreground">@{lastReset.username}</p>
                </div>

                <div className="sm:text-right">
                  <p className="text-xs text-muted-foreground">{t("teacher:resetPassword.resultPassword")}</p>
                  <div className="mt-1 flex items-center gap-2 sm:justify-end">
                    <code className="rounded-lg border border-border bg-background px-3 py-1.5 font-mono text-lg font-bold tracking-widest text-foreground">
                      {lastReset.newPassword}
                    </code>
                    <Button type="button" variant="outline" size="sm" onClick={copyPassword} className="gap-1.5">
                      {justCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {justCopied ? t("teacher:resetPassword.copied") : t("common:actions.copy")}
                    </Button>
                  </div>
                </div>
              </div>

              <p className="mt-4 border-t border-status-success/20 pt-4 text-sm text-muted-foreground">
                {t("teacher:resetPassword.resultReminder")}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-xl border border-border bg-background p-6">
            <h2 className="mb-4 font-heading text-base font-bold text-foreground">
              {t("teacher:resetPassword.howItWorksTitle")}
            </h2>
            <ol className="flex flex-col gap-4">
              {["step1", "step2", "step3"].map((step, index) => (
                <li key={step} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {index + 1}
                  </span>
                  <p className="text-sm text-muted-foreground">
                    <Trans
                      i18nKey={`teacher:resetPassword.${step}`}
                      components={{ b: <strong className="font-semibold text-foreground" /> }}
                    />
                  </p>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-xl border border-status-warning/30 bg-status-warning-bg p-6">
            <div className="mb-2 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0 text-status-warning-fg" />
              <h2 className="font-heading text-base font-bold text-foreground">
                {t("teacher:resetPassword.noteTitle")}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">{t("teacher:resetPassword.noteBody")}</p>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title={t("teacher:resetPassword.confirmTitle")}
        description={t("teacher:resetPassword.confirmDescription", { username: username.trim() })}
        confirmLabel={t("teacher:resetPassword.submit")}
        onConfirm={handleConfirm}
        isConfirming={isSubmitting}
        variant="destructive"
      />
    </>
  );
}

export default TeacherResetPasswordPage;
