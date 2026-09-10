import type { ChangeEvent, ComponentProps } from "react";
import { Input } from "@/components/ui/input";

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

function formatWithThousands(digits: string): string {
  if (!digits) return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

interface CurrencyInputProps
  extends Omit<ComponentProps<typeof Input>, "value" | "onChange" | "type" | "inputMode"> {
  value: number | null;
  onChange: (value: number | null) => void;
}

// A plain number input can't display "1.300.000"-style separators (browsers reject the
// dots), so this renders as text/numeric-inputmode instead, formatting on every keystroke
// while still handing the caller a plain number (or null when cleared).
function CurrencyInput({ value, onChange, ...props }: CurrencyInputProps) {
  const text = formatWithThousands(value != null ? String(value) : "");

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const digits = digitsOnly(e.target.value);
    onChange(digits ? Number(digits) : null);
  }

  return <Input type="text" inputMode="numeric" value={text} onChange={handleChange} {...props} />;
}

export default CurrencyInput;
