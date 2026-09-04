import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchBankSettings, updateBankSettings } from "./bankSettingsApi";
import { bankNameFromId, BANK_OPTIONS } from "./bankOptions";

function BankSettingsSection() {
  const { t } = useTranslation(["teacher", "common"]);
  const [bankId, setBankId] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchBankSettings()
      .then((settings) => {
        setBankId(settings.bankId ?? "MB");
        setAccountNumber(settings.accountNumber ?? "");
        setAccountName(settings.accountName ?? "");
      })
      .catch(() => toast.error(t("teacher:bankSettings.loadError")))
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!bankId || !accountNumber.trim() || !accountName.trim()) {
      toast.error(t("teacher:bankSettings.requiredError"));
      return;
    }

    setIsSubmitting(true);
    try {
      await updateBankSettings({
        bankId,
        bankName: bankNameFromId(bankId),
        accountNumber: accountNumber.trim(),
        accountName: accountName.trim().toUpperCase(),
      });
      toast.success(t("teacher:bankSettings.saveSuccess"));
    } catch {
      toast.error(t("teacher:bankSettings.saveError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-background p-6">
      <h2 className="mb-1 font-heading text-xl font-bold text-foreground">{t("teacher:bankSettings.title")}</h2>
      <p className="mb-5 text-sm text-muted-foreground">{t("teacher:bankSettings.description")}</p>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t("common:status.loading")}</p>
      ) : (
        <form className="flex max-w-md flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bank-id">{t("teacher:bankSettings.fields.bank")}</Label>
            <Select value={bankId} onValueChange={setBankId}>
              <SelectTrigger id="bank-id" className="w-full" disabled={isSubmitting}>
                <SelectValue placeholder={t("teacher:bankSettings.fields.bankPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {BANK_OPTIONS.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="account-number">{t("teacher:bankSettings.fields.accountNumber")}</Label>
            <Input
              id="account-number"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              disabled={isSubmitting}
              placeholder={t("teacher:bankSettings.fields.accountNumberPlaceholder")}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="account-name">{t("teacher:bankSettings.fields.accountName")}</Label>
            <Input
              id="account-name"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              disabled={isSubmitting}
              placeholder={t("teacher:bankSettings.fields.accountNamePlaceholder")}
            />
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-fit">
            {isSubmitting ? t("common:status.saving") : t("teacher:bankSettings.submit")}
          </Button>
        </form>
      )}
    </div>
  );
}

export default BankSettingsSection;
