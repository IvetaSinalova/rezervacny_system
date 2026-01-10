// context/AdminDataContext.jsx
"use client";
import { createContext, useState, useEffect } from "react";

export const AdminDataContext = createContext();

export function AdminDataProvider({ children }) {
  const [events, setEvents] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);
  const [accomodations, setAccomodations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (events.length > 0 && eventTypes.length > 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all([
      fetch(
        "https://psiaskola.sk/wp-json/events/v1/all-types-events-admin"
      ).then((res) => res.json()),
      fetch(
        "https://psiaskola.sk/wp-json/events/v1/all-calendar-events-with-clients"
      ).then((res) => res.json()),
      fetch("https://psiaskola.sk/wp-json/events/v1/all-accomodations").then(
        (res) => res.json()
      ),
    ])
      .then(([types, eventsData, accomodations]) => {
        console.log(eventsData);
        setEventTypes(types);
        setEvents(eventsData);
        setAccomodations(accomodations);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <AdminDataContext.Provider
      value={{ events, eventTypes, loading, accomodations }}
    >
      {children}
    </AdminDataContext.Provider>
  );
}
