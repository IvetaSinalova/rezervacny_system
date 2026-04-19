import { useEffect, useState } from "react";
import { DayPicker } from "react-day-picker";
import { sk } from "date-fns/locale";
import "../../styles/EventCalendar.css";

import "react-day-picker/dist/style.css";

export default function MonthCalendar({
  activityDaysProps,
  setNewInitialDate,
  initialDate,
}) {
  const [activityDays, setActivityDays] = useState([]);
  const [selectedDay, setSelectedDay] = useState(initialDate ?? null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const updateScreen = () => setIsMobile(window.innerWidth < 768);
    updateScreen();
    window.addEventListener("resize", updateScreen);
    return () => window.removeEventListener("resize", updateScreen);
  }, []);

  useEffect(() => {
    const dates = [];
    activityDaysProps.map((activeDay) => {
      const current = new Date(activeDay.start);
      const end = new Date(activeDay.end);
      while (current <= end) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
    });
    setActivityDays(dates);
  }, [activityDaysProps]);

  // Keep the selection in sync if the parent changes initialDate later
  // (e.g. URL ?date= changes after mount).
  useEffect(() => {
    if (initialDate) setSelectedDay(initialDate);
  }, [initialDate]);

  function setFirstWeekDay(date) {
    const clicked = new Date(date);
    setNewInitialDate(clicked);
  }

  return (
    <DayPicker
      locale={sk}
      numberOfMonths={isMobile ? 1 : 2}
      defaultMonth={initialDate ?? undefined}
      onDayClick={(day) => {
        setSelectedDay(day);
        if (isMobile) {
          setNewInitialDate(day);
        } else {
          setFirstWeekDay(day);
        }
      }}
      modifiers={{
        today: new Date(),
        hasActivity: activityDays,
        selected: selectedDay,
      }}
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
        hasActivity: {
          backgroundColor: "#e0dbd5",
          borderRadius: "50%",
          color: "#000",
        },
        selected: {
          backgroundColor: "#6C8065",
          border: "none",
          color: "#fff",
          borderRadius: "50%",
          alignItems: "center",
          lineHeight: "2.2em",
        },
      }}
    />
  );
}
