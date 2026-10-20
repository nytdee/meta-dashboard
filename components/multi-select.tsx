"use client";

import { Check, ChevronDown, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "./ui";

type MultiSelectProps = {
  label: string;
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
};

export default function MultiSelect({
  label,
  options,
  value,
  onChange,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (container.current && !container.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const filtered = options.filter((option) =>
    option.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const summary =
    value.length === options.length
      ? "All selected"
      : value.length === 0
        ? "None selected"
        : `${value.length} of ${options.length}`;

  function toggle(option: string) {
    onChange(
      value.includes(option)
        ? value.filter((item) => item !== option)
        : [...value, option],
    );
  }

  return (
    <div ref={container} className="relative">
      <span className="label-mono mb-1.5 block">{label}</span>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-line bg-surface-2 px-3 py-2 text-left text-sm transition hover:border-accent/40"
      >
        <span className="truncate font-medium">{summary}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted transition",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <div className="absolute z-40 mt-2 w-full rounded-xl border border-line bg-surface p-2 shadow-2xl shadow-black/10">
          <div className="flex items-center gap-2 rounded-lg bg-surface-2 px-2">
            <Search className="h-3.5 w-3.5 text-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search campaigns"
              className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted"
            />
          </div>

          <div className="my-2 flex items-center gap-2 px-1">
            <button
              type="button"
              onClick={() => onChange(options)}
              className="rounded px-2 py-1 text-[11px] font-medium text-accent hover:bg-accent/10"
            >
              Select all
            </button>
            <button
              type="button"
              onClick={() => onChange([])}
              className="rounded px-2 py-1 text-[11px] font-medium text-muted hover:bg-surface-2"
            >
              Clear
            </button>
          </div>

          <div className="max-h-60 overflow-y-auto pr-1">
            {filtered.length === 0 ? (
              <p className="px-2 py-3 text-xs text-muted">No matches</p>
            ) : (
              filtered.map((option) => {
                const checked = value.includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggle(option)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition hover:bg-surface-2"
                  >
                    <span
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                        checked
                          ? "border-accent bg-accent text-white"
                          : "border-line bg-surface",
                      )}
                    >
                      {checked ? <Check className="h-3 w-3" /> : null}
                    </span>
                    <span className="truncate">{option}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
