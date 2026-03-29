"use client";
import React, { useState, useEffect } from "react";

const DiscountManager = () => {
  const [discounts, setDiscounts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(""); // Stav pre chybu

  const [formData, setFormData] = useState({
    code: "",
    value: "",
    type: "P",
    exp_date: "",
    sum_limit: 0,
    multiple_use: false,
  });

  const API_BASE = "https://psiaskola.sk/wp-json/psia-skola/v1/discounts";

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    try {
      const response = await fetch(API_BASE);
      const data = await response.json();
      setDiscounts(data);
    } catch (err) {
      console.error("Chyba:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(""); // Resetuj chybu pred novým pokusom

    try {
      const response = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setFormData({
          code: "",
          value: "",
          type: "P",
          exp_date: "",
          sum_limit: 0,
          multiple_use: false,
        });
        await fetchDiscounts();
      } else {
        // WordPress WP_Error vráti správu v data.message
        setErrorMessage(data.message || "Vyskytla sa neočakávaná chyba.");
      }
    } catch (err) {
      setErrorMessage("Nepodarilo sa spojiť so serverom.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Odstrániť zľavu?")) return;
    await fetch(`${API_BASE}/delete`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setDiscounts((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-10">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-black mb-8 text-[var(--color-primary)] tracking-tight">
          Nový zľavový kód
        </h2>

        {/* ZOBRAZENIE CHYBY */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3 shadow-sm animate-pulse">
            <span className="font-bold">⚠️ {errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase text-gray-400 ml-1">
                KÓD
              </label>
              <input
                className="p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-primary)] shadow-inner"
                placeholder="NAPR. LETO20"
                value={formData.code}
                disabled={isSubmitting}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    code: e.target.value.toUpperCase(),
                  })
                }
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase text-gray-400 ml-1">
                Hodnota
              </label>
              <input
                type="number"
                className="p-3 bg-gray-50 rounded-xl outline-none shadow-inner"
                placeholder="0"
                value={formData.value}
                disabled={isSubmitting}
                onChange={(e) =>
                  setFormData({ ...formData, value: e.target.value })
                }
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase text-gray-400 ml-1">
                Typ
              </label>
              <select
                className="p-3 bg-gray-50 rounded-xl outline-none shadow-inner appearance-none cursor-pointer"
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
              >
                <option value="P">Percentá (%)</option>
                <option value="€">Fixná suma (€)</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase text-gray-400 ml-1">
                Expirácia
              </label>
              <input
                type="date"
                className="p-3 bg-gray-50 rounded-xl outline-none shadow-inner"
                value={formData.exp_date}
                onChange={(e) =>
                  setFormData({ ...formData, exp_date: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <label className="flex items-center group cursor-pointer">
              <input
                type="checkbox"
                className="hidden"
                checked={formData.multiple_use}
                onChange={(e) =>
                  setFormData({ ...formData, multiple_use: e.target.checked })
                }
              />
              <div
                className={`w-6 h-6 rounded-lg shadow-inner mr-3 flex items-center justify-center transition-colors ${formData.multiple_use ? "bg-[var(--color-primary)]" : "bg-gray-100"}`}
              >
                {formData.multiple_use && (
                  <div className="w-2 h-2 bg-white rounded-full" />
                )}
              </div>
              <span className="text-sm font-bold text-gray-500 uppercase tracking-tighter">
                Viacnásobné použitie
              </span>
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[var(--color-primary)] text-white px-10 py-3 rounded-xl font-black shadow-lg shadow-[var(--color-primary)]/30 hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50"
            >
              {isSubmitting ? "VYTVÁRAM..." : "VYTVORIŤ ZĽAVU"}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50">
              <th className="p-5 text-xs font-black uppercase text-gray-400 tracking-widest">
                Kód
              </th>
              <th className="p-5 text-xs font-black uppercase text-gray-400 tracking-widest">
                Hodnota
              </th>
              <th className="p-5 text-xs font-black uppercase text-gray-400 tracking-widest">
                Expirácia
              </th>
              <th className="p-5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {discounts?.map((d) => (
              <tr
                key={d.id}
                className="hover:bg-gray-50/80 transition-colors group"
              >
                <td className="p-5 font-bold text-gray-800 uppercase tracking-tight">
                  <span className="bg-gray-100 px-3 py-1 rounded-lg">
                    {d.code}
                  </span>
                  {d.multiple_use === "1" && (
                    <span className="ml-2 text-[10px] text-[var(--color-tertiary)] font-black italic tracking-normal">
                      MULTI
                    </span>
                  )}
                </td>
                <td className="p-5 font-medium text-gray-600">
                  {d.value} {d.type === "P" ? "%" : "€"}
                </td>
                <td className="p-5 text-gray-500 font-medium">
                  {new Date(d.exp_date).toLocaleDateString("sk-SK")}
                </td>
                <td className="p-5 text-right">
                  <button
                    onClick={() => handleDelete(d.id)}
                    className="group-hover:opacity-100 bg-red-50 text-red-500 px-4 py-2 rounded-lg font-black text-xs hover:bg-red-500 hover:text-white transition-all shadow-sm"
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
  );
};

export default DiscountManager;
