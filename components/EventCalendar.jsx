"use client";

import { useState, useEffect, useRef } from "react";
import skLocale from "@fullcalendar/core/locales/sk";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import "../styles/EventCalendar.css";
import EventForm from "./forms/EventForm";
import Loading from "./Loading";

export default function EventCalendar({
  events,
  eventTypes,
  initialDate,
  autofill = false,
}) {
  const calendarRef = useRef(null);
  const [currentView, setCurrentView] = useState("timeGridWeek");
  // const [events, setEvents] = useState(events);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedEventType, setSelectedEventType] = useState(null);
  //  const [eventTypes, setEventTypes] = useState(eventTypes);
  //const [loading, setLoading] = useState(true);

  // Load event types and calendar events
  /* useEffect(() => {
    setLoading(true);
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
              reservable: now <= cutoff || alwaysReservable,
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
*/

  useEffect(() => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      queueMicrotask(() => {
        calendarApi.gotoDate(initialDate);
      });
    }
  }, [initialDate]);

  // Update selectedEventType when selectedEvent changes
  useEffect(() => {
    if (!selectedEvent) {
      setSelectedEventType(null);
      return;
    }

    const type = eventTypes.find(
      (et) =>
        et.name === selectedEvent.extendedProps?.name ||
        et.name === selectedEvent.name,
    );

    setSelectedEventType(type || null);
  }, [selectedEvent, eventTypes]);

  // Adjust calendar view on window resize
  useEffect(() => {
    const updateView = () => {
      if (window.innerWidth < 768) {
        setCurrentView("timeGridDay");
        calendarRef.current?.getApi().changeView("timeGridDay");
      } else {
        setCurrentView("timeGridWeek");
        calendarRef.current?.getApi().changeView("timeGridWeek");
      }
    };

    updateView();
    window.addEventListener("resize", updateView);
    return () => window.removeEventListener("resize", updateView);
  }, []);

  return (
    <div className="relative w-full h-full">
      {/* Modal overlay for selected event */}
      {selectedEvent && <div className="fixed inset-0 bg-black/60 z-20"></div>}

      {selectedEvent && (
        <div className="fixed inset-0 z-30 flex items-start justify-center px-4">
          <div className="relative bg-white p-6 shadow-xl w-full max-w-3xl h-[calc(100vh)] overflow-y-auto">
            {/* Close button */}
            <button
              onClick={() => setSelectedEvent(null)}
              className="absolute top-3 right-3 w-10 h-10 flex items-center justify-center rounded-full border border-[var(--color-secondary)] text-[var(--color-secondary)] text-2xl hover:bg-[var(--color-secondary)] hover:text-white transition-all"
            >
              ×
            </button>
            {/* Event Info Header */}
            <div className="mb-6 border-b border-[var(--color-secondary)] pb-3 text-center">
              <h2 className="text-xl font-bold mb-1">{selectedEvent.title}</h2>
              <p className="text-md font-semibold">
                {selectedEvent.start.toLocaleString()} -{" "}
                {selectedEvent.end?.toLocaleString()}
              </p>
              {/*selectedEventType && (
                <>
                  <p className="text-md font-semibold">
                    Cena: {selectedEventType.price}€
                  </p>
                  <p className="text-md font-semibold">
                    Počet lekcií: {selectedEventType.maxLessons}
                  </p>
                </>
              )*/}
            </div>
            {/* Event Form */}
            {selectedEventType && (
              <EventForm
                calendarEventId={selectedEvent.id}
                price={parseFloat(selectedEventType.price)}
                maxLessons={parseFloat(selectedEventType.maxLessons)}
                autofill={autofill}
                onClose={() => setSelectedEvent(null)}
              />
            )}
          </div>
        </div>
      )}
      <div className="font-bold text-center text-3xl mt-8 mb-2 text-[var(--color-primary)]">
        Kalendár kurzov
      </div>
      {/* Calendar */}
      <div
        className={`${
          selectedEvent ? "pointer-events-none blur-sm" : ""
        } m-4 p-2`}
      >
        <FullCalendar
          ref={calendarRef}
          plugins={[timeGridPlugin, interactionPlugin]}
          initialView={currentView}
          initialDate={initialDate}
          headerToolbar={{ left: "today", center: "title", right: "prev,next" }}
          locale={skLocale}
          allDaySlot={false}
          slotMinTime="08:00:00"
          slotMaxTime="20:00:00"
          eventTimeFormat={{
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }}
          dayHeaderFormat={{
            day: "2-digit",
            month: "2-digit",
            weekday: "short",
          }}
          titleFormat={{ year: "numeric", month: "2-digit", day: "2-digit" }}
          height="100%"
          contentHeight="auto"
          events={events}
          eventClick={(info) => {
            const { reservable, currentCapacity, maxCapacity } =
              info.event.extendedProps;

            // Block if either the event is too close or it's full
            if (
              !reservable ||
              parseInt(currentCapacity) >= parseInt(maxCapacity)
            ) {
              return;
            }

            setSelectedEvent(info.event);
          }}
          eventDidMount={(info) => {
            const { reservable, currentCapacity, maxCapacity } =
              info.event.extendedProps;
            const isBlocked =
              !reservable || parseInt(currentCapacity) >= parseInt(maxCapacity);

            if (isBlocked) {
              // Visual indication
              info.el.style.backgroundColor = "#ccc";
              info.el.style.cursor = "not-allowed";

              // Tooltip message
              const messages = [];
              if (!reservable)
                messages.push(
                  "Rezervácie sú možné len minimálne 48 hodín pred začiatkom kurzu.",
                );
              if (parseInt(currentCapacity) >= parseInt(maxCapacity))
                messages.push("Kapacita kurzu je naplnená.");
              info.el.setAttribute("title", messages.join(" "));
            }
          }}
          eventContent={(arg) => {
            const { event } = arg;
            const reservable = event.extendedProps.reservable;

            return (
              <div
                style={{ position: "relative", width: "100%", height: "100%" }}
              >
                {/* Event title */}
                <div>{event.title}</div>

                {/* Overlay for non-reservable events */}
                {!reservable && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: "rgba(0,0,0,0.4)",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                      fontSize: "16px",
                      pointerEvents: "none", // allow hover tooltip but block clicks
                      borderRadius: "3px",
                    }}
                  >
                    Rezervácia, už nie je možná.
                  </div>
                )}
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}
