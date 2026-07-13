// pages/admin/page.jsx
"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation"; // Add this
import MonthCalendar from "../../../components/admin/MonthCalendar.jsx";
import HandleEventCalendar from "../../../components/admin/HandleEventCalendar.jsx";
import Loading from "../../../components/Loading.jsx";

export default function OverviewPage() {
  const [events, setEvents] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const searchParams = useSearchParams();

  // Initialize from the URL without an extra render caused by an effect.
  const [initialDate, setInitialDate] = useState(() => {
    const dateParam = searchParams.get("date");
    if (dateParam) {
      const parsedDate = new Date(dateParam);
      if (!isNaN(parsedDate)) {
        return parsedDate;
      }
    }
    return new Date();
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/wp/events/v1/all-types-events-admin").then((res) => {
        if (!res.ok) throw new Error("Nepodarilo sa načítať typy udalostí.");
        return res.json();
      }),
      fetch("/api/wp/events/v1/all-calendar-events-with-clients").then(
        (res) => {
          if (!res.ok) throw new Error("Nepodarilo sa načítať udalosti.");
          return res.json();
        },
      ),
    ])
      .then(([types, eventsData]) => {
        setEventTypes(types);
        setEvents(eventsData);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(
          err instanceof Error
            ? err.message
            : "Kalendár sa nepodarilo načítať.",
        );
        setLoading(false);
      });
  }, [reloadKey]);

  const setNewInitialDate = (newDate) => {
    if (newDate.getTime() !== initialDate.getTime()) {
      setInitialDate(newDate);
    }
  };

  if (loading) return <Loading />;

  if (error) {
    return (
      <div
        role="alert"
        className="mx-auto mt-12 max-w-xl rounded-xl border border-red-200 bg-red-50 p-6 text-center"
      >
        <h1 className="text-xl font-semibold text-red-900">
          Kalendár sa nepodarilo načítať
        </h1>
        <p className="mt-2 text-red-700">{error}</p>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            setError("");
            setReloadKey((value) => value + 1);
          }}
          className="mt-5 rounded-lg bg-[#59513f] px-5 py-2.5 font-semibold text-white transition hover:bg-[#453e30] focus:outline-none focus:ring-2 focus:ring-[#59513f] focus:ring-offset-2"
        >
          Skúsiť znova
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <MonthCalendar
          activityDaysProps={events}
          setNewInitialDate={setNewInitialDate}
          initialDate={initialDate}
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
