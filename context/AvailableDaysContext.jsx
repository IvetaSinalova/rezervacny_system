// context/AvailableDaysContext.js
"use client";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";

const AvailableDaysContext = createContext();

export const useAvailableDays = () => useContext(AvailableDaysContext);

export const AvailableDaysProvider = ({ children }) => {
  const [availableDays, setAvailableDays] = useState([]);
  const [calendarData, setCalendarData] = useState({});
  const [loading, setLoading] = useState(true);
  const [price, setPrice] = useState(0);
  const [priceTrainingWalk, setPriceTrainingWalk] = useState(0);
  const [accommodations, setAccommodations] = useState({});
  const [loadedMonths, setLoadedMonths] = useState([]);

  const normalizeDate = (date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const fetchAvailableDays = useCallback(async ({ from, to, serviceName }) => {
    try {
      const response = await fetch(
        "https://psiaskola.sk/wp-json/events/v1/get-available-accomodation-days",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ from, to, event_name: serviceName }),
        }
      );

      const data = await response.json();
      console.log(data);

      // Normalize dates
      const normalizedDays = data.availableDays.map((d) => ({
        ...d,
        date: normalizeDate(new Date(d.date)),
      }));

      setAvailableDays((prev) => [...prev, ...normalizedDays]);

      // Calendar mapping
      setCalendarData((prev) => {
        const newData = { ...prev };
        normalizedDays.forEach((item) => {
          const key = item.date.toISOString().split("T")[0];
          if (!newData[key]) newData[key] = item;
        });
        return newData;
      });

      setPrice(data.price);
      setPriceTrainingWalk(data.priceTrainingWalk);
      setAccommodations(data.accommodations);
    } catch (err) {
      console.error("Failed to fetch available days:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMonth = useCallback(
    async (month, serviceName) => {
      const monthKey = `${month.getFullYear()}-${month.getMonth()}`;
      if (loadedMonths.includes(monthKey)) return;

      const fromDate = new Date(month.getFullYear(), month.getMonth(), 1);
      const toDate = new Date(month.getFullYear(), month.getMonth() + 2, 0);

      const format = (date) =>
        `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
          2,
          "0"
        )}-${String(date.getDate()).padStart(2, "0")}`;

      await fetchAvailableDays({
        from: format(fromDate),
        to: format(toDate),
        serviceName,
      });

      setLoadedMonths((prev) => [...prev, monthKey]);
    },
    [loadedMonths, fetchAvailableDays]
  );

  return (
    <AvailableDaysContext.Provider
      value={{
        availableDays,
        calendarData,
        loading,
        price,
        priceTrainingWalk,
        accommodations,
        fetchAvailableDays,
        loadMonth,
      }}
    >
      {children}
    </AvailableDaysContext.Provider>
  );
};
