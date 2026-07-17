const reservationIds = (reservation) =>
  [
    reservation?.long_term_reservation_id,
    reservation?.event_reservation_id,
    reservation?.reservation_id,
  ]
    .filter((id) => id !== null && id !== undefined)
    .map(String);

export function updateCalendarReservation(
  events,
  selectedEventId,
  updates,
  reservationId = null,
) {
  const updateIds = reservationIds({
    ...updates,
    reservation_id: reservationId ?? updates.reservation_id,
  });

  return events.map((event) => {
    if (String(event.id) !== String(selectedEventId)) return event;

    const reservations = Array.isArray(event.reservations)
      ? event.reservations
      : Array.isArray(event.extendedProps?.reservations)
        ? event.extendedProps.reservations
        : [];
    const updatedReservations = reservations.map((reservation, index) => {
      const isTarget = updateIds.length
        ? updateIds.some((id) => reservationIds(reservation).includes(id))
        : index === 0;

      return isTarget ? { ...reservation, ...updates } : reservation;
    });

    return {
      ...event,
      reservations: updatedReservations,
      ...(event.extendedProps
        ? {
            extendedProps: {
              ...event.extendedProps,
              reservations: updatedReservations,
            },
          }
        : {}),
    };
  });
}

export function updateCalendarFormDate(
  previousFormData,
  field,
  value,
  isLongTermReservation,
) {
  if (
    field !== "start" ||
    !isLongTermReservation ||
    !previousFormData.end ||
    !value.includes("T")
  ) {
    return { ...previousFormData, [field]: value };
  }

  const [newStartDate] = value.split("T");
  const [, currentEndTime = "00:00"] = previousFormData.end.split("T");

  return {
    ...previousFormData,
    start: value,
    end: `${newStartDate}T${currentEndTime}`,
  };
}

export function updateCalendarEvent(events, eventId, formData, eventType) {
  return events.map((event) => {
    if (String(event.id) !== String(eventId)) return event;

    return {
      ...event,
      title: eventType?.name ?? event.title,
      start: formData.start,
      end: formData.end,
      eventTypeId: formData.eventTypeId,
      maxCapacity: formData.maxCapacity,
      note: formData.note ?? null,
      admin_note: formData.admin_note ?? null,
      color: eventType?.color ?? event.color,
    };
  });
}
