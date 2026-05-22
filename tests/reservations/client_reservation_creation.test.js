/**
 * Covers client-role reservation creation:
 * - prevychova_psa long-term reservation
 * - vycvik long-term reservation
 * - hotel reservation
 * - 3day_camp event reservation
 * - validation error when required fields are missing
 *
 * Notes:
 * - The current WordPress creation endpoints are public, not authenticated-client
 *   endpoints. These tests exercise the client-facing creation surface.
 * - Set RUN_RESERVATION_INTEGRATION_TESTS=1 and TEST_WORDPRESS_URL to execute.
 */

const assert = require("node:assert/strict");
const { describe, test } = require("node:test");
const {
  RUN_INTEGRATION,
  SKIP_INTEGRATION_REASON,
  assertCreatedResponse,
  eventReservationPayload,
  hotelReservationPayload,
  longTermReservationPayload,
  wpFetch,
} = require("./integration-test-utils.js");

describe("Reservation Creation - Client Role", { skip: !RUN_INTEGRATION && SKIP_INTEGRATION_REASON }, () => {
  test("reservation_create_client_prevychova_psa_success", async () => {
    const payload = longTermReservationPayload({ type: "prevychova_psa" });
    const { response, json } = await wpFetch(
      "/longterm/v1/create-long-term-reservation",
      { method: "POST", body: payload },
    );

    assertCreatedResponse(response, json);
    assert.ok(json.reservation_id);
    assert.ok(json.dog_id);
    assert.ok(json.owner_id);
  });

  test("reservation_create_client_vycvik_success", async () => {
    const payload = longTermReservationPayload({
      type: "vycvik",
      startDaysFromNow: 60,
    });
    const { response, json } = await wpFetch(
      "/longterm/v1/create-long-term-reservation",
      { method: "POST", body: payload },
    );

    assertCreatedResponse(response, json);
    assert.ok(json.reservation_id);
    assert.ok(json.dog_id);
    assert.ok(json.owner_id);
  });

  test("reservation_create_client_hotel_success", async () => {
    const payload = hotelReservationPayload();
    const { response, json } = await wpFetch(
      "/longterm/v1/create-hotel-reservation",
      { method: "POST", body: payload },
    );

    assertCreatedResponse(response, json);
    assert.ok(json.reservation_id);
    assert.ok(json.dog_id);
    assert.ok(json.owner_id);
  });

  test(
    "reservation_create_client_3day_camp_success",
    { skip: !process.env.TEST_3DAY_CAMP_EVENT_ID && "Set TEST_3DAY_CAMP_EVENT_ID." },
    async () => {
      const payload = eventReservationPayload();
      const { response, json } = await wpFetch("/events/v1/add-event-reservation", {
        method: "POST",
        body: payload,
      });

      assert.ok(
        [200, 201].includes(response.status),
        `Expected 200/201, got ${response.status}: ${JSON.stringify(json)}`,
      );
      assert.equal(json?.success, true);
      assert.ok(json?.client_id);
      assert.ok(json?.dog_id);
    },
  );

  test("reservation_create_client_missing_required_fields_validation_error", async () => {
    const payload = longTermReservationPayload({ type: "prevychova_psa" });
    delete payload.client;

    const { response, json } = await wpFetch(
      "/longterm/v1/create-long-term-reservation",
      { method: "POST", body: payload },
    );

    assert.equal(response.status, 400);
    assert.match(JSON.stringify(json), /missing/i);
  });
});
