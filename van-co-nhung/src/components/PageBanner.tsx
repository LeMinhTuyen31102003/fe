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
        "relative overflow-hidden rounded-2xl bg-brand-brown-dark px-5 py-6 sm:px-8 sm:py-10 text-brand-brown-foreground",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        {backTo && (
          <Link
            to={backTo}
            aria-label={t("actions.back")}
            className="shrink-0 text-brand-brown-foreground transition-opacity hover:opacity-70"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
        )}
        <div className="min-w-0">
          <h1 className="font-heading text-xl font-bold sm:text-2xl">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-brand-brown-foreground/80">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

export default PageBanner;
