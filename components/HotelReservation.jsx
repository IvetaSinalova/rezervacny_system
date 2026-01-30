"use client";
import { useEffect, useState, useCallback } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { sk } from "date-fns/locale";
import "../styles/EventCalendar.css";
import Loading from "./Loading";
import HotelReservationForm from "./forms/HotelReservationForm";

export default function HotelReservation({ serviceName }) {
  const today = new Date();
  const isDailyService = serviceName?.includes("Denný");
  const [accommodations, setAccommodations] = useState({});
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedDayData, setSelectedDayData] = useState(null);
  const [hoveredDay, setHoveredDay] = useState(null);
  const [calendarData, setCalendarData] = useState({});
  const [pricePerDay, setPricePerDay] = useState(0);
  const [numOfNights, setNumOfNights] = useState(0);
  const [month, setMonth] = useState(today);
  const [range, setRange] = useState(null); // selected range
  const [disabledDays, setDisabledDays] = useState([]);
  const [rangeError, setRangeError] = useState(null); // invalid days
  const [modalOpen, setModalOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formDates, setFormDates] = useState(null);
  const [trainingWalkPrice, setTrainingWalkPrice] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadedMonths, setLoadedMonths] = useState([]); // track which months are already fetched
  const [prefetchingYear, setPrefetchingYear] = useState(false);
  // Build available + disabled day sets
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

  const deselectDays = () => {
    setSelectedDayData(null);
    setRange(null);
  };

  // Fetch API data for a given month
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
        setPricePerDay(data.price);
        setTrainingWalkPrice(data.priceTrainingWalk);
        setAccommodations(data.accommodations);
        setLoadedMonths((prev) => [...prev, monthKey]);
      } catch (err) {
        console.error("Failed to fetch available days:", err);
      }
    },
    [buildDaySets, loadedMonths],
  );

  // Prefetch full year in background
  const prefetchYear = useCallback(
    async (year) => {
      if (prefetchingYear) return;
      setPrefetchingYear(true);

      const promises = [];
      for (let m = 0; m < 12; m++) {
        const monthKey = `${year}-${m}`;
        if (!loadedMonths.includes(monthKey)) {
          const baseMonth = new Date(year, m, 1);
          promises.push(loadMonth(baseMonth));
        }
      }

      await Promise.all(promises);
      setPrefetchingYear(false);
    },
    [loadedMonths, loadMonth, prefetchingYear],
  );

  // Initial load
  useEffect(() => {
    loadMonth(month).then(() => {
      setLoading(false);
      prefetchYear(month.getFullYear()); // background prefetch
    });
  }, []);

  const isSameDay = (d1, d2) => {
    if (!d1 || !d2) return false; // one of them is missing
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  // Handle range selection
  const handleSelect = (value) => {
    if (isDailyService) {
      // SINGLE DAY SERVICE
      selectSingleDay(value);
      setNumOfNights(1);
      return;
    }

    // RANGE SERVICE
    if (isSameDay(value.from, value.to)) {
      setRange({ from: value.from, to: undefined });
      return;
    }

    if (range.from && range.to) {
      setRange({
        from: null,
        to: null,
      });
    }

    const from = new Date(value.from);
    const to = new Date(value.to);
    const invalidDays = [];

    let d = new Date(from);
    while (d <= to) {
      if (disabledDays.some((x) => x.toDateString() === d.toDateString())) {
        invalidDays.push(new Date(d));
      }
      d.setDate(d.getDate() + 1);
    }

    if (invalidDays.length > 0) {
      setRangeError(invalidDays);
      setModalOpen(true);
      return;
    }

    setRange(value);
    setRangeError(null);

    setFormDates({ startDate: from, endDate: to });
    selectSingleDayFromMany(value.from, value.to);

    const nights = Math.round(
      (to.getTime() - from.getTime() + 1) / (1000 * 60 * 60 * 24),
    );

    setNumOfNights(nights);
    setFormOpen(true);
    setModalOpen(true);
  };

  // Confirm modal
  const handleModalOk = () => {
    setDisabledDays([...disabledDays, ...rangeError]);
    setRangeError(null);
    setModalOpen(false);
    setRange(null);
  };

  // Handle month change
  const handleMonthChange = (newMonth) => {
    setMonth(newMonth);
    loadMonth(newMonth);

    // Check if user navigated to last loaded month -> trigger full year prefetch
    const lastVisibleMonth = new Date(
      newMonth.getFullYear(),
      newMonth.getMonth() + 1,
      1,
    );
    const lastMonthKey = `${lastVisibleMonth.getFullYear()}-${lastVisibleMonth.getMonth()}`;
    if (!loadedMonths.includes(lastMonthKey)) {
      prefetchYear(newMonth.getFullYear());
    }
  };

  const selectSingleDay = (day) => {
    if (!day) return;

    if (disabledDays.some((d) => d.toDateString() === day.toDateString()))
      return;

    const key = formatDateKey(day);
    const dayData = calendarData[key];

    setSelectedDay(day);
    setSelectedDayData(dayData.accommodations);
    setFormDates({ startDate: day, endDate: day });
    setFormOpen(true);
    setModalOpen(true);
  };

  const selectSingleDayFromMany = (from, to) => {
    if (!from || !to || from.getTime() >= to.getTime()) {
      console.warn("Invalid date range provided.");
      return {};
    }

    // Initialize the main tracker object.
    // Keys will be accommodation names (e.g., 'Koterec'), values will be the minimum count found.
    let minAvailabilityTracker = {};

    // 1. Setup the mutable UTC-normalized copy for iteration
    let currentDate = new Date(
      Date.UTC(from.getFullYear(), from.getMonth(), from.getDate()),
    );

    const loopEndDate = new Date(
      Date.UTC(to.getFullYear(), to.getMonth(), to.getDate()),
    );

    // 2. The Date Iteration Loop
    while (currentDate.getTime() < loopEndDate.getTime()) {
      // A. Generate the 'YYYY-MM-DD' key
      const year = currentDate.getUTCFullYear();
      const month = currentDate.getUTCMonth() + 1;
      const dayOfMonth = currentDate.getUTCDate();
      const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(
        dayOfMonth,
      ).padStart(2, "0")}`;

      const day = calendarData[dateKey];

      if (day) {
        const accommodations = day.accommodations || [];

        // C. Track minimums for explicitly listed accommodations
        accommodations.forEach((acc) => {
          const accName = acc.name;
          const freeCount = Number(acc.free);

          // If this type isn't tracked yet OR the current day's count is lower, update.
          if (
            minAvailabilityTracker[accName] === undefined ||
            freeCount < minAvailabilityTracker[accName].free
          ) {
            minAvailabilityTracker[accName] = {
              free: freeCount,
              date: dateKey, // Optionally track *when* the minimum occurred
            };
          }
        });
      }

      // D. Advance the date by one day.
      currentDate.setDate(currentDate.getDate() + 1);
    }
    const finalAccommodationsArray = Object.entries(minAvailabilityTracker).map(
      ([name, data]) => {
        return {
          name: name, // The key (e.g., "Koterec") becomes the 'name' property
          free: data.free, // The value's 'free' property becomes the 'free' property
          // You could also include the 'date' if needed: date: data.date
        };
      },
    );
    setSelectedDayData(finalAccommodationsArray);

    return minAvailabilityTracker;
  };

  const formatDateKey = (date) => {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, "0");
    const d = date.getDate().toString().padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const handleDayHover = (day) => {
    setHoveredDay(day);
  };

  const hoverRange =
    range?.from && !range.to && hoveredDay
      ? { from: range.from, to: hoveredDay }
      : null;

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
        mode="range"
        selected={range}
        onSelect={handleSelect}
        numberOfMonths={2}
        onDayMouseEnter={handleDayHover} // track hover
        disabled={disabledDays}
        modifiers={{
          selected: range,
          hoverRange, // dynamic hover range
          today: new Date(),
        }}
        locale={sk}
        modifiersStyles={{
          selected: {
            backgroundColor: "var(--color-tertiary)",
            color: "#fff",
            borderRadius: "50%",
          },
          hoverRange: {
            backgroundColor: "var(--color-tertiary)",
            borderRadius: "50%",
            color: "#fff",
          },
          today: {
            backgroundColor: "var(--color-light)",
            color: "black",
            borderRadius: "50%",
          },
          disabled: {
            opacity: 0.3,
            cursor: "not-allowed",
          },
        }}
      />

      {/* Modal overlay */}
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
          {" "}
          {formOpen && formDates ? (
            <div className="fixed inset-0 z-30 flex items-start justify-center px-4">
              <div className="relative bg-white p-6 shadow-xl w-full max-w-3xl h-[calc(100vh)] overflow-y-auto">
                {/* Close button */}
                <button
                  onClick={() => {
                    setRange(null);
                    setFormOpen(false);
                    setFormDates(null);
                    setModalOpen(false);
                  }}
                  className="absolute top-3 right-3 w-10 h-10 flex items-center justify-center rounded-full border border-[var(--color-secondary)] text-[var(--color-secondary)] text-2xl hover:bg-[var(--color-secondary)] hover:text-white transition-all"
                >
                  ×
                </button>

                <HotelReservationForm
                  serviceName={serviceName}
                  startDate={formDates.startDate}
                  endDate={formDates.endDate}
                  accommodations={selectedDayData}
                  pricePerDay={pricePerDay}
                  numOfNights={numOfNights}
                  trainingWalkPrice={trainingWalkPrice}
                  setModal={(state) => {
                    setModalOpen(state);
                  }}
                  accommodationsPrice={accommodations}
                  deselectDays={deselectDays}
                />
              </div>
            </div>
          ) : (
            <div
              style={{
                backgroundColor: "#fff",
                padding: "25px",
                borderRadius: "10px",
                maxWidth: "400px",
                textAlign: "center",
              }}
            >
              <p style={{ marginBottom: "16px", fontSize: "18px" }}>
                Ľutujeme, vo vybraných termínoch –{" "}
                <strong>
                  {rangeError
                    .map((d) => d.toLocaleDateString("sk-SK"))
                    .join(", ")}
                </strong>{" "}
                už nemáme dostupné ubytovanie.
              </p>
              <button
                onClick={handleModalOk}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "var(--color-tertiary)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
              >
                OK
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
