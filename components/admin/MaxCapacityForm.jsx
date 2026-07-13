"use client";
import React, { useState, useEffect } from "react";

export default function MaxCapacityForm() {
  const [value, setValue] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dots, setDots] = useState(".");

  // Fetch the current capacity on mount.
  useEffect(() => {
    fetch("/api/wp/events/v1/get-max-capacity")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.maxCapacity !== undefined) {
          setValue(String(data.maxCapacity));
        }
        setInitialLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setInitialLoading(false);
      });
  }, []);

  // Animate the three dots while the input is loading.
  useEffect(() => {
    if (!initialLoading) return;
    const id = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "." : prev + "."));
    }, 300);
    return () => clearInterval(id);
  }, [initialLoading]);

  const handleSubmit = async () => {
    if (isSubmitting) return;
    const n = parseInt(value, 10);
    if (!value.toString().trim() || isNaN(n) || n < 0) {
      alert("Zadajte platné číslo (0 alebo viac)");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(
        "/api/wp/events/v1/set-max-capacity",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newMaxCapacity: n }),
        },
      );
      const data = await res.json();
      if (data.success) {
        alert("Kapacita bola úspešne uložená!");
        setValue(String(n));
      } else {
        alert("Chyba pri ukladaní kapacity!");
      }
    } catch (err) {
      console.error(err);
      alert("Chyba pri ukladaní kapacity!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h2
        className="text-center font-bold text-lg mt-6"
        style={{
          backgroundColor: "var(--color-secondary)",
          color: "white",
          padding: "0.5rem 1rem",
          whiteSpace: "nowrap",
          fontWeight: 600,
        }}
      >
        Maximálna kapacita pre výcvik a prevýchovu
      </h2>

      <div className="flex items-center">
        <input
          id="max-capacity"
          type={initialLoading ? "text" : "number"}
          min="0"
          value={initialLoading ? dots : value}
          readOnly={initialLoading}
          onChange={(e) => setValue(e.target.value)}
          className="p-2 border border-secondary flex-1"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={initialLoading || isSubmitting}
        style={{
          marginTop: "1rem",
          backgroundColor: "var(--color-primary)",
          color: "white",
          padding: "0.5rem 1rem",
          border: "none",
          borderRadius: "4px",
          cursor: initialLoading || isSubmitting ? "not-allowed" : "pointer",
          opacity: initialLoading || isSubmitting ? 0.6 : 1,
        }}
      >
        {isSubmitting ? "Ukladám…" : "Uložiť"}
      </button>
    </div>
  );
}
