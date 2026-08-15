import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

interface DateRange {
  from: Date | null;
  to: Date | null;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  displayValue: string;
  isOpen?: boolean;
  onClose?: () => void;
}

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const presets = [
  { label: "Today", getValue: () => ({ from: new Date(), to: new Date() }) },
  {
    label: "Yesterday",
    getValue: () => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return { from: d, to: d };
    },
  },
  {
    label: "Last 7 Days",
    getValue: () => {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 7);
      return { from, to };
    },
  },
  {
    label: "Last 30 Days",
    getValue: () => {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 30);
      return { from, to };
    },
  },
  {
    label: "This Month",
    getValue: () => {
      const now = new Date();
      return {
        from: new Date(now.getFullYear(), now.getMonth(), 1),
        to: new Date(now.getFullYear(), now.getMonth() + 1, 0),
      };
    },
  },
  {
    label: "Last Month",
    getValue: () => {
      const now = new Date();
      return {
        from: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        to: new Date(now.getFullYear(), now.getMonth(), 0),
      };
    },
  },
  {
    label: "This Year",
    getValue: () => {
      const now = new Date();
      return { from: new Date(now.getFullYear(), 0, 1), to: new Date(now.getFullYear(), 11, 31) };
    },
  },
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function isSameDate(d1: Date | null, d2: Date | null) {
  if (!d1 || !d2) return false;
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function isDateInRange(date: Date, from: Date | null, to: Date | null) {
  if (!from || !to) return false;
  const time = date.getTime();
  return time >= from.getTime() && time <= to.getTime();
}

function isToday(date: Date) {
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

export default function DateRangePicker({
  value,
  onChange,
  displayValue,
  isOpen: externalIsOpen,
  onClose,
}: DateRangePickerProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  const initMonth = value?.from ? value.from.getMonth() : new Date().getMonth();
  const initYear = value?.from ? value.from.getFullYear() : new Date().getFullYear();

  const [leftMonth, setLeftMonth] = useState(initMonth);
  const [leftYear, setLeftYear] = useState(initYear);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [selecting, setSelecting] = useState<"from" | "to">("from");
  const [tempFrom, setTempFrom] = useState<Date | null>(value?.from ?? null);
  const [tempTo, setTempTo] = useState<Date | null>(value?.to ?? null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTempFrom(value?.from ?? null);
      setTempTo(value?.to ?? null);
      setSelecting("from");
      if (value?.from) {
        setLeftMonth(value.from.getMonth());
        setLeftYear(value.from.getFullYear());
      }
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setInternalIsOpen(false);
    if (onClose) onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        handleClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, handleClose]);

  const rightMonth = leftMonth === 11 ? 0 : leftMonth + 1;
  const rightYear = leftMonth === 11 ? leftYear + 1 : leftYear;

  const navigateLeft = (dir: number) => {
    let newMonth = leftMonth + dir;
    let newYear = leftYear;
    if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    }
    if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    }
    setLeftMonth(newMonth);
    setLeftYear(newYear);
  };

  const handleDayClick = (date: Date) => {
    if (selecting === "from") {
      setTempFrom(date);
      setTempTo(null);
      setSelecting("to");
    } else {
      let newFrom = tempFrom;
      let newTo = date;
      if (tempFrom && date < tempFrom) {
        newFrom = date;
        newTo = tempFrom;
      }
      setTempFrom(newFrom);
      setTempTo(newTo);
      setSelecting("from");
      if (newFrom && newTo) {
        onChange({ from: newFrom, to: newTo });
        handleClose();
      }
    }
  };

  const handlePreset = (preset: (typeof presets)[0]) => {
    const range = preset.getValue();
    setTempFrom(range.from);
    setTempTo(range.to);
    onChange(range);
    handleClose();
  };

  const handleClear = () => {
    setTempFrom(null);
    setTempTo(null);
    setSelecting("from");
  };

  const formatDate = (d: Date | null) => {
    if (!d) return "";
    return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
  };

  const renderCalendar = (year: number, month: number) => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    return (
      <div className="flex-1">
        <div className="mb-3 text-center">
          <span className="text-sm font-bold text-foreground">
            {months[month]} {year}
          </span>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
            <div
              key={d}
              className="py-1 text-center text-[10px] font-semibold text-muted-foreground"
            >
              {d}
            </div>
          ))}
          {days.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} />;
            const date = new Date(year, month, day);
            const isStart = isSameDate(date, tempFrom);
            const isEnd = isSameDate(date, tempTo);
            const isInRange = isDateInRange(date, tempFrom, tempTo);
            const isHoverRange =
              selecting === "to" && tempFrom && hoverDate && date > tempFrom && date <= hoverDate;
            const today = isToday(date);

            return (
              <button
                key={day}
                type="button"
                onClick={() => handleDayClick(date)}
                onMouseEnter={() => setHoverDate(date)}
                onMouseLeave={() => setHoverDate(null)}
                className={`relative flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-all ${
                  isStart || isEnd
                    ? "bg-[#2563eb] text-white"
                    : isInRange || isHoverRange
                      ? "bg-[#2563eb]/10 text-[#2563eb]"
                      : today
                        ? "font-bold text-[#2563eb]"
                        : "text-foreground hover:bg-muted"
                }`}
              >
                {day}
                {today && !isStart && !isEnd && (
                  <span className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#2563eb]" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      className="absolute left-0 top-full z-50 mt-2 w-[700px] rounded-2xl border border-border bg-white p-5 shadow-xl"
    >
      {/* Summary */}
      <div className="mb-4 flex items-center gap-2 rounded-xl bg-[#f0f4f8] px-4 py-3">
        <Calendar className="h-4 w-4 text-[#2563eb]" />
        <span className="text-sm font-semibold text-foreground">
          {tempFrom ? formatDate(tempFrom) : "Start Date"}
        </span>
        <span className="text-sm text-muted-foreground">→</span>
        <span className="text-sm font-semibold text-foreground">
          {tempTo ? formatDate(tempTo) : "End Date"}
        </span>
      </div>

      <div className="flex gap-6">
        {/* Presets */}
        <div className="w-36 shrink-0 border-r border-border pr-4">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Quick Presets
          </div>
          <div className="space-y-1">
            {presets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => handlePreset(preset)}
                className="w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-foreground transition-colors hover:bg-[#2563eb]/10 hover:text-[#2563eb]"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Calendars */}
        <div className="flex flex-1 gap-4">
          <button
            type="button"
            onClick={() => navigateLeft(-1)}
            className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex flex-1 gap-4">
            {renderCalendar(leftYear, leftMonth)}
            {renderCalendar(rightYear, rightMonth)}
          </div>

          <button
            type="button"
            onClick={() => navigateLeft(1)}
            className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
        <button
          type="button"
          onClick={handleClear}
          className="rounded-lg px-4 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={handleClose}
          className="rounded-xl border border-border px-5 py-2.5 text-xs font-bold text-foreground transition-colors hover:bg-muted"
        >
          Close
        </button>
      </div>
    </div>
  );
}
