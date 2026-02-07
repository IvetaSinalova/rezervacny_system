"use client";
import { useEffect, useState, useCallback } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { sk } from "date-fns/locale";
import "../styles/EventCalendar.css";
import Loading from "./Loading";
import { ClientForm } from "./forms/ClientForm";

import DogFormAllInfo from "./forms/DogFormAllInfo"; // your form component
import LongTermEventForm from "./forms/LongTermEventForm";

export default function AccommodationCalendar({
  serviceName,
  autofill = false,
}) {
  const today = new Date();

  const [month, setMonth] = useState(today);
  const [numOfNights, setNumOfNights] = useState(0);
  const [price, setPrice] = useState(0);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedDayData, setSelectedDayData] = useState(null);
  const [disabledDays, setDisabledDays] = useState([]);
  const [loadedMonths, setLoadedMonths] = useState([]);
  const [prefetchingYear, setPrefetchingYear] = useState(false);
  const [calendarData, setCalendarData] = useState({});
  const [loading, setLoading] = useState(true);
  const [accommodations, setAccommodations] = useState({});

  const [modalOpen, setModalOpen] = useState(false);
  const [fixedDays, setFixedDays] = useState(0);

  const buildDaySets = useCallback((dataArray, baseMonth) => {
    const dates = dataArray.map((d) => new Date(d.date));
    const first = new Date(baseMonth.getFullYear(), baseMonth.getMonth(), 1);
    const last = new Date(baseMonth.getFullYear(), baseMonth.getMonth() + 2, 0);

    const allDays = [];
    let d = new Date(first);
    while (d <= last) {
      allDays.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }

    const disabled = allDays.filter(
      (d) => !dates.some((x) => x.toDateString() === d.toDateString()),
    );

    setDisabledDays((prev) => [
      ...prev,
      ...disabled.filter(
        (d) => !prev.some((pd) => pd.toDateString() === d.toDateString()),
      ),
    ]);

    setCalendarData((prev) => {
      const newData = { ...prev };
      dataArray.forEach((item) => {
        if (!newData[item.date]) newData[item.date] = item;
      });
      return newData;
    });
  }, []);

  const loadMonth = useCallback(
    async (baseMonth) => {
      const monthKey = `${baseMonth.getFullYear()}-${baseMonth.getMonth()}`;
      if (loadedMonths.includes(monthKey)) return;

      const fromDate = new Date(
        baseMonth.getFullYear(),
        baseMonth.getMonth(),
        1,
      );
      const toDate = new Date(
        baseMonth.getFullYear(),
        baseMonth.getMonth() + 2,
        0,
      );

      const format = (date) =>
        `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
      try {
        const response = await fetch(
          "https://psiaskola.sk/wp-json/events/v1/get-available-accomodation-days",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              from: format(fromDate),
              to: format(toDate),
              event_name: serviceName,
            }),
          },
        );

        const data = await response.json();

        buildDaySets(data.availableDays, baseMonth);
        setPrice(data.price);
        setFixedDays(data.fixedDays);
        setAccommodations(data.accommodations);
        setNumOfNights(data.fixedDays);
        setLoadedMonths((prev) => [...prev, monthKey]);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch available days:", err);
      }
    },
    [buildDaySets, loadedMonths],
  );

  const prefetchYear = useCallback(
    async (year) => {
      if (prefetchingYear) return;
      setPrefetchingYear(true);

      const promises = [];
      for (let m = 0; m < 12; m++) {
        const monthKey = `${year}-${m}`;
        if (!loadedMonths.includes(monthKey)) {
          promises.push(loadMonth(new Date(year, m, 1)));
        }
      }

      await Promise.all(promises);
      setPrefetchingYear(false);
    },
    [loadedMonths, loadMonth, prefetchingYear],
  );

  useEffect(() => {
    loadMonth(month).then(() => prefetchYear(month.getFullYear()));
  }, []);

  const handleMonthChange = (newMonth) => {
    setMonth(newMonth);
    loadMonth(newMonth);
    const lastVisibleMonth = new Date(
      newMonth.getFullYear(),
      newMonth.getMonth() + 1,
      1,
    );
    const lastMonthKey = `${lastVisibleMonth.getFullYear()}-${lastVisibleMonth.getMonth()}`;
    if (!loadedMonths.includes(lastMonthKey))
      prefetchYear(newMonth.getFullYear());
  };

  const handleDayClick = (day) => {
    if (disabledDays.some((d) => d.toDateString() === day.toDateString()))
      return;
    setSelectedDay(day);
    const key = formatDateKey(day);
    const dayData = calendarData[key];
    setSelectedDayData(dayData);

    if (dayData && dayData.available_times.length > 0) {
      setModalOpen(true); // open modal
    } else {
      setModalOpen(true); // still open modal to show form
    }
  };

  const formatDateKey = (date) => {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, "0");
    const d = date.getDate().toString().padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  if (loading)
    return (
      <div style={{ height: "100vh" }}>
        <Loading />
      </div>
    );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          fontSize: "30px",
          padding: "10px 0px",
          fontWeight: "bold",
          color: "var(--color-primary)",
        }}
      >
        {serviceName}
      </div>

      <DayPicker
        month={month}
        onMonthChange={handleMonthChange}
        numberOfMonths={2}
        selected={selectedDay}
        disabled={[
          ...disabledDays,
          { dayOfWeek: [0, 6] },
          { before: new Date().setHours(0, 0, 0, 0) },
        ]}
        locale={sk}
        onDayClick={handleDayClick}
        modifiers={{ today: new Date(), selected: selectedDay }}
        modifiersStyles={{
          today: {
            backgroundColor: "var(--color-secondary)",
            color: "#fff",
            borderRadius: "50%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            lineHeight: "2.2em",
          },
          selected: {
            backgroundColor: "#6C8065",
            border: "none",
            color: "#fff",
            borderRadius: "50%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            lineHeight: "2.2em",
          },
          disabled: { opacity: 0.3, cursor: "not-allowed" },
        }}
      />

      {/* Modal */}
      {modalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div className="fixed inset-0 z-30 flex items-start justify-center px-4">
            <div className="relative bg-white p-6 shadow-xl w-full max-w-3xl h-[calc(100vh)] overflow-y-auto">
              {/* Close button */}
              <button
                onClick={() => {
                  setSelectedDayData(null);
                  setSelectedDay(null);
                  setModalOpen(false);
                }}
                className="absolute top-3 right-3 w-10 h-10 flex items-center justify-center rounded-full border border-[var(--color-secondary)] text-[var(--color-secondary)] text-2xl hover:bg-[var(--color-secondary)] hover:text-white transition-all"
              >
                ×
              </button>

              <LongTermEventForm
                autofill={autofill}
                price={price}
                setModal={(state) => {
                  setModalOpen(state);
                }}
                numOfNights={numOfNights}
                accommodationsPrice={accommodations}
                serviceName={serviceName}
                availableTimes={selectedDayData?.available_times || []}
                accommodations={selectedDayData.accommodations}
                startDate={selectedDay.toLocaleDateString("sk-SK")}
                endDate={new Date(
                  selectedDay.getTime() + fixedDays * 24 * 60 * 60 * 1000,
                ).toLocaleDateString("sk-SK")}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
