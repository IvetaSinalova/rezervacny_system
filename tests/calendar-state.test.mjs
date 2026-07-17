import assert from "node:assert/strict";
import test from "node:test";

import {
  updateCalendarEvent,
  updateCalendarFormDate,
  updateCalendarReservation,
} from "../components/admin/calendarState.mjs";

test("saved reservation fields are available when the same calendar event is reopened", () => {
  const events = [
    {
      id: 14,
      reservations: [
        {
          event_reservation_id: 27,
          event_total_price: 100,
          final_price: 100,
          dog_name: "Luna",
        },
      ],
    },
  ];

  const updatedEvents = updateCalendarReservation(events, "14", {
    event_reservation_id: "27",
    event_total_price: 145.5,
    final_price: 145.5,
    dog_name: "Luna Nova",
  });
  const reopenedReservation = updatedEvents.find(
    (event) => String(event.id) === "14",
  ).reservations[0];

  assert.equal(reopenedReservation.event_total_price, 145.5);
  assert.equal(reopenedReservation.final_price, 145.5);
  assert.equal(reopenedReservation.dog_name, "Luna Nova");
});

test("reservation updates also replace FullCalendar extendedProps data", () => {
  const events = [
    {
      id: 9,
      extendedProps: {
        reservations: [
          { long_term_reservation_id: 81, event_total_price: 200 },
        ],
      },
    },
  ];

  const [updatedEvent] = updateCalendarReservation(
    events,
    "9",
    { long_term_reservation_id: "81", event_total_price: 260 },
  );

  assert.equal(updatedEvent.reservations[0].event_total_price, 260);
  assert.equal(
    updatedEvent.extendedProps.reservations[0].event_total_price,
    260,
  );
});

test("long-term start date copies day, month, and year to end date", () => {
  const updatedForm = updateCalendarFormDate(
    {
      start: "2026-07-29T10:00",
      end: "2026-07-29T12:00",
    },
    "start",
    "2027-11-03T10:00",
    true,
  );

  assert.equal(updatedForm.start, "2027-11-03T10:00");
  assert.equal(updatedForm.end, "2027-11-03T12:00");
});

test("changing a non-long-term start does not change its end date", () => {
  const updatedForm = updateCalendarFormDate(
    {
      start: "2026-07-29T10:00",
      end: "2026-07-29T12:00",
    },
    "start",
    "2027-11-03T10:00",
    false,
  );

  assert.equal(updatedForm.end, "2026-07-29T12:00");
});

test("saved event changes are immediately reflected in FullCalendar data", () => {
  const reservations = [{ long_term_reservation_id: 81 }];
  const events = [
    {
      id: 14,
      title: "Odovzdanie psa",
      start: "2026-07-29T10:00",
      end: "2026-07-29T12:00",
      admin_note: "Luna",
      reservations,
    },
  ];

  const [updatedEvent] = updateCalendarEvent(
    events,
    "14",
    {
      eventTypeId: "14",
      start: "2027-11-03T10:00",
      end: "2027-11-03T12:00",
      maxCapacity: 1,
      note: "new note",
      admin_note: "Luna - changed",
    },
    { id: 14, name: "Odovzdanie psa", color: "#e53278" },
  );

  assert.equal(updatedEvent.start, "2027-11-03T10:00");
  assert.equal(updatedEvent.end, "2027-11-03T12:00");
  assert.equal(updatedEvent.admin_note, "Luna - changed");
  assert.equal(updatedEvent.note, "new note");
  assert.equal(updatedEvent.color, "#e53278");
  assert.strictEqual(updatedEvent.reservations, reservations);
});
