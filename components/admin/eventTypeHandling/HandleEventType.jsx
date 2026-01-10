"use client";

import React, { useState, useContext } from "react";
import AddEventForm from "./AddEventTypeForm";
import EditEventTypeForm from "./EditEventTypeForm";
import Loading from "../../Loading";
import { AdminDataContext } from "../../../context/AdminDataContext";
export default function HandleEventType() {
  const context = useContext(AdminDataContext);
  if (!context) {
    throw new Error("HandleEventType must be used inside AdminDataProvider");
  }
  const { eventTypes, loading: initialLoading } = useContext(AdminDataContext);

  // Local loading for form actions
  const [loading, setLoading] = useState(false);
  const [addedEvent, setAddedEvent] = useState(false);

  const handleLoading = (state) => {
    setLoading(state);
  };

  const handleAddedEvent = (state) => {
    setAddedEvent(state);
  };

  if (initialLoading) return <Loading />; // global loading from fetching data

  return (
    <div style={{ position: "relative" }}>
      <EditEventTypeForm
        updateLoading={handleLoading}
        loading={loading}
        addedEvent={addedEvent}
        eventTypes={eventTypes} // now comes from context
      />
      <AddEventForm
        updateLoading={handleLoading}
        loading={loading}
        updateAddedEvent={handleAddedEvent}
      />

      {/* Optional overlay loading for form actions */}
      {loading && <Loading />}
    </div>
  );
}
