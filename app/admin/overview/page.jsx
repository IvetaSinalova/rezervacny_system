// pages/admin/page.jsx
"use client";
import { useState, useEffect, useContext } from "react";
import { useSearchParams } from "next/navigation"; // Add this
import AdminLayout from "../layout.jsx";
import MonthCalendar from "../../../components/admin/MonthCalendar.jsx";
import HandleEventCalendar from "../../../components/admin/HandleEventCalendar.jsx";
import { AdminDataContext } from "../../../context/AdminDataContext.jsx";
import Loading from "../../../components/Loading.jsx";

export default function OverviewPage() {
  const { events, eventTypes, loading } = useContext(AdminDataContext);
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
