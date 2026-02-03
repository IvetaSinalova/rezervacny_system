"use client";

import { useState, useEffect, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import skLocale from "@fullcalendar/core/locales/sk";
import "../../styles/EventCalendar.css";
import ParticipantsList from "./ParticipantList";
import Loading from "../Loading";
import ReservationDetail from "./ReservationDetail";
import ClientPicker from "./ClientPicker";

export default function EventCalendar({
  events: initialEvents,
  eventTypes,
  initialDate,
}) {
  const calendarRef = useRef(null);
  const [currentView, setCurrentView] = useState("timeGridWeek");
  const [events, setEvents] = useState(initialEvents || []);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editType, setEditType] = useState("event");
  const [formData, setFormData] = useState({
    id: null,
    eventTypeId: "",
    start: "",
    end: "",
    maxCapacity: 10,
    recurrence: "none", // none/daily/weekly
    recurringDays: [],
    repeatCount: 1, // for daily
    repeatWeeks: 1,
    note: null,
    admin_note: null,
  });
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmMsg, setConfirmMsg] = useState("");
  const [reservationToDelete, setReservationToDelete] = useState(null);
  const [submitBtnClicked, setSubmitBtnClicked] = useState(false);

  //long term that needs to plan return of dog
  const [longTermId, setLongTermId] = useState(null);
  const [loadReturnDogs, setLoadReturnDogs] = useState(false);
  const [existsReturnDog, setExistsReturnDog] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      queueMicrotask(() => {
        calendarApi.gotoDate(initialDate);
      });
    }
  }, [initialDate]);

  useEffect(() => {
    const updateView = () => {
      setIsMobile(window.innerWidth < 768);
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

  const formatDateForInput = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const getEventIdToName = (name) => {
    const found = eventTypes.find((t) => t.name === name);
    return found ? found.id : null;
  };

  const openModal = (event = null, selection = null) => {
    if (event) {
      setSelectedEvent(event);
      setFormData({
        id: event.id, //Id of existing event in calendar
        eventTypeId:
          event.extendedProps.eventTypeId || getEventIdToName(event.title), //id of event type - kurz steniatko/kurz dospely pes/...
        start: formatDateForInput(event.start),
        end: formatDateForInput(event.end),
        note: event.extendedProps.note || null,
        maxCapacity: event.extendedProps.maxCapacity || 10,
        admin_note: event.extendedProps.admin_note,
      });
    } else if (selection) {
      setSelectedEvent(null);
      setFormData({
        id: null,
        eventTypeId: "",
        start: formatDateForInput(selection.start),
        end: formatDateForInput(selection.end),
        maxCapacity: 10,
        recurrence: "none",
        recurringDays: [],
        repeatCount: 1,
        repeatWeeks: 1,
      });
    }

    setModalVisible(true);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDeleteClik = (e, reservation) => {
    e.preventDefault();
    setReservationToDelete(reservation);
    setConfirmMsg(
      `Naozaj chcete zmazať užívateľa ${reservation.first_name} ${reservation.last_name} zo zvoleného kurzu?`,
    );
    setConfirmVisible(true);
  };

  const confirmDelete = async () => {
    setConfirmVisible(false);
    setSubmitBtnClicked(true);

    try {
      const reservation_id =
        reservationToDelete.reservation_type === "long_term"
          ? (reservationToDelete.long_term_reservation_id ??
            reservationToDelete.reservation_id)
          : reservationToDelete.event_reservation_id;
      const response = await fetch(
        "https://www.psiaskola.sk/wp-json/events/v1/delete-user-from-event",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: reservation_id,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Error:", data);
        alert(data.message || "Nepodarilo sa odstrániť účastníka z kurzu.");
        return;
      }

      alert(
        `${reservationToDelete.first_name} ${reservationToDelete.last_name} bol úspešne odstránený z kurzu.`,
      );
      window.location.reload();
      setModalVisible(false);
      setEditType("event");
      setReservationToDelete(null);
      return data;
    } catch (err) {
      setSubmitBtnClicked(false);
      alert("Chyba spojenia so serverom.");
    }
  };

  // --- open confirmation ---
  // const handleAnnulClick = (e, reservation) => {
  //   e.preventDefault();
  //   setReservationToAnnul(reservation);
  //   setConfirmMsg(
  //     `Naozaj chcete anulovať všetky absolvované kurzy zvoleného typu pre užívateľa ${reservation.first_name} ${reservation.last_name}?`
  //   );
  //   setConfirmVisible(true);
  // };

  const cancelConfirm = () => {
    setConfirmVisible(false);
    setReservationToDelete(null);
  };

  // const confirmAnnul = async () => {
  //   setConfirmVisible(false);
  //   try {
  //     const response = await (
  //       "https://www.psiaskola.sk/wp-json/events/v1/cancel-events-of-same-type-and-user",
  //       {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //         body: JSON.stringify({
  //           reservationId: reservationToAnnul.reservation_id,
  //         }),
  //       }
  //     );

  //     const data = await response.json();

  //     if (!response.ok) {
  //       console.error("Error:", data);
  //       alert(data.message || "Nepodarilo sa zrušiť kurz.");
  //       return;
  //     }

  //     alert("Klientove kurzy boli úspešne anulované.");
  //     setModalVisible(false);
  //     setEditType("event");
  //     setReservationToAnnul(null);
  //     return data;
  //   } catch (err) {
  //     alert("Chyba spojenia so serverom.");
  //   }
  // };

  const handleWeekdayChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => {
      const newDays = prev.recurringDays.includes(value)
        ? prev.recurringDays.filter((d) => d !== value)
        : [...prev.recurringDays, value];
      return { ...prev, recurringDays: newDays };
    });
  };

  const createReturnEvent = async () => {
    const response = await fetch(
      "https://psiaskola.sk/wp-json/events/v1/plan-dog-return",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reservation_id: longTermId,
          start_date: formData.start,
          end_date: formData.end,
          note: formData.note,
        }),
      },
    );

    const result = await response.json();

    if (result.success) {
      window.location.reload();
      setSubmitBtnClicked(false);
      setLongTermId(null);
    }
  };

  const handleSubmit = async (e) => {
    setEditType("event");
    setSubmitBtnClicked(true);
    e.preventDefault();
    if (longTermId !== null) {
      createReturnEvent();
      return;
    }
    if (!formData.eventTypeId) {
      alert("Select an event type!");
      return;
    }

    const endpoint = formData.id
      ? "https://www.psiaskola.sk//wp-json/events/v1/update-calendar-event"
      : "https://www.psiaskola.sk//wp-json/events/v1/add-calendar-event";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      setSubmitBtnClicked(false);
      if (data.success) {
        if (formData.id) {
          // Update existing
          setEvents((prev) =>
            prev.map((ev) =>
              ev.id === formData.id
                ? {
                    ...ev,
                    title: eventTypes.find((t) => t.id == formData.eventTypeId)
                      ?.name,
                    start: formData.start,
                    end: formData.end,
                    backgroundColor: formData.color,
                    extendedProps: {
                      eventTypeId: formData.eventTypeId,
                      maxCapacity: formData.maxCapacity,
                      admin_note: formData.admin_note,
                    },
                  }
                : ev,
            ),
          );
        } else {
          // Add new
          setEvents((prev) => [
            ...prev,
            {
              ...formData,
              id: data.event_id,
              title: eventTypes.find((t) => t.id == formData.eventTypeId)?.name,
              backgroundColor: formData.color,
            },
          ]);
        }
        window.location.reload();

        setModalVisible(false);
      } else {
        alert("Error: " + (data.message || "Unknown"));
      }
    } catch (err) {
      setSubmitBtnClicked(false);

      console.error(err);
    }
  };

  const handleDelete = async () => {
    setEditType("event");
    if (!selectedEvent) return;
    if (!confirm("Naozaj chcete odstrániť túto udalosť?")) return;
    setSubmitBtnClicked(true);
    try {
      const res = await fetch(
        "https://www.psiaskola.sk//wp-json/events/v1/delete-calendar-event",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: selectedEvent.id }), // <-- must be correct
        },
      );
      const data = await res.json();
      if (data.success) {
        setEvents((prev) => prev.filter((ev) => ev.id !== selectedEvent.id));
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const selectedType = eventTypes.find(
    (type) => type.id == formData.eventTypeId,
  );

  return (
    <div className="TrainingContainerAdmin">
      <FullCalendar
        ref={calendarRef}
        plugins={[timeGridPlugin, interactionPlugin]}
        initialView={currentView}
        selectable
        selectMirror
        const
        headerToolbar={
          isMobile
            ? {
                left: "today",
                center: "title",
                right: "prev,next",
              }
            : {
                left: "",
                center: "title",
                right: "",
              }
        }
        locale={skLocale}
        allDaySlot={false}
        slotMinTime="08:00:00"
        slotMaxTime="20:00:00"
        height="100%"
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
        titleFormat={{
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }}
        events={events}
        select={(selection) => openModal(null, selection)}
        eventClick={(info) => openModal(info.event)}
        eventContent={(info) => (
          <div style={{ position: "relative" }}>
            <b>{info.event.title}</b>
            <span style={{ fontSize: "0.8em", display: "block" }}>
              {new Date(info.event.start).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
              {" - "}
              {info.event.end
                ? new Date(info.event.end).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : ""}
            </span>
            {info.event.extendedProps.admin_note && (
              <div
                className="bg-white text-black text-sm font-normal m-0.5 p-0.5
                overflow-hidden whitespace-nowrap text-ellipsis"
              >
                {info.event.extendedProps.admin_note}
              </div>
            )}
          </div>
        )}
      />

      {modalVisible && (
        <div className="modal-overlay fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <div className="modal bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[100vh] overflow-y-auto p-6">
            <form onSubmit={handleSubmit} className="modal-form">
              <h3
                style={{
                  textAlign: "center",
                  fontWeight: "bold",
                  fontSize: "20px",
                  marginBottom: "10px",
                }}
              >
                {selectedEvent ? "Upraviť" : "Pridať novú udalosť"}
              </h3>

              {selectedEvent && (
                <div className="m-2 font-bold text-xl text-center">
                  {selectedEvent.extendedProps.name}
                </div>
              )}

              <div>
                {selectedEvent &&
                  (!selectedType ||
                    (selectedType && selectedType.admin == 0)) && (
                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        marginBottom: "15px",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setEditType("event")}
                        style={{
                          padding: "8px 14px",
                          borderRadius: "6px",
                          border: "none",
                          background:
                            editType === "event"
                              ? "var(--color-tertiary)"
                              : "#ddd",
                          color: editType === "event" ? "white" : "black",
                          cursor: "pointer",
                          fontWeight: "bold",
                        }}
                      >
                        Upraviť udalosť
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditType("participants")}
                        style={{
                          padding: "8px 14px",
                          borderRadius: "6px",
                          border: "none",
                          background:
                            editType === "participants"
                              ? "var(--color-tertiary)"
                              : "#ddd",
                          color:
                            editType === "participants" ? "white" : "black",
                          cursor: "pointer",
                          fontWeight: "bold",
                        }}
                      >
                        Spravovať účastníkov
                      </button>
                    </div>
                  )}

                {!selectedEvent && (
                  <div>
                    <label className="font-bold">
                      Názov udalosti:
                      <select
                        value={formData.eventTypeId}
                        onChange={(e) =>
                          handleChange("eventTypeId", e.target.value)
                        }
                        required
                        className="input-field font-normal"
                      >
                        <option value="" disabled hidden>
                          Vyber názov udalosti
                        </option>

                        {eventTypes?.map((type) => {
                          if (!["16", "18", "19", "20"].includes(type.id)) {
                            return (
                              <option key={type.id} value={type.id}>
                                {type.name}
                              </option>
                            );
                          }
                        })}
                      </select>
                    </label>
                  </div>
                )}

                {(selectedEvent && editType === "event") ||
                (!selectedEvent &&
                  ((selectedType &&
                    selectedType.admin === 1 &&
                    existsReturnDog) ||
                    selectedType?.admin === 0 ||
                    !selectedType)) ||
                selectedType.id == 25 ? (
                  <div className="">
                    <label className="font-bold">
                      Začiatok:
                      <input
                        type="datetime-local"
                        value={formData.start}
                        onChange={(e) => handleChange("start", e.target.value)}
                        required
                        className="input-field font-normal"
                      />
                    </label>

                    <label className="font-bold">
                      Koniec:
                      <input
                        type="datetime-local"
                        value={formData.end}
                        onChange={(e) => handleChange("end", e.target.value)}
                        className="input-field font-normal"
                      />
                    </label>

                    {selectedType && selectedType.admin == 0 && (
                      <div>
                        <label className="font-bold">
                          Kapacita:
                          <input
                            type="number"
                            value={formData.maxCapacity}
                            onChange={(e) =>
                              handleChange("maxCapacity", e.target.value)
                            }
                            min={1}
                            required
                            className="input-field font-normal"
                          />
                        </label>
                      </div>
                    )}

                    {selectedType &&
                      selectedType.admin === 1 &&
                      selectedType.id != 25 &&
                      selectedEvent && (
                        <ReservationDetail
                          onPaymentChange={(attr, value, reservation_id) => {
                            setEvents((prevEvents) =>
                              prevEvents.map((event) => {
                                // Only update the event that matches selectedEvent.id
                                if (event.id !== selectedEvent.id) return event;

                                return {
                                  ...event,
                                  reservations: event.reservations?.map(
                                    (res) => {
                                      const isTarget =
                                        (res.long_term_reservation_id &&
                                          res.long_term_reservation_id ===
                                            reservation_id) ||
                                        (res.event_reservation_id &&
                                          res.event_reservation_id ===
                                            reservation_id);

                                      return isTarget
                                        ? { ...res, [attr]: value }
                                        : res;
                                    },
                                  ),
                                };
                              }),
                            );
                          }}
                          reservationProps={
                            selectedEvent?.extendedProps?.reservations?.[0] ||
                            {}
                          }
                        />
                      )}
                  </div>
                ) : (
                  selectedType &&
                  ((selectedType.admin === 1 && existsReturnDog) ||
                    selectedType?.admin === 0 ||
                    !selectedType) && (
                    <ParticipantsList
                      reservations={
                        selectedEvent?.extendedProps?.reservations &&
                        (selectedEvent?.extendedProps?.reservations[0]
                          .long_term_reservation_id ||
                          selectedEvent?.extendedProps?.reservations[0]
                            .event_reservation_id)
                          ? selectedEvent?.extendedProps?.reservations
                          : []
                      }
                      onDelete={handleDeleteClik}
                    />
                  )
                )}

                {confirmVisible && (
                  <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[9999]">
                    <div className="bg-white p-6 rounded-xl max-w-md w-full shadow-lg">
                      <p className="mb-4 text-lg">{confirmMsg}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={confirmDelete}
                          className="flex-1 bg-red-600 text-white py-2 rounded-xl font-semibold"
                        >
                          Áno
                        </button>
                        <button
                          onClick={cancelConfirm}
                          className="flex-1 bg-gray-400 text-white py-2 rounded-xl font-semibold"
                        >
                          Nie
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {(!selectedEvent && !selectedType) ||
                  (selectedType &&
                    selectedType.admin === 0 &&
                    editType === "event" && (
                      <div>
                        <label className="font-bold">
                          Opakovať:
                          <select
                            value={formData.recurrence}
                            onChange={(e) =>
                              handleChange("recurrence", e.target.value)
                            }
                            className="input-field font-normal"
                          >
                            <option value="none">Nikdy</option>
                            <option value="daily">Denne</option>
                            <option value="weekly">Týždenne</option>
                          </select>
                        </label>

                        {formData.recurrence === "daily" && (
                          <label>
                            Počet dní za sebou:
                            <input
                              type="number"
                              value={formData.repeatCount || 1}
                              min={1}
                              onChange={(e) =>
                                handleChange("repeatCount", e.target.value)
                              }
                              className="input-field"
                            />
                          </label>
                        )}

                        {formData.recurrence === "weekly" && (
                          <div className="week-repeat">
                            <div className="weekdays">
                              {[
                                "mon",
                                "tue",
                                "wed",
                                "thu",
                                "fri",
                                "sat",
                                "sun",
                              ].map((day) => (
                                <label key={day}>
                                  <input
                                    type="checkbox"
                                    value={day}
                                    checked={formData.recurringDays.includes(
                                      day,
                                    )}
                                    onChange={handleWeekdayChange}
                                  />
                                  {day.charAt(0).toUpperCase() + day.slice(1)}
                                </label>
                              ))}
                            </div>

                            <label>
                              Koľko týždňov za sebou:
                              <input
                                type="number"
                                min={1}
                                value={formData.repeatWeeks || 1}
                                onChange={(e) =>
                                  handleChange("repeatWeeks", e.target.value)
                                }
                                className="input-field"
                              />
                            </label>
                          </div>
                        )}
                      </div>
                    ))}
              </div>
              {selectedType &&
                selectedType.admin === 1 &&
                selectedType.id == 14 &&
                !selectedEvent && (
                  <div>
                    {loadReturnDogs && <Loading />}

                    {/* Remove the ternary and use a style/class to hide the picker if needed, 
        but it MUST stay in the tree */}
                    <div className={loadReturnDogs ? "hidden" : "block"}>
                      <ClientPicker
                        longTermId={longTermId}
                        updateLongTermId={(id) => setLongTermId(id)}
                        updateLoadingReturnDog={(state) =>
                          setLoadReturnDogs(state)
                        }
                        updateExistsReturnDog={(state) =>
                          setExistsReturnDog(state)
                        }
                      />
                    </div>
                  </div>
                )}

              {!selectedEvent ||
                (selectedEvent && editType === "event" && (
                  <div className="bg-gray-50 p-4 rounded-xl shadow-inner space-y-2 mt-6">
                    <label className="font-semibold text-md ">
                      Poznámka pre admina:
                      <textarea
                        value={formData.admin_note || ""}
                        onChange={(e) =>
                          handleChange("admin_note", e.target.value)
                        }
                        className="input-field min-h-[100px] font-normal" // adjust 100px as needed
                      />
                    </label>
                  </div>
                ))}

              <div className="modal-buttons mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setModalVisible(false);
                    setEditType("event");
                  }}
                  className="btn-cancel"
                >
                  Zrušiť
                </button>

                {selectedEvent &&
                  (!selectedType ||
                    (selectedType && selectedType.admin == 0)) && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="btn-delete"
                    >
                      Zmazať
                    </button>
                  )}

                <button type="submit" className="btn-save">
                  Uložiť
                </button>
              </div>
            </form>

            {submitBtnClicked && (
              <div className="mt-3">
                <Loading />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
