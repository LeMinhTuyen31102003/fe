import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import PageBanner from "@/components/PageBanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changeMyPassword, WrongCurrentPasswordError } from "./profileApi";

interface FormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const EMPTY_VALUES: FormValues = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

function ChangePasswordPage() {
  const { t } = useTranslation(["profile", "common"]);
  const [values, setValues] = useState<FormValues>(EMPTY_VALUES);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function setField<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!values.currentPassword) {
      toast.error(t("profile:changePassword.currentPasswordRequired"));
      return;
    }
    if (values.newPassword.length < 6) {
      toast.error(t("profile:changePassword.newPasswordTooShort"));
      return;
    }
    if (values.newPassword !== values.confirmPassword) {
      toast.error(t("profile:changePassword.confirmMismatch"));
      return;
    }

    setIsSubmitting(true);
    try {
      await changeMyPassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      setValues(EMPTY_VALUES);
      toast.success(t("profile:changePassword.success"));
    } catch (err) {
      if (err instanceof WrongCurrentPasswordError) {
        toast.error(t("profile:changePassword.wrongCurrentPassword"));
      } else {
        toast.error(t("profile:changePassword.error"));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <PageBanner
        title={t("profile:changePassword.title")}
        subtitle={t("profile:changePassword.subtitle")}
        className="mb-6"
      />

      <div className="rounded-xl border border-border bg-background p-6">
        <div className="mb-5 flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary-foreground/80">
            <KeyRound className="h-4 w-4 text-[color-mix(in_oklch,var(--brand-yellow-dark),black_25%)]" />
          </span>
          <div>
            <h3 className="font-heading text-base font-bold text-foreground">
              {t("profile:changePassword.formTitle")}
            </h3>
            <p className="text-xs text-muted-foreground">{t("profile:changePassword.formHint")}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 xl:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="current-password" className="text-muted-foreground">
                {t("profile:changePassword.fields.currentPassword")}
              </Label>
              <Input
                id="current-password"
                type="password"
                autoComplete="current-password"
                value={values.currentPassword}
                onChange={(e) => setField("currentPassword", e.target.value)}
                disabled={isSubmitting}
                className="h-10 border-transparent bg-muted px-3.5"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-password" className="text-muted-foreground">
                {t("profile:changePassword.fields.newPassword")}
              </Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={values.newPassword}
                onChange={(e) => setField("newPassword", e.target.value)}
                disabled={isSubmitting}
                className="h-10 border-transparent bg-muted px-3.5"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirm-password" className="text-muted-foreground">
                {t("profile:changePassword.fields.confirmPassword")}
              </Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={values.confirmPassword}
                onChange={(e) => setField("confirmPassword", e.target.value)}
                disabled={isSubmitting}
                className="h-10 border-transparent bg-muted px-3.5"
              />
            </div>
          </div>

          <div className="flex justify-end border-t border-border pt-5">
            <Button type="submit" disabled={isSubmitting} className="w-full gap-2 sm:w-auto sm:px-8">
              <KeyRound className="h-4 w-4" />
              {isSubmitting ? t("profile:changePassword.saving") : t("profile:changePassword.submit")}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}

export default ChangePasswordPage;
