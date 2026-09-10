import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface PageBannerProps {
  title: string;
  subtitle?: string;
  className?: string;
  backTo?: string;
}

function PageBanner({ title, subtitle, className, backTo }: PageBannerProps) {
  const { t } = useTranslation("common");

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--brand-yellow)] to-[var(--brand-yellow-dark)] px-8 py-10 text-primary-foreground",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        {backTo && (
          <Link
            to={backTo}
            aria-label={t("actions.back")}
            className="shrink-0 text-primary-foreground transition-opacity hover:opacity-70"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
        )}
        <div>
          <h1 className="font-heading text-2xl font-bold">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-primary-foreground/85">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

export default PageBanner;
