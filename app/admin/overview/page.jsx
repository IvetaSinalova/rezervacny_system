// pages/admin/prehľad.jsx
"use client";
import AdminLayout from "../layout.jsx";
import MonthCalendar from "../../../components/admin/MonthCalendar";
import HandleEventCalendar from "../../../components/admin/HandleEventCalendar";
import { useState } from "react";
import { useContext } from "react";
import { AdminDataContext } from "../../../context/AdminDataContext";
import Loading from "../../../components/Loading";

export default function OverviewPage() {
  const { events, eventTypes, loading } = useContext(AdminDataContext);
  const [initialDate, setInitialDate] = useState(new Date());

  const setNewInitialDate = (newInitialDate) => {
    if (newInitialDate.getTime() !== initialDate.getTime()) {
      setInitialDate(newInitialDate);
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
