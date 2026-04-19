"use client";
import { exit } from "process";
import React, { useState, useEffect } from "react";

const DiscountManager = () => {
  // Data from API
  const [discounts, setDiscounts] = useState([]);
  const [shortTermEvents, setShortTermEvents] = useState([]);
  const [longTermEvents, setLongTermEvents] = useState([]);

  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [eventType, setEventType] = useState("none");

  const [formData, setFormData] = useState({
    code: "",
    value: "",
    type: "%",
    exp_date: "",
    sum_limit: 0,
    multiple_use: false,
    id_long_term_event: "",
    id_short_term_event: "",
  });

  const API_BASE = "https://psiaskola.sk/wp-json/psia-skola/v1/discounts";

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const response = await fetch(API_BASE);
      const data = await response.json();

      // Destructure the data based on your PHP return [ "discounts" => ..., "long_term_events" => ... ]
      setDiscounts(data.discounts || []);
      setShortTermEvents(data.short_term_events || []);
      setLongTermEvents(data.long_term_events || []);
    } catch (err) {
      console.error("Chyba pri načítaní dát:", err);
      setErrorMessage("Nepodarilo sa načítať dáta zo servera.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    // Prepare payload: only send the ID for the selected event type
    const payload = {
      ...formData,
      id_short_term_event:
        eventType === "short" ? formData.id_short_term_event : "",
      id_long_term_event:
        eventType === "long" ? formData.id_long_term_event : "",
    };

    try {
      const response = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setFormData({
          code: "",
          value: "",
          type: "%",
          exp_date: "",
          sum_limit: 0,
          multiple_use: false,
          id_long_term_event: "",
          id_short_term_event: "",
        });
        setEventType("none");
        await fetchInitialData(); // Refresh everything
      } else {
        setErrorMessage(data.message || "Vyskytla sa chyba.");
      }
    } catch (err) {
      setErrorMessage("Chyba spojenia.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Odstrániť zľavu?")) return;
    try {
      await fetch(`${API_BASE}/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setDiscounts((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      alert("Chyba pri mazaní.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-10">
      <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-gray-100">
        <h2 className="text-2xl font-black mb-8 text-[var(--color-primary)] tracking-tight">
          Nový zľavový kód
        </h2>

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3">
            <span className="font-bold">⚠️ {errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Main Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-1">
                Kód
              </label>
              <input
                className="p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-primary)] border border-transparent focus:border-transparent transition-all"
                value={formData.code}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    code: e.target.value.toUpperCase(),
                  })
                }
                placeholder="ALICKA50"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-1">
                Hodnota
              </label>
              <div className="relative">
                <input
                  type="number"
                  className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  value={formData.value}
                  onChange={(e) =>
                    setFormData({ ...formData, value: e.target.value })
                  }
                  required
                />
                <select
                  className="absolute right-2 top-1.5 bottom-1.5 bg-white border-none rounded-lg text-sm font-bold px-2 outline-none shadow-sm"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                >
                  <option value="%">%</option>
                  <option value="€">€</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-1">
                Min. nákup (€)
              </label>
              <input
                type="number"
                className="p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                value={formData.sum_limit}
                onChange={(e) =>
                  setFormData({ ...formData, sum_limit: e.target.value })
                }
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-1">
                Expirácia
              </label>
              <input
                type="date"
                className="p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                value={formData.exp_date}
                onChange={(e) =>
                  setFormData({ ...formData, exp_date: e.target.value })
                }
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-1">
                Typ udalosti
              </label>
              <select
                className="p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-primary)] cursor-pointer"
                value={eventType}
                onChange={(e) => {
                  setEventType(e.target.value);
                  setFormData({
                    ...formData,
                    id_short_term_event: "",
                    id_long_term_event: "",
                  });
                }}
              >
                <option value="none">Všetky služby</option>
                <option value="short">Krátkodobé</option>
                <option value="long">Dlhodobé</option>
              </select>
            </div>
          </div>

          {/* Conditional Event Selection Row */}
          {eventType !== "none" && (
            <div className="p-4 bg-[var(--color-primary)]/5 rounded-2xl border border-[var(--color-primary)]/10 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase text-[var(--color-primary)] ml-1">
                  Vyberte
                  {eventType === "short"
                    ? "krátkodobý kurz"
                    : "dlhodobý kurz alebo hotel"}
                </label>
                <select
                  className="w-full p-3 bg-white rounded-xl outline-none border border-gray-200 focus:ring-2 focus:ring-[var(--color-primary)]"
                  value={
                    eventType === "short"
                      ? formData.id_short_term_event
                      : formData.id_long_term_event
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      [eventType === "short"
                        ? "id_short_term_event"
                        : "id_long_term_event"]: e.target.value,
                    })
                  }
                  required
                >
                  <option value="">-- Vyberte zo zoznamu --</option>
                  {(eventType === "short"
                    ? shortTermEvents
                    : longTermEvents
                  ).map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4">
            <label className="flex items-center cursor-pointer group">
              <input
                type="checkbox"
                className="hidden"
                checked={formData.multiple_use}
                onChange={(e) =>
                  setFormData({ ...formData, multiple_use: e.target.checked })
                }
              />
              <div
                className={`w-6 h-6 rounded-lg mr-3 flex items-center justify-center transition-all ${formData.multiple_use ? "bg-[var(--color-primary)] scale-110" : "bg-gray-200"}`}
              >
                {formData.multiple_use && (
                  <div className="w-2 h-2 bg-white rounded-full" />
                )}
              </div>
              <span className="text-sm font-bold text-gray-500 uppercase tracking-tighter group-hover:text-gray-700 transition-colors">
                Viacnásobné použitie
              </span>
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto bg-[var(--color-primary)] text-white px-12 py-4 rounded-2xl font-black shadow-xl shadow-[var(--color-primary)]/20 hover:shadow-2xl hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-50 disabled:translate-y-0"
            >
              {isSubmitting ? "SPRACOVÁVAM..." : "VYTVORIŤ ZĽAVOVÝ KÓD"}
            </button>
          </div>
        </form>
      </div>

      {/* Table Section */}
      {/* Inside your DiscountManager.js return statement */}

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="p-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                  Kód / Typ
                </th>
                <th className="p-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                  Platí pre
                </th>
                <th className="p-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                  Hodnota
                </th>
                <th className="p-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                  Min. nákup
                </th>
                <th className="p-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                  Expirácia
                </th>
                <th className="p-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {discounts.map((d) => (
                <tr
                  key={d.id}
                  className="hover:bg-gray-50/50 transition-colors group"
                >
                  {/* Kód Column */}
                  <td className="p-5">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-800 uppercase">
                        {d.code}
                      </span>
                      {d.multiple_use == "1" && (
                        <span className="text-[9px] text-blue-500 font-black">
                          MULTI-USE
                        </span>
                      )}
                    </div>
                  </td>

                  {/* NEW: Scope/Event Name Column */}
                  <td className="p-5">
                    {d.long_term_name ? (
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-[var(--color-tertiary)]">
                          Dlhodobý kurz
                        </span>
                        <span className="text-sm text-gray-600 truncate max-w-[200px]">
                          {d.long_term_name}
                        </span>
                      </div>
                    ) : d.short_term_name ? (
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-[var(--color-secondary)]">
                          Krátkodobý kurz
                        </span>
                        <span className="text-sm text-gray-600 truncate max-w-[200px]">
                          {d.short_term_name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm font-bold text-gray-400 uppercase italic">
                        Všetky služby
                      </span>
                    )}
                  </td>

                  <td className="p-5 font-bold text-gray-600">
                    {d.value}
                    {d.type}
                  </td>

                  <td className="p-5 font-medium text-gray-500">
                    {d.sum_limit > 0 ? `${d.sum_limit} €` : "0 €"}
                  </td>

                  <td className="p-5 text-gray-500 font-medium">
                    {new Date(d.exp_date).toLocaleDateString("sk-SK")}
                  </td>

                  <td className="p-5 text-right">
                    <button
                      onClick={() => handleDelete(d.id)}
                      className=" bg-red-50 text-red-500 px-4 py-2 rounded-xl font-black text-[10px] hover:bg-red-500 hover:text-white transition-all shadow-sm"
                    >
                      ODSTRÁNIŤ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DiscountManager;
