const assert = require("node:assert/strict");

const RUN_INTEGRATION =
  process.env.RUN_RESERVATION_INTEGRATION_TESTS === "1" &&
  Boolean(process.env.TEST_WORDPRESS_URL);

const SKIP_INTEGRATION_REASON =
  "Set RUN_RESERVATION_INTEGRATION_TESTS=1 and TEST_WORDPRESS_URL to run reservation integration tests.";

const baseUrl = (process.env.TEST_WORDPRESS_URL || "http://localhost").replace(
  /\/$/,
  "",
);

const adminOnlyFields = [
  "admin_note",
  "is_paid",
  "is_deposit_paid",
  "final_price",
  "event_total_price",
  "sf_id",
  "variable_code",
  "cancel_token",
  "id_long_term_event",
  "id_accommodation",
];

const adminEndpoints = [
  { method: "GET", path: "/events/v1/all-calendar-events-with-clients" },
  { method: "GET", path: "/events/v1/all-types-events-admin" },
  { method: "POST", path: "/events/v1/update-payment", body: {} },
  { method: "GET", path: "/events/v1/long-term-events" },
  { method: "POST", path: "/events/v1/update-long-term-events", body: {} },
  { method: "POST", path: "/events/v1/create-long-term-event", body: {} },
  { method: "POST", path: "/events/v1/delete-long-term-event", body: {} },
  { method: "GET", path: "/events/v1/long-term-reservations-overview" },
  { method: "GET", path: "/events/v1/short-term-reservations-overview" },
  { method: "POST", path: "/events/v1/delete-reservation", body: {} },
  { method: "GET", path: "/events/v1/get-user-to-plan-dog-return" },
  { method: "POST", path: "/events/v1/plan-dog-return", body: {} },
  { method: "POST", path: "/events/v1/get-client-info", body: {} },
  { method: "GET", path: "/reservations/v1/stats" },
  { method: "POST", path: "/events/v1/update-client", body: {} },
  { method: "POST", path: "/events/v1/update-dog", body: {} },
  { method: "DELETE", path: "/psia-skola/v1/discounts/delete", body: {} },
  { method: "GET", path: "/psia-skola/v1/discounts" },
  { method: "POST", path: "/psia-skola/v1/discounts", body: {} },
  { method: "GET", path: "/moje-auto/v1/canceled-reservations" },
  { method: "POST", path: "/events/v1/set-max-capacity", body: {} },
  { method: "GET", path: "/events/v1/get-max-capacity" },
];

function futureDate(daysFromNow, hour = 9, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(hour, minute, 0, 0);
  return date;
}

function mysqlDateTime(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )} ${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
}

function isoDateTimeWithoutSeconds(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function clientFixture(suffix = Date.now()) {
  return {
    firstName: "Integration",
    lastName: `Client ${suffix}`,
    email: process.env.TEST_CLIENT_EMAIL || "iveta.sinalova78@gmail.com",
    phone: "+421 911 078 008",
    street: "Testovacia 1",
    zip: "02601",
    city: "Dolny Kubin",
    country: "Slovensko",
  };
}

function dogFixture(suffix = Date.now()) {
  return {
    name: `Test Pes ${suffix}`,
    breed: "Border kolia",
    dateOfBirth: "2022-01-01",
    gender: "male",
  };
}

function longTermReservationPayload({
  type,
  suffix = Date.now(),
  startDaysFromNow = 45,
} = {}) {
  const start = futureDate(startDaysFromNow, 9, 0);
  const end = futureDate(startDaysFromNow + 2, 9, 0);
  const serviceName =
    type === "prevychova_psa"
      ? process.env.TEST_SERVICE_PREVYCHOVA || "Prevýchova psa"
      : process.env.TEST_SERVICE_VYCVIK || "Výcvik s ubytovaním";

  return {
    client: clientFixture(suffix),
    dog: dogFixture(suffix),
    serviceName,
    startDate: mysqlDateTime(start),
    endDate: mysqlDateTime(end),
    selectedTime: "09:00",
    accommodation: process.env.TEST_ACCOMMODATION_NAME || "Koterec",
    note: `integration-${suffix}`,
    problems: "Integration test problem",
    trainingRequirements: "Integration test requirements",
    code: "",
    needsInvoice: false,
  };
}

function hotelReservationPayload({ suffix = Date.now() } = {}) {
  return {
    client: clientFixture(suffix),
    dog: dogFixture(suffix),
    serviceName: process.env.TEST_SERVICE_HOTEL || "Hotel",
    startDate: mysqlDateTime(futureDate(55, 10, 0)),
    endDate: mysqlDateTime(futureDate(57, 10, 0)),
    accommodation: process.env.TEST_ACCOMMODATION_NAME || "Koterec",
    note: `integration-${suffix}`,
    trainingWalks: "0",
    code: "",
    needsInvoice: false,
  };
}

function eventReservationPayload({ suffix = Date.now(), eventId } = {}) {
  return {
    client: clientFixture(suffix),
    dog: dogFixture(suffix),
    eventId: Number(eventId || process.env.TEST_3DAY_CAMP_EVENT_ID),
    note: `integration-${suffix}`,
    trainingRequirements: "Integration test requirements",
    code: "",
    needsInvoice: false,
  };
}

async function wpFetch(path, { method = "GET", body, admin = false } = {}) {
  const headers = {
    Accept: "application/json",
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (admin) {
    assert.ok(
      process.env.WP_API_SECRET,
      "WP_API_SECRET is required for admin integration tests.",
    );
    headers["X-Psia-Admin-Secret"] = process.env.WP_API_SECRET;
  }

  const response = await fetch(`${baseUrl}/wp-json${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }

  return { response, json };
}

function assertCreatedResponse(response, json) {
  assert.ok(
    [200, 201].includes(response.status),
    `Expected creation status 200/201, got ${response.status}: ${JSON.stringify(
      json,
    )}`,
  );
  assert.equal(json?.success, true);
  assert.ok(json?.reservation_id || json?.client_id, "Missing reservation id data");
}

function assertForbidden(response, json) {
  assert.ok(
    [401, 403].includes(response.status),
    `Expected 401/403, got ${response.status}: ${JSON.stringify(json)}`,
  );
  assert.doesNotMatch(JSON.stringify(json), /admin_note|final_price|cancel_token/i);
}

module.exports = {
  RUN_INTEGRATION,
  SKIP_INTEGRATION_REASON,
  adminEndpoints,
  adminOnlyFields,
  assertCreatedResponse,
  assertForbidden,
  clientFixture,
  dogFixture,
  eventReservationPayload,
  futureDate,
  hotelReservationPayload,
  isoDateTimeWithoutSeconds,
  longTermReservationPayload,
  mysqlDateTime,
  wpFetch,
};
