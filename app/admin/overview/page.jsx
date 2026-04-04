// pages/admin/page.jsx
"use client";
import { useState, useEffect, useContext } from "react";
import { useSearchParams } from "next/navigation"; // Add this
import MonthCalendar from "../../../components/admin/MonthCalendar.jsx";
import HandleEventCalendar from "../../../components/admin/HandleEventCalendar.jsx";
import Loading from "../../../components/Loading.jsx";

export default function OverviewPage() {
  const [events, setEvents] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  const searchParams = useSearchParams();

  // Initialize state: Check URL for date, otherwise use today
  const [initialDate, setInitialDate] = useState(new Date());

  useEffect(() => {
    const dateParam = searchParams.get("date");
    if (dateParam) {
      const parsedDate = new Date(dateParam);
      if (!isNaN(parsedDate)) {
        setInitialDate(parsedDate);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    if (events?.length > 0 && eventTypes?.length > 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all([
      fetch(
        "https://psiaskola.sk/wp-json/events/v1/all-types-events-admin",
      ).then((res) => res.json()),
      fetch(
        "https://psiaskola.sk/wp-json/events/v1/all-calendar-events-with-clients",
      ).then((res) => res.json()),
    ])
      .then(([types, eventsData]) => {
        setEventTypes(types);
        setEvents(eventsData);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const setNewInitialDate = (newDate) => {
    if (newDate.getTime() !== initialDate.getTime()) {
      setInitialDate(newDate);
    }
  };

  if (loading) return <Loading />;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <MonthCalendar
          activityDaysProps={events}
          setNewInitialDate={setNewInitialDate}
        />
      </div>
      <HandleEventCalendar
        events={events}
        eventTypes={eventTypes}
        initialDate={initialDate}
      />
    </div>
  );
}
