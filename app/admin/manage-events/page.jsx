// app/admin/manage-events/page.jsx
"use client";
import { useContext } from "react";
import { AdminDataContext } from "../../../context/AdminDataContext";
import Loading from "../../../components/Loading";
import HandleEventType from "../../../components/admin/eventTypeHandling/HandleEventType";

export default function ManageEventsPage() {
  const { eventTypes, loading } = useContext(AdminDataContext);

  if (loading) return <Loading />;

  return <HandleEventType eventTypes={eventTypes} />;
}
