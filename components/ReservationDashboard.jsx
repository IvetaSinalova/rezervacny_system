"use client";
import React, { useState, useMemo, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import Loading from "./Loading";

const ReservationDashboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [selectedService, setSelectedService] = useState("All");
  const [selectedYear, setSelectedYear] = useState("All");
  const [selectedMonth, setSelectedMonth] = useState("All");

  const slovakMonths = {
    "01": "Január",
    "02": "Február",
    "03": "Marec",
    "04": "Apríl",
    "05": "Máj",
    "06": "Jún",
    "07": "Júl",
    "08": "August",
    "09": "September",
    10: "Október",
    11: "November",
    12: "December",
  };

  useEffect(() => {
    fetch("https://psiaskola.sk/wp-json/reservations/v1/stats")
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => console.error("Chyba pri načítaní dát:", err));
  }, []);

  // 1. Spracovanie unikátnych možností pre filtre
  const filterOptions = useMemo(() => {
    const years = new Set();
    const months = new Set();
    const serviceNames = new Set();

    data.forEach((item) => {
      const [year, month] = item.Month.split("-");
      years.add(year);
      months.add(month);
      serviceNames.add(item.service_name);
    });

    return {
      years: ["All", ...Array.from(years).sort().reverse()],
      months: ["All", ...Array.from(months).sort()],
      services: ["All", ...Array.from(serviceNames).sort()],
    };
  }, [data]);

  // 2. Logika filtrovania
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const [year, month] = item.Month.split("-");

      const serviceMatch =
        selectedService === "All" || item.service_name === selectedService;
      const yearMatch = selectedYear === "All" || year === selectedYear;
      const monthMatch = selectedMonth === "All" || month === selectedMonth;

      return serviceMatch && yearMatch && monthMatch;
    });
  }, [data, selectedService, selectedYear, selectedMonth]);

  // 3. Agregácia dát pre grafy
  const chartData = useMemo(() => {
    const context = data.reduce((acc, item) => {
      const [year, month] = item.Month.split("-");

      if (selectedService !== "All" && item.service_name !== selectedService)
        return acc;
      if (selectedYear !== "All" && year !== selectedYear) return acc;

      // PRIDANÁ PODMIENKA:
      if (selectedMonth !== "All" && month !== selectedMonth) return acc;

      if (!acc[item.Month]) {
        acc[item.Month] = { Month: item.Month, revenue: 0, count: 0 };
      }
      acc[item.Month].revenue += Number(item.revenue);
      acc[item.Month].count += Number(item.reservation_count);
      return acc;
    }, {});

    return Object.values(context).sort((a, b) =>
      a.Month.localeCompare(b.Month),
    );
  }, [data, selectedService, selectedYear, selectedMonth]); // Pridaný selectedMonth do závislostí

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        <Loading />
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prehľad tržieb</h1>
          <p className="text-sm text-gray-500">Filtrujte dáta podľa potreby</p>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Filter Služieb */}
          <select
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
          >
            <option value="All">Všetky služby</option>
            {filterOptions.services
              .filter((s) => s !== "All")
              .map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
          </select>

          {/* Filter Rokov */}
          <select
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <option value="All">Všetky roky</option>
            {filterOptions.years
              .filter((y) => y !== "All")
              .map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
          </select>

          {/* Filter Mesiacov */}
          <select
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            <option value="All">Všetky mesiace</option>
            {filterOptions.months
              .filter((m) => m !== "All")
              .map((m) => (
                <option key={m} value={m}>
                  {slovakMonths[m] || m}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Grafy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-400 uppercase mb-4">
            Suma tržieb (€)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f0f0f0"
                />
                <XAxis
                  dataKey="Month"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  tickFormatter={(val) => `${val}€`}
                />
                <Tooltip
                  cursor={{ fill: "#f8fafc" }}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                />
                <Bar
                  dataKey="revenue"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  name="Tržba"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-400 uppercase mb-4">
            Počet rezervácií
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f0f0f0"
                />
                <XAxis
                  dataKey="Month"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  name="Počet"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tabuľka */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold tracking-wider border-b">
              <tr>
                <th className="px-6 py-4">Obdobie</th>
                <th className="px-6 py-4">Služba</th>
                <th className="px-6 py-4">Počet</th>
                <th className="px-6 py-4 text-right">Tržba</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredData.length > 0 ? (
                filteredData.map((item, idx) => {
                  const [y, m] = item.Month.split("-");
                  return (
                    <tr
                      key={idx}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {slovakMonths[m]} {y}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {item.service_name}
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold">
                          {item.reservation_count}x
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900">
                        €{Number(item.revenue).toLocaleString("sk-SK")}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-10 text-center text-gray-400"
                  >
                    Neboli nájdené žiadne záznamy pre tento výber.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReservationDashboard;
