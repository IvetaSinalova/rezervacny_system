"use client";
import React, { useState, useRef, useEffect } from "react";

export default function CustomDropdown({
  label,
  options = [],
  value,
  onSelect,
  hasError = false, // new prop
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="flex flex-col gap-1 shadow-xl bg-white p-6 rounded-2xl">
      <label className="font-semibold text-sm">{label}</label>

      <div ref={ref} className="relative">
        {/* Selected box */}
        <button
          type="button"
          onClick={() => setOpen((p) => !p)}
          className={`
             w-full p-3 pr-10 text-left border rounded-xl bg-white shadow-sm
            border-[var(--color-tertiary)]
            hover:border-[var(--color-secondary)]
            focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)]
            ${
              hasError
                ? "border-red-500"
                : "border-[var(--color-tertiary)] hover:border-[var(--color-secondary)]"
            }
          `}
        >
          {value || "Vyberte možnosť"}
        </button>

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

        {/* Dropdown menu */}
        {open && (
          <div
            className="
              absolute z-20 w-full bg-white rounded-xl shadow-xl border
              border-[var(--color-tertiary)] overflow-hidden
            "
          >
            {options.map((opt) => (
              <div
                key={opt}
                onClick={() => {
                  onSelect(opt);
                  setOpen(false);
                }}
                className={`
                  p-3 cursor-pointer transition-colors 
                  ${
                    opt === value
                      ? "bg-[var(--color-tertiary)] text-white"
                      : "hover:bg-[var(--color-tertiary)] hover:text-white"
                  }
                `}
              >
                {opt}
              </div>
            ))}
          </div>
        )}
      </div>
      {hasError && <p className="text-red-500 text-sm">Pole je povinné</p>}
    </div>
  );
}
