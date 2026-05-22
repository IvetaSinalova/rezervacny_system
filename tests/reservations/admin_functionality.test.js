/**
 * Covers admin privileged operations:
 * - admin-only endpoint access succeeds for admin and is blocked for client
 * - switch prevychova_psa <-> vycvik with recalculated price
 * - manual price override
 * - payment status update
 * - accommodation type update
 * - delete reservation
 *
 * The tests use the WordPress admin-secret permission path. Set
 * RUN_RESERVATION_INTEGRATION_TESTS=1, TEST_WORDPRESS_URL, and WP_API_SECRET.
 */

const assert = require("node:assert/strict");
const { describe, test } = require("node:test");
const {
  RUN_INTEGRATION,
  SKIP_INTEGRATION_REASON,
  adminEndpoints,
  assertCreatedResponse,
  assertForbidden,
  longTermReservationPayload,
  wpFetch,
} = require("./integration-test-utils.js");

async function createLongTermFixture() {
  const payload = longTermReservationPayload({
    type: "prevychova_psa",
    startDaysFromNow: 90,
  });
  const { response, json } = await wpFetch(
    "/longterm/v1/create-long-term-reservation",
    { method: "POST", body: payload },
  );
  assertCreatedResponse(response, json);
  return json.reservation_id;
}

describe("Admin Functionality - Full Coverage", { skip: !RUN_INTEGRATION && SKIP_INTEGRATION_REASON }, () => {
  test("admin_endpoints_admin_success_and_client_forbidden", async () => {
    for (const endpoint of adminEndpoints) {
      const clientResult = await wpFetch(endpoint.path, {
        method: endpoint.method,
        body: endpoint.body,
      });
      assertForbidden(clientResult.response, clientResult.json);

      const adminResult = await wpFetch(endpoint.path, {
        method: endpoint.method,
        body: endpoint.body,
        admin: true,
      });
      assert.notEqual(
        adminResult.response.status,
        401,
        `${endpoint.method} ${endpoint.path} unexpectedly rejected admin`,
      );
      assert.notEqual(
        adminResult.response.status,
        403,
        `${endpoint.method} ${endpoint.path} unexpectedly rejected admin`,
      );
    }
  });

  test("reservation_switch_service_type_admin_success_client_forbidden", async () => {
    const reservationId = await createLongTermFixture();

    const clientResult = await wpFetch(
      `/events/v1/reservations/${reservationId}/switch-service-type`,
      {
        method: "PATCH",
        body: { newServiceType: "vycvik" },
      },
    );
    assertForbidden(clientResult.response, clientResult.json);

    const adminResult = await wpFetch(
      `/events/v1/reservations/${reservationId}/switch-service-type`,
      {
        method: "PATCH",
        body: { newServiceType: "vycvik" },
        admin: true,
      },
    );

    assert.equal(adminResult.response.status, 200);
    assert.equal(adminResult.json.success, true);
    assert.equal(adminResult.json.reservation.reservation_type, "long_term");
    assert.equal(adminResult.json.reservation.long_term_event_type_id, "2");
    assert.ok(Number(adminResult.json.reservation.event_total_price) >= 0);
  });

  test("reservation_override_price_admin_success_client_forbidden", async () => {
    const reservationId = await createLongTermFixture();

    const clientResult = await wpFetch(`/events/v1/reservations/${reservationId}/price`, {
      method: "PATCH",
      body: { reservation_type: "long_term", price: 123.45 },
    });
    assertForbidden(clientResult.response, clientResult.json);

    const adminResult = await wpFetch(`/events/v1/reservations/${reservationId}/price`, {
      method: "PATCH",
      body: { reservation_type: "long_term", price: 123.45 },
      admin: true,
    });

    assert.equal(adminResult.response.status, 200);
    assert.equal(adminResult.json.success, true);
    assert.equal(adminResult.json.reservation.final_price, 123.45);
  });

  test(
    "reservation_change_accommodation_admin_success_client_forbidden",
    { skip: !process.env.TEST_ALTERNATE_ACCOMMODATION_ID && "Set TEST_ALTERNATE_ACCOMMODATION_ID." },
    async () => {
      const reservationId = await createLongTermFixture();
      const accommodationId = Number(process.env.TEST_ALTERNATE_ACCOMMODATION_ID);

      const clientResult = await wpFetch(
        `/events/v1/reservations/${reservationId}/accommodation`,
        {
          method: "PATCH",
          body: { accommodationId },
        },
      );
      assertForbidden(clientResult.response, clientResult.json);

      const adminResult = await wpFetch(
        `/events/v1/reservations/${reservationId}/accommodation`,
        {
          method: "PATCH",
          body: { accommodationId },
          admin: true,
        },
      );

      assert.equal(adminResult.response.status, 200);
      assert.equal(adminResult.json.success, true);
      assert.equal(adminResult.json.reservation.accommodation_id, accommodationId);
      assert.ok(Number(adminResult.json.reservation.event_total_price) >= 0);
    },
  );

  test("reservation_change_status_admin_success_client_forbidden", async () => {
    const reservationId = await createLongTermFixture();

    const clientResult = await wpFetch("/events/v1/update-payment", {
      method: "POST",
      body: {
        reservation_id: reservationId,
        reservation_type: "long_term",
        field: "is_paid",
        value: "1",
      },
    });
    assertForbidden(clientResult.response, clientResult.json);

    const adminResult = await wpFetch("/events/v1/update-payment", {
      method: "POST",
      body: {
        reservation_id: reservationId,
        reservation_type: "long_term",
        field: "is_paid",
        value: "1",
      },
      admin: true,
    });

    assert.equal(adminResult.response.status, 200);
    assert.equal(adminResult.json.success, true);
  });

  test("reservation_delete_admin_success_client_forbidden", async () => {
    const reservationId = await createLongTermFixture();

    const clientResult = await wpFetch("/events/v1/delete-reservation", {
      method: "POST",
      body: {
        reservation_id: reservationId,
        reservation_type: "long_term",
      },
    });
    assertForbidden(clientResult.response, clientResult.json);

    const adminResult = await wpFetch("/events/v1/delete-reservation", {
      method: "POST",
      body: {
        reservation_id: reservationId,
        reservation_type: "long_term",
      },
      admin: true,
    });

    assert.equal(adminResult.response.status, 200);
    assert.equal(adminResult.json.success, true);
  });
});
