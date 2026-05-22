/**
 * Covers role-based access control for admin-only fields:
 * - public/client GET payloads must not expose admin-only fields
 * - client/non-admin writes to admin-only endpoints are rejected
 * - rejection payloads do not leak sensitive field names
 *
 * Admin-only fields are listed in integration-test-utils.js because this
 * project does not currently define a central serializer/schema.
 */

const assert = require("node:assert/strict");
const { describe, test } = require("node:test");
const {
  RUN_INTEGRATION,
  SKIP_INTEGRATION_REASON,
  adminOnlyFields,
  assertForbidden,
  wpFetch,
} = require("./integration-test-utils.js");

function assertNoAdminFields(value) {
  const serialized = JSON.stringify(value);
  for (const field of adminOnlyFields) {
    assert.doesNotMatch(serialized, new RegExp(`"${field}"\\s*:`, "i"));
  }
}

describe("Role-Based Access Control - Admin-Only Fields", { skip: !RUN_INTEGRATION && SKIP_INTEGRATION_REASON }, () => {
  test("reservation_read_client_admin_fields_hidden_from_public_calendar", async () => {
    const { response, json } = await wpFetch("/events/v1/all-calendar-events");

    assert.equal(response.status, 200);
    assertNoAdminFields(json);
  });

  test("reservation_read_client_admin_fields_hidden_from_public_types", async () => {
    const { response, json } = await wpFetch("/events/v1/all-types-events");

    assert.equal(response.status, 200);
    assertNoAdminFields(json);
  });

  test("reservation_write_client_admin_payment_field_forbidden", async () => {
    const { response, json } = await wpFetch("/events/v1/update-payment", {
      method: "POST",
      body: {
        reservation_id: 1,
        reservation_type: "long_term",
        field: "is_paid",
        value: "1",
      },
    });

    assertForbidden(response, json);
  });

  test("reservation_write_client_admin_price_field_forbidden", async () => {
    const { response, json } = await wpFetch("/events/v1/reservations/1/price", {
      method: "PATCH",
      body: {
        reservation_type: "long_term",
        price: 1,
      },
    });

    assertForbidden(response, json);
  });

  test("reservation_write_client_admin_note_field_forbidden", async () => {
    const { response, json } = await wpFetch("/events/v1/update-calendar-event", {
      method: "POST",
      body: {
        id: 1,
        admin_note: "client must not write this",
      },
    });

    assertForbidden(response, json);
  });
});
