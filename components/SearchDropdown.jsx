"use client";
import React, { useEffect, useRef, useState } from "react";

export default function SearchDropdown({
  label,
  options = [],
  value,
  onSelect,
  placeholder = "Vyberte možnosť",
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  // close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div>
      <label className="font-semibold text-md">{label}</label>
      <div ref={ref} className="relative">
        {/* Selected */}
        <button
          type="button"
          onClick={() => setOpen((p) => !p)}
          className="
            w-full p-3 pr-10 text-left border rounded-xl bg-white shadow-sm
            border-[var(--color-tertiary)]
            hover:border-[var(--color-secondary)]
            focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)]
          "
        >
          {value?.label || placeholder}
        </button>

        {/* Arrow */}
        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
          <svg
            className={`w-4 h-4 transition-transform ${
              open ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>

        {/* Dropdown */}
        {open && (
          <div
            className="
              absolute z-20 w-full mt-2 bg-white rounded-xl shadow-xl border
              border-[var(--color-tertiary)] overflow-hidden
            "
          >
            {/* Search input */}
            <input
              type="text"
              placeholder="Hľadať..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="
                w-full p-3 border-b border-[var(--color-tertiary)]
                focus:outline-none
              "
            />

            {filtered.length === 0 && (
              <div className="p-3 text-sm text-gray-500">Žiadne výsledky</div>
            )}

            {filtered.map((opt) => (
              <div
                key={opt.value}
                onClick={() => {
                  onSelect(opt);
                  setOpen(false);
                  setSearch("");
                }}
                className={`
                  p-3 cursor-pointer transition-colors
                  ${
                    value?.value === opt.value
                      ? "bg-[var(--color-tertiary)] text-white"
                      : "hover:bg-[var(--color-tertiary)] hover:text-white"
                  }
                `}
              >
                {opt.label}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
