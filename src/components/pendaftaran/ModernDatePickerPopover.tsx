"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";

type Props = {
  value: string; // YYYY-MM-DD or ""
  onChange: (nextIso: string) => void;
  defaultYear?: string;
  defaultMonth?: string;
  highlightedDates?: string[];
  placeholder?: string;
  ariaLabel?: string;
};

const WEEKDAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const POPOVER_WIDTH = 300;
const ESTIMATED_POPOVER_HEIGHT = 330;
const VIEWPORT_MARGIN = 12;

function getNowWibDate(): Date {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }),
  );
}

function toIsoYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseYmd(iso?: string): Date | null {
  if (!iso) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) return null;
  const dt = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function formatTriggerDate(iso: string): string {
  const dt = parseYmd(iso);
  if (!dt) return iso;
  return dt.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ModernDatePickerPopover({
  value,
  onChange,
  defaultYear,
  defaultMonth,
  highlightedDates,
  placeholder = "Pilih Tanggal",
  ariaLabel = "Pilih tanggal filter",
}: Props) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null,
  );
  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const todayIso = useMemo(() => toIsoYmd(getNowWibDate()), []);
  const highlightSet = useMemo(
    () => new Set(highlightedDates || []),
    [highlightedDates],
  );

  const initialCursor = useMemo(() => {
    const selected = parseYmd(value);
    if (selected) {
      return new Date(selected.getFullYear(), selected.getMonth(), 1);
    }
    const now = getNowWibDate();
    const yr = defaultYear ? Number(defaultYear) : now.getFullYear();
    const mo = defaultMonth ? Number(defaultMonth) - 1 : now.getMonth();
    return new Date(yr, mo, 1);
  }, [value, defaultYear, defaultMonth]);

  const [viewCursor, setViewCursor] = useState<Date>(initialCursor);

  const updatePopoverPosition = useCallback(() => {
    const triggerEl = triggerRef.current;
    if (!triggerEl) return;

    const rect = triggerEl.getBoundingClientRect();
    const popoverHeight =
      popoverRef.current?.offsetHeight || ESTIMATED_POPOVER_HEIGHT;

    const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_MARGIN;
    const spaceAbove = rect.top - VIEWPORT_MARGIN;

    let top: number;
    if (spaceBelow >= popoverHeight || spaceBelow >= spaceAbove) {
      top = Math.min(
        rect.bottom + 8,
        Math.max(
          VIEWPORT_MARGIN,
          window.innerHeight - popoverHeight - VIEWPORT_MARGIN,
        ),
      );
    } else {
      top = Math.max(VIEWPORT_MARGIN, rect.top - popoverHeight - 8);
    }

    const left = Math.max(
      VIEWPORT_MARGIN,
      Math.min(rect.left, window.innerWidth - POPOVER_WIDTH - VIEWPORT_MARGIN),
    );

    setCoords({ top, left });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePopoverPosition();
  }, [open, viewCursor, updatePopoverPosition]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    const onViewportChange = () => {
      updatePopoverPosition();
    };

    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onViewportChange);
    window.addEventListener("scroll", onViewportChange, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("scroll", onViewportChange, true);
    };
  }, [open, updatePopoverPosition]);

  const handleToggleOpen = () => {
    if (!open) {
      setViewCursor(initialCursor);
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

  const viewYear = viewCursor.getFullYear();
  const viewMonth = viewCursor.getMonth();

  const calendarCells = useMemo(() => {
    const firstOfMonth = new Date(viewYear, viewMonth, 1);
    const startOffset = (firstOfMonth.getDay() + 6) % 7; // Mon=0 .. Sun=6
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

    const cells: Array<{
      date: Date;
      iso: string;
      inCurrentMonth: boolean;
    }> = [];

    for (let i = 0; i < totalCells; i++) {
      const cellDate = new Date(viewYear, viewMonth, 1 - startOffset + i);
      cells.push({
        date: cellDate,
        iso: toIsoYmd(cellDate),
        inCurrentMonth: cellDate.getMonth() === viewMonth,
      });
    }
    return cells;
  }, [viewYear, viewMonth]);

  return (
    <div ref={triggerRef} className="relative inline-flex items-center">
      {/* Trigger Pill */}
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
          value
            ? "bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-700 text-[#0284c7] dark:text-sky-300"
            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600"
        }`}
      >
        <button
          type="button"
          onClick={handleToggleOpen}
          aria-expanded={open}
          aria-label={ariaLabel}
          className="inline-flex items-center gap-1.5 focus:outline-none cursor-pointer"
        >
          <CalendarDays className="w-3.5 h-3.5 text-[#0284c7] shrink-0" />
          <span className={value ? "" : "text-slate-500 dark:text-slate-400"}>
            {value ? formatTriggerDate(value) : placeholder}
          </span>
        </button>

        {value && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
            aria-label="Hapus filter tanggal"
            className="ml-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Viewport-aware Floating Calendar Popover */}
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={popoverRef}
            role="dialog"
            aria-label="Kalender filter tanggal pendaftaran"
            style={{
              position: "fixed",
              top: coords?.top ?? -9999,
              left: coords?.left ?? -9999,
              width: POPOVER_WIDTH,
              visibility: coords ? "visible" : "hidden",
            }}
            className="z-90 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 shadow-[0_22px_50px_-12px_rgba(15,23,42,0.25)] p-3.5 space-y-2.5 max-h-[calc(100vh-24px)] overflow-y-auto"
          >
            {/* Month Navigation Header */}
            <div className="flex items-center justify-between px-1">
              <button
                type="button"
                onClick={() =>
                  setViewCursor(new Date(viewYear, viewMonth - 1, 1))
                }
                aria-label="Bulan sebelumnya"
                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-sm font-extrabold text-slate-900 dark:text-white capitalize">
                {viewCursor.toLocaleDateString("id-ID", {
                  month: "long",
                  year: "numeric",
                })}
              </span>

              <button
                type="button"
                onClick={() =>
                  setViewCursor(new Date(viewYear, viewMonth + 1, 1))
                }
                aria-label="Bulan berikutnya"
                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Rounded Pill Weekday Header */}
            <div className="grid grid-cols-7 rounded-full bg-slate-100/90 dark:bg-slate-800 px-1.5 py-1.5 text-center">
              {WEEKDAYS.map((day, i) => (
                <span
                  key={day}
                  className={`text-[11px] font-semibold ${
                    i === 6
                      ? "text-slate-800 dark:text-slate-100"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {day}
                </span>
              ))}
            </div>

            {/* Dates Grid */}
            <div className="grid grid-cols-7 gap-y-0.5 text-center px-0.5">
              {calendarCells.map((cell) => {
                const isSelected = value === cell.iso;
                const isToday = todayIso === cell.iso;
                const hasRecord = highlightSet.has(cell.iso);

                return (
                  <div
                    key={cell.iso}
                    className="flex flex-col items-center justify-center py-0.5"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onChange(cell.iso);
                        setOpen(false);
                      }}
                      className={`relative w-8 h-8 rounded-full flex items-center justify-center text-xs transition cursor-pointer tabular-nums ${
                        isSelected
                          ? "bg-[#2563eb] text-white font-bold shadow-xs"
                          : isToday
                            ? "bg-blue-50 dark:bg-blue-950/60 text-[#2563eb] dark:text-blue-300 font-bold ring-1 ring-blue-300 dark:ring-blue-700"
                            : cell.inCurrentMonth
                              ? "text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                              : "text-slate-300 dark:text-slate-600 font-medium hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      }`}
                    >
                      <span
                        className={
                          hasRecord && !isSelected
                            ? "-translate-y-[2px] leading-none"
                            : "leading-none"
                        }
                      >
                        {cell.date.getDate()}
                      </span>
                      {hasRecord && !isSelected && (
                        <span className="absolute bottom-[3px] w-1 h-1 rounded-full bg-[#2563eb]" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Footer Quick Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => {
                  onChange(todayIso);
                  setOpen(false);
                }}
                className="text-[#2563eb] dark:text-blue-400 hover:underline cursor-pointer"
              >
                Hari Ini
              </button>

              {value ? (
                <button
                  type="button"
                  onClick={() => {
                    onChange("");
                    setOpen(false);
                  }}
                  className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                >
                  Hapus Pilihan
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  Tutup
                </button>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
