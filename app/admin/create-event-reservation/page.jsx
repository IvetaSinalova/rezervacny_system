"use client";
import { useState, useEffect } from "react";
import EventCalendar from "../../../components/EventCalendar.jsx";
import MonthCalendar from "../../../components/admin/MonthCalendar.jsx";
import Loading from "@/components/Loading.jsx";

export default function Home() {
  const [initialDate, setInitialDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);

  const setNewInitialDate = (newInitialDate) => {
    if (newInitialDate.getTime() !== initialDate.getTime()) {
      setInitialDate(newInitialDate);
    }
  };

  useEffect(() => {
    Promise.all([
      fetch("https://psiaskola.sk/wp-json/events/v1/all-types-events").then(
        (res) => res.json(),
      ),
      fetch("https://psiaskola.sk/wp-json/events/v1/all-calendar-events").then(
        (res) => res.json(),
      ),
    ])
      .then(([typesData, eventsData]) => {
        setEventTypes(typesData);
        // Compute reservable flag for each event (48 hours before start)
        const now = new Date();
        const updatedEvents = eventsData.map((ev) => {
          const eventStart = new Date(ev.start);
          const cutoff = new Date(eventStart.getTime() - 48 * 60 * 60 * 1000); // 48h before
          return {
            ...ev,
            extendedProps: {
              ...ev.extendedProps,
              reservable: true,
            },
          };
        });

        setEvents(updatedEvents);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading)
    return (
      <div className="h-screen">
        <Loading />
      </div>
    );

  return (
    <div>
      <div
        className="p-6"
        style={{ display: "flex", justifyContent: "center" }}
      >
        <MonthCalendar
          activityDaysProps={events}
          setNewInitialDate={setNewInitialDate}
        />
      </div>
      <EventCalendar
        eventTypes={eventTypes}
        events={events}
        initialDate={initialDate}
      />
    </div>
  );
}
