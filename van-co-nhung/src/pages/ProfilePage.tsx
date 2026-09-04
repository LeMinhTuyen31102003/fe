import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { GraduationCap, Pencil, Save, UserRound, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { notifyAuthChanged, useAuth } from "@/hooks/useAuth";
import { initialsFrom } from "@/lib/utils";
import { fetchMyProfile, updateMyProfile, type MyProfile } from "./profileApi";

const BANNER_STYLE = {
  backgroundImage:
    "radial-gradient(circle at 12% 30%, rgba(255,255,255,0.7), transparent 46%)," +
    "radial-gradient(circle at 88% 15%, rgba(255,255,255,0.55), transparent 42%)," +
    "linear-gradient(120deg, color-mix(in oklch, var(--brand-yellow) 30%, white) 0%, color-mix(in oklch, var(--brand-yellow) 14%, white) 60%, var(--cream) 100%)",
};

interface FieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  placeholder?: string;
  type?: string;
}

function Field({ id, label, value, onChange, disabled, placeholder, type }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-muted-foreground">
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className="h-10 border-transparent bg-muted px-3.5 disabled:cursor-default disabled:bg-muted disabled:text-foreground disabled:opacity-100"
      />
    </div>
  );
}

interface SectionCardProps {
  icon: typeof UserRound;
  title: string;
  description?: string;
  children: React.ReactNode;
}

function SectionCard({ icon: Icon, title, description, children }: SectionCardProps) {
  return (
    <div className="rounded-xl border border-border bg-background p-6">
      <div className="mb-5 flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary-foreground/80">
          <Icon className="h-4 w-4 text-[color-mix(in_oklch,var(--brand-yellow-dark),black_25%)]" />
        </span>
        <div>
          <h3 className="font-heading text-base font-bold text-foreground">{title}</h3>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">{children}</div>
    </div>
  );
}

interface FormValues {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  grade: string;
  schoolName: string;
  parentName: string;
  parentPhone: string;
}

function valuesFrom(p: MyProfile): FormValues {
  return {
    fullName: p.fullName ?? "",
    email: p.email ?? "",
    phone: p.phone ?? "",
    address: p.address ?? "",
    grade: p.grade ?? "",
    schoolName: p.schoolName ?? "",
    parentName: p.parentName ?? "",
    parentPhone: p.parentPhone ?? "",
  };
}

function ProfilePage() {
  const { role } = useAuth();
  const { t, i18n } = useTranslation(["profile", "common"]);
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [values, setValues] = useState<FormValues | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  function formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString(i18n.language === "en" ? "en-US" : "vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return iso;
    }
  }

  useEffect(() => {
    fetchMyProfile()
      .then((p) => {
        setProfile(p);
        setValues(valuesFrom(p));
        if (localStorage.getItem("fullName") !== p.fullName) {
          localStorage.setItem("fullName", p.fullName ?? "");
          notifyAuthChanged();
        }
      })
      .catch(() => toast.error(t("profile:loadError")))
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setField<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function handleCancel() {
    if (profile) setValues(valuesFrom(profile));
    setIsEditing(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!values) return;
    if (!values.fullName.trim()) {
      toast.error(t("profile:fullNameRequired"));
      return;
    }
    if (values.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      toast.error(t("profile:invalidEmail"));
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await updateMyProfile({
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        address: values.address.trim(),
        grade: values.grade.trim(),
        schoolName: values.schoolName.trim(),
        parentName: values.parentName.trim(),
        parentPhone: values.parentPhone.trim(),
      });
      setProfile(updated);
      setValues(valuesFrom(updated));
      localStorage.setItem("fullName", updated.fullName ?? "");
      notifyAuthChanged();
      setIsEditing(false);
      toast.success(t("profile:updateSuccess"));
    } catch {
      toast.error(t("profile:updateError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  const isStudent = role === "STUDENT";

  return (
    <>
      <header className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">{t("profile:title")}</h1>
        <p className="text-muted-foreground">{t("profile:subtitle")}</p>
      </header>

      {isLoading || !profile || !values ? (
        <p className="text-sm text-muted-foreground">{t("common:status.loading")}</p>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
          <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-[0_1px_2px_rgba(0,0,0,0.04),0_10px_28px_-12px_rgba(0,0,0,0.12)]">
            <div className="h-28 sm:h-32" style={BANNER_STYLE} />

            <div className="flex flex-col items-center gap-4 px-6 pb-6 text-center sm:flex-row sm:items-end sm:justify-between sm:text-left">
              <div className="-mt-12 flex flex-col items-center gap-3 sm:flex-row sm:items-end sm:gap-4">
                <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4 border-background bg-gradient-to-br from-[var(--brand-yellow)] to-[var(--brand-yellow-dark)] text-2xl font-bold text-primary-foreground shadow-md">
                  {initialsFrom(profile.fullName || profile.username)}
                </span>
                <div className="pb-1">
                  <div className="flex items-center justify-center gap-2 sm:justify-start">
                    <h2 className="font-heading text-xl font-bold text-foreground">{profile.fullName}</h2>
                    <Badge variant="secondary">{t(`common:role.${profile.role}`, { defaultValue: profile.role })}</Badge>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {profile.email || `@${profile.username}`}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pb-1">
                {isEditing ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                      disabled={isSubmitting}
                      className="gap-2"
                    >
                      <X className="h-4 w-4" />
                      {t("profile:cancel")}
                    </Button>
                    <Button type="submit" disabled={isSubmitting} className="gap-2">
                      <Save className="h-4 w-4" />
                      {isSubmitting ? t("profile:saving") : t("profile:save")}
                    </Button>
                  </>
                ) : (
                  <Button type="button" onClick={() => setIsEditing(true)} className="gap-2">
                    <Pencil className="h-4 w-4" />
                    {t("profile:edit")}
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            <div className="flex flex-1 flex-col gap-6">
              <SectionCard
                icon={UserRound}
                title={t("profile:personalInfo.title")}
                description={t("profile:personalInfo.description")}
              >
                <Field
                  id="full-name"
                  label={t("profile:fields.fullName")}
                  value={values.fullName}
                  onChange={(v) => setField("fullName", v)}
                  disabled={!isEditing || isSubmitting}
                  placeholder={t("profile:fields.fullNamePlaceholder")}
                />
                <Field
                  id="email"
                  label={t("profile:fields.email")}
                  type="email"
                  value={values.email}
                  onChange={(v) => setField("email", v)}
                  disabled={!isEditing || isSubmitting}
                  placeholder="ban@vidu.com"
                />
                <Field
                  id="phone"
                  label={t("profile:fields.phone")}
                  type="tel"
                  value={values.phone}
                  onChange={(v) => setField("phone", v)}
                  disabled={!isEditing || isSubmitting}
                  placeholder="09xxxxxxxx"
                />
                <Field
                  id="address"
                  label={t("profile:fields.address")}
                  value={values.address}
                  onChange={(v) => setField("address", v)}
                  disabled={!isEditing || isSubmitting}
                  placeholder={t("profile:fields.addressPlaceholder")}
                />
              </SectionCard>

              {isStudent && (
                <SectionCard
                  icon={GraduationCap}
                  title={t("profile:studentInfo.title")}
                  description={t("profile:studentInfo.description")}
                >
                  <Field
                    id="grade"
                    label={t("profile:fields.grade")}
                    value={values.grade}
                    onChange={(v) => setField("grade", v)}
                    disabled={!isEditing || isSubmitting}
                    placeholder={t("profile:fields.gradePlaceholder")}
                  />
                  <Field
                    id="school-name"
                    label={t("profile:fields.schoolName")}
                    value={values.schoolName}
                    onChange={(v) => setField("schoolName", v)}
                    disabled={!isEditing || isSubmitting}
                  />
                  <Field
                    id="parent-name"
                    label={t("profile:fields.parentName")}
                    value={values.parentName}
                    onChange={(v) => setField("parentName", v)}
                    disabled={!isEditing || isSubmitting}
                  />
                  <Field
                    id="parent-phone"
                    label={t("profile:fields.parentPhone")}
                    type="tel"
                    value={values.parentPhone}
                    onChange={(v) => setField("parentPhone", v)}
                    disabled={!isEditing || isSubmitting}
                  />
                </SectionCard>
              )}
            </div>

            <aside className="flex flex-col gap-4 rounded-xl border border-border bg-background p-5 lg:w-72 lg:shrink-0">
              <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {t("profile:accountInfo.title")}
              </h3>
              <dl className="flex flex-col gap-3.5 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">{t("profile:accountInfo.username")}</dt>
                  <dd className="font-medium text-foreground">@{profile.username}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">{t("profile:accountInfo.role")}</dt>
                  <dd>
                    <Badge variant="secondary">
                      {t(`common:role.${profile.role}`, { defaultValue: profile.role })}
                    </Badge>
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">{t("profile:accountInfo.status")}</dt>
                  <dd className="flex items-center gap-1.5 font-medium text-foreground">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${profile.active ? "bg-emerald-500" : "bg-destructive"}`}
                    />
                    {profile.active ? t("profile:accountInfo.active") : t("profile:accountInfo.inactive")}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-border pt-3.5">
                  <dt className="text-muted-foreground">{t("profile:accountInfo.joinedAt")}</dt>
                  <dd className="font-medium text-foreground">{formatDate(profile.createdAt)}</dd>
                </div>
              </dl>
            </aside>
          </div>
        </form>
      )}
    </>
  );
}

export default ProfilePage;
