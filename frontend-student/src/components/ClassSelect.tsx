import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";

type ClassSelectProps = {
  label: string;
  options: string[];
  value: string;
  placeholder?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
};

const ClassSelect = ({
  label,
  options,
  value,
  placeholder = "Select class",
  disabled = false,
  onChange,
}: ClassSelectProps) => {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const listId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const selectedIndex = useMemo(
    () => options.findIndex((option) => option === value),
    [options, value],
  );

  useEffect(() => {
    if (!open) return;
    const nextIndex = selectedIndex >= 0 ? selectedIndex : 0;
    setActiveIndex(nextIndex);
    requestAnimationFrame(() => {
      itemRefs.current[nextIndex]?.scrollIntoView({ block: "nearest" });
    });
  }, [open, selectedIndex]);

  const handleSelect = (option: string) => {
    onChange(option);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const handleListKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!open) return;
    const maxIndex = options.length - 1;
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, maxIndex));
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, 0));
        break;
      case "Home":
        event.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        event.preventDefault();
        setActiveIndex(maxIndex);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (options[activeIndex]) {
          handleSelect(options[activeIndex]);
        }
        break;
      case "Escape":
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
        break;
      default:
        break;
    }
  };

  const trigger = (
    <button
      ref={triggerRef}
      type="button"
      onClick={() => !disabled && setOpen(true)}
      onKeyDown={(event) => {
        if (disabled) return;
        if (["ArrowDown", "Enter", " "].includes(event.key)) {
          event.preventDefault();
          setOpen(true);
        }
      }}
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-controls={listId}
      aria-label={label}
      className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm transition ${
        disabled
          ? "cursor-not-allowed border-border bg-secondary text-muted-foreground"
          : "border-border bg-white text-foreground shadow-sm hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      }`}
    >
      <span>{value || placeholder}</span>
      <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
    </button>
  );

  const listContent = (
    <div
      id={listId}
      role="listbox"
      aria-label={label}
      tabIndex={-1}
      onKeyDown={handleListKeyDown}
      className="max-h-60 w-full overflow-y-auto p-2"
    >
      {options.map((option, index) => {
        const isSelected = option === value;
        const isActive = index === activeIndex;
        return (
          <button
            key={option}
            ref={(el) => {
              itemRefs.current[index] = el;
            }}
            type="button"
            role="option"
            aria-selected={isSelected}
            onMouseEnter={() => setActiveIndex(index)}
            onClick={() => handleSelect(option)}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
              isSelected
                ? "bg-primary/10 text-primary"
                : isActive
                  ? "bg-secondary text-foreground"
                  : "text-foreground hover:bg-secondary"
            }`}
          >
            <span>{option}</span>
            {isSelected && <span className="text-xs font-semibold">Selected</span>}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="text-xs font-semibold text-muted-foreground">{label}</div>
      {isMobile ? (
        <>
          {trigger}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="w-[92vw] max-w-md rounded-2xl p-4">
              <DialogHeader>
                <DialogTitle className="text-base">Select class</DialogTitle>
              </DialogHeader>
              {listContent}
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild disabled={disabled}>
            {trigger}
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] rounded-xl p-2 shadow-lg">
            {listContent}
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};

export default ClassSelect;
