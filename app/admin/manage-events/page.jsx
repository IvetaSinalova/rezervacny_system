// app/admin/manage-events/page.jsx
"use client";
import { useContext, useEffect, useState } from "react";
import { AdminDataContext } from "../../../context/AdminDataContext";
import Loading from "../../../components/Loading";
import HandleEventType from "../../../components/admin/eventTypeHandling/HandleEventType";

export default function ManageEventsPage() {
  const [eventTypes, setEventTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(
        "https://psiaskola.sk/wp-json/events/v1/all-calendar-events-with-clients",
      ).then((res) => res.json()),
    ])
      .then(([types]) => {
        setEventTypes(types);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <Loading />;

  return <HandleEventType eventTypes={eventTypes} />;
}
