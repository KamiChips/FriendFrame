import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterSelectProps {
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  width?: number;
  disabled?: boolean;
}

// menu desplegable de filtro: muestra "Etiqueta: valor" con el menu accesible de shadcn
export function FilterSelect({ label, value, options, onChange, width, disabled }: FilterSelectProps) {
  const selected = options.find((option) => option.value === value) ?? options[0];

  return (
    <Select value={selected?.value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger
        aria-label={label}
        className="h-11! rounded-xl border-line bg-surface px-3.5 text-[15px]"
        style={width ? { width } : undefined}
      >
        <SelectValue>
          {label}: {selected?.label}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
