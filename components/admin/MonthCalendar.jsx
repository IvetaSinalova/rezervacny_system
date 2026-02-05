import { useEffect, useState } from "react";
import { DayPicker } from "react-day-picker";
import { sk } from "date-fns/locale";
import "../../styles/EventCalendar.css";

import "react-day-picker/dist/style.css";

export default function MonthCalendar({
  activityDaysProps,
  setNewInitialDate,
}) {
  const [activityDays, setActivityDays] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const updateScreen = () => {
      setIsMobile(window.innerWidth < 768);
    };

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

  function setFirstWeekDay(date) {
    const clicked = new Date(date);

    // // Make Monday = 0, Sunday = 6
    // const dayOfWeek = (clicked.getDay() + 6) % 7;

    // // Calculate Monday of the same week
    // const weekStart = new Date(clicked);
    // weekStart.setDate(clicked.getDate() - dayOfWeek);
    // 2. Check screen width

    setNewInitialDate(clicked);
  }

  return (
    <DayPicker
      locale={sk}
      numberOfMonths={isMobile ? 1 : 2}
      onDayClick={(day) => {
        setSelectedDay(day);

        if (isMobile) {
          // 📱 Mobile → use selected day
          setNewInitialDate(day);
        } else {
          // 🖥 Desktop → use Monday of that week
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
          borderRadius: "50%", // full circle
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          lineHeight: "2.2em", // center the text
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
          borderRadius: "50%", // full circle
          alignItems: "center",
          lineHeight: "2.2em", // center the text
        },
      }}
    />
  );
}
