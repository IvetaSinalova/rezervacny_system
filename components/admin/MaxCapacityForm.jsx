"use client";
import React, { useState, useEffect } from "react";

export default function MaxCapacityForm({ updateLoading }) {
  const [value, setValue] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);
  const [dots, setDots] = useState(".");

  // Fetch the current capacity on mount.
  useEffect(() => {
    fetch("https://psiaskola.sk/wp-json/events/v1/get-max-capacity")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.maxCapacity !== undefined) {
          setValue(String(data.maxCapacity));
        }
        setInitialLoading(false);
        updateLoading && updateLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setInitialLoading(false);
        updateLoading && updateLoading(false);
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
    const n = parseInt(value, 10);
    if (!value.toString().trim() || isNaN(n) || n < 0) {
      alert("Zadajte platné číslo (0 alebo viac)");
      return;
    }

    updateLoading && updateLoading(true); // full-page loading via parent

    try {
      const res = await fetch(
        "https://psiaskola.sk/wp-json/events/v1/set-max-capacity",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newMaxCapacity: n }),
        },
      );
      const data = await res.json();
      updateLoading && updateLoading(false);

      if (data.success) {
        alert("Kapacita bola úspešne uložená!");
        setValue(String(n));
      } else {
        alert("Chyba pri ukladaní kapacity!");
      }
    } catch (err) {
      updateLoading && updateLoading(false);
      console.error(err);
      alert("Chyba pri ukladaní kapacity!");
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
        disabled={initialLoading}
        style={{
          marginTop: "1rem",
          backgroundColor: "var(--color-primary)",
          color: "white",
          padding: "0.5rem 1rem",
          border: "none",
          borderRadius: "4px",
          cursor: initialLoading ? "not-allowed" : "pointer",
          opacity: initialLoading ? 0.6 : 1,
        }}
      >
        Uložiť
      </button>
    </div>
  );
}
