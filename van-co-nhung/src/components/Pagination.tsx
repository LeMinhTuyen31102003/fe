import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  const { t } = useTranslation("common");

  if (totalPages <= 1) return null;

  return (
    <div className="mt-5 flex items-center justify-center gap-4">
      <Button type="button" variant="outline" size="sm" disabled={page === 1} onClick={() => onPageChange(page - 1)}>
        {t("pagination.prev")}
      </Button>
      <span className="text-sm text-muted-foreground">
        {t("pagination.pageOf", { current: page, total: totalPages })}
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        {t("pagination.next")}
      </Button>
    </div>
  );
}

export default Pagination;
