"use client";
import React from "react";

export default function ParticipantsList({ reservations, onDelete, onAnnul }) {
  const isValid = (value) => {
    if (value === null || value === undefined || value === "") return false;
    if (value === "0000-00-00") return false;
    if (value === 0 || value === "0") return false;
    return true;
  };

  const userFields = [
    { key: "email", label: "Email" },
    { key: "phone_number", label: "Telefón" },
    { key: "street", label: "Ulica" },
    { key: "zip", label: "PSČ" },
    { key: "city", label: "Mesto" },
  ];

  const dogFields = [
    { key: "dog_name", label: "Meno psa" },
    { key: "breed", label: "Plemeno" },
    { key: "gender", label: "Pohlavie" },
    { key: "age", label: "Vek" },
    { key: "birth", label: "Dátum narodenia" },
    { key: "chip_number", label: "Čip" },
  ];
  return (
    <div className="w-full max-h-[500px] overflow-y-auto space-y-3 p-2">
      {reservations?.length > 0 ? (
        reservations.map((r) => {
          const fullName = `${r.first_name ?? ""} ${r.last_name ?? ""}`;

          return (
            <div
              key={
                r.long_term_reservation_id ??
                r.event_reservation_id ??
                r.reservation_id
              }
              className="bg-white shadow p-4 rounded-xl border-l-4 border-[var(--color-tertiary)]"
            >
              {/* HEADER */}
              <div className="space-y-1">
                <p className="text-lg font-semibold">{fullName}</p>

                {r.attempt_number && (
                  <p
                    className={`font-semibold ${
                      r.attempt_number > 1 ? "text-red-600" : ""
                    }`}
                  >
                    Kurz absolvuje {r.attempt_number}. krát
                  </p>
                )}

                <p className="font-semibold">
                  Toto je {parseInt(r.participation_count, 10) + 1}. lekcia v
                  kurze.
                </p>
              </div>

              {/* PAYMENT */}
              <div className="mt-3 text-sm space-y-1">
                <div>
                  <b>Zaplatené:</b> {r.is_paid === "1" ? "Áno" : "Nie"}
                </div>

                {r.is_deposit_paid !== null &&
                  r.is_deposit_paid !== undefined && (
                    <div>
                      <b>Záloha:</b>{" "}
                      {r.is_deposit_paid === "1" ? "Uhradená" : "Neuhradená"}
                    </div>
                  )}
              </div>

              {/* TWO COLUMNS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 mt-4">
                {/* OWNER */}
                <div>
                  <h3 className="font-semibold text-lg mb-2 border-b pb-2">
                    Majiteľ
                  </h3>
                  {userFields.map(
                    (f) =>
                      isValid(r[f.key]) && (
                        <p key={f.key}>
                          <b>{f.label}:</b> {r[f.key]}
                        </p>
                      )
                  )}
                </div>

                {/* DOG */}
                <div>
                  <h3 className="font-semibold text-lg mb-2 border-b pb-2">
                    Pes
                  </h3>
                  {dogFields.map(
                    (f) =>
                      isValid(r[f.key]) && (
                        <p key={f.key}>
                          <b>{f.label}:</b> {r[f.key]}
                        </p>
                      )
                  )}
                </div>
              </div>

              {/* LONG-TERM EXTRAS */}
              {r.reservation_type === "long_term" && (
                <div className="mt-4 text-sm space-y-1">
                  {isValid(r.training_walks) && (
                    <div>
                      <b>Tréningové vychádzky:</b> {r.training_walks}
                    </div>
                  )}
                  {isValid(r.problems) && (
                    <div>
                      <b>Problémy:</b> {r.problems}
                    </div>
                  )}
                </div>
              )}

              {/* SPECIAL REQUIREMENTS */}
              {isValid(
                r.special_requirements ||
                  r.event_special_requirements ||
                  r.long_term_special_requirements
              ) && (
                <div className="mt-3">
                  <b>Požiadavky na výcvik:</b>
                  <p className="border rounded-xl p-3 mt-1">
                    {r.special_requirements ||
                      r.event_special_requirements ||
                      r.long_term_special_requirements}
                  </p>
                </div>
              )}

              {/* NOTES */}
              {isValid(r.note || r.event_note || r.long_term_note) && (
                <div className="mt-3">
                  <b>Poznámka:</b>
                  <p className="border rounded-xl p-3 mt-1">
                    {r.note || r.event_note || r.long_term_note}
                  </p>
                </div>
              )}

              {/* BUTTONS */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={(e) => onDelete(e, r)}
                  className="flex-1 bg-red-600 text-white py-2 rounded-xl font-semibold"
                >
                  Odstrániť
                </button>

                {onAnnul && (
                  <button
                    onClick={(e) => onAnnul(e, r)}
                    className="flex-1 bg-gray-500 text-white py-2 rounded-xl font-semibold"
                  >
                    Stornovať
                  </button>
                )}
              </div>
            </div>
          );
        })
      ) : (
        <p className="text-center text-gray-500 p-5 text-lg">
          Žiadni účastníci.
        </p>
      )}
    </div>
  );
}
