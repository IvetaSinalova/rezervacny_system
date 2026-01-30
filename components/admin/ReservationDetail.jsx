"use client";

import React, { useState } from "react";
import { toast } from "react-hot-toast";
import "../../styles/EventCalendar.css";
import Loading from "../Loading";
function ReservationDetail({ reservationProps, onPaymentChange }) {
  const [reservation, setReservation] = useState(reservationProps);
  const [loading, setLoading] = useState(false);

  const formatDateSK = (date) => {
    if (!date) return "";

    return new Intl.DateTimeFormat("sk-SK", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(date));
  };

  const [isSaving, setIsSaving] = useState(false);

  const handlePaymentChange = async (attr, value) => {
    setReservation((prev) => ({ ...prev, [attr]: value }));
    setLoading(true);

    try {
      const reservation_id =
        reservation.reservation_type === "long_term"
          ? (reservation.long_term_reservation_id ?? reservation.reservation_id)
          : reservation.event_reservation_id;
      const response = await fetch(
        "https://www.psiaskola.sk/wp-json/events/v1/update-payment",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reservation_id: reservation_id,
            reservation_type: reservation.reservation_type,
            field: attr, // "is_paid" or "is_deposit_paid"
            value: value,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert("Nepodarilo sa aktualizovať platbu.");
        // revert if failed
        setReservation((prev) => ({ ...prev, [attr]: prev[attr] }));
      } else {
        onPaymentChange(attr, value, reservation_id);
      }
    } catch (err) {
      console.error(err);
      alert("Chyba spojenia so serverom.");
    } finally {
      setLoading(false);
    }
  };
  const fullName = `${reservation?.first_name ?? ""} ${
    reservation?.last_name ?? ""
  }`;

  return (
    <div className="w-full max-w-4xl mx-auto rounded-2xl  space-y-6">
      <div>
        <h3
          style={{
            textAlign: "center",
            fontWeight: "bold",
            fontSize: "20px",
          }}
        >
          Detail rezervácie
        </h3>
        {reservation.event_name && (
          <div className="text-center font-bold text-lg mt-3">
            {reservation.event_name}
          </div>
        )}
        {reservation.start_date && (
          <div className="text-center font-bold text-md">
            {reservation.end_date
              ? `${formatDateSK(reservation.start_date)} - ${formatDateSK(
                  reservation.end_date,
                )}`
              : formatDateSK(reservation.start_date)}
          </div>
        )}
        {reservation?.event_total_price &&
          reservation?.long_term_event_type_id !== "6" && (
            <div className="text-center font-bold text-lg mt-5 mb-3">
              <div>{reservation.event_total_price}€</div>

              <a
                href={`https://moja.superfaktura.sk/invoices/pdf/${reservation.sf_id}`}
                target="_blank"
                className="underline font-normal"
              >
                {" "}
                Stiahnuť faktúru{" "}
              </a>
            </div>
          )}
        <div className="text-center mt-3">
          <button
            disabled={loading}
            onClick={async () => {
              if (!confirm("Naozaj chcete zrušiť túto rezerváciu?")) return;
              setLoading(true);

              try {
                const reservation_id =
                  reservation.reservation_type === "long_term"
                    ? (reservation.long_term_reservation_id ??
                      reservation.reservation_id)
                    : (reservation.event_reservation_id ??
                      reservation.reservation_id);
                const response = await fetch(
                  "https://www.psiaskola.sk/wp-json/events/v1/delete-reservation",
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      reservation_id: reservation_id,
                      reservation_type: reservation.reservation_type,
                    }),
                  },
                );

                const data = await response.json();

                if (!response.ok || !data.success) {
                  alert(data.message || "Nepodarilo sa zrušiť rezerváciu.");
                } else {
                  alert("Rezervácia bola úspešne zrušená.");
                  window.location.reload();
                }
              } catch (err) {
                console.error(err);
                alert("Chyba spojenia so serverom.");
              } finally {
                setLoading(false);
              }
            }}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg"
          >
            Zrušiť rezerváciu
          </button>
        </div>
      </div>
      <div>
        <div className="bg-gray-50 p-4 rounded-xl shadow-inner space-y-2">
          <h3 className="font-semibold text-lg text-gray-700">Platba</h3>

          {/* Záloha uhradená */}
          {reservation?.is_deposit_paid &&
            reservation?.long_term_event_type_id !== "6" && (
              <div className="flex items-center space-x-6">
                <span className="font-medium">Záloha uhradená:</span>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name={`is_deposit_paid_${reservation.dog_id}`}
                    value="1"
                    checked={reservation.is_deposit_paid === "1"}
                    disabled={loading}
                    onChange={() => handlePaymentChange("is_deposit_paid", "1")}
                    className="w-5 h-5 text-green-500 border-gray-300 focus:ring-2 focus:ring-green-400"
                  />
                  <span>Áno</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name={`is_deposit_paid_${reservation.dog_id}`}
                    value="0"
                    disabled={loading}
                    checked={reservation.is_deposit_paid === "0"}
                    onChange={() => handlePaymentChange("is_deposit_paid", "0")}
                    className="w-5 h-5 text-red-500 border-gray-300 focus:ring-2 focus:ring-red-400"
                  />
                  <span>Nie</span>
                </label>
              </div>
            )}

          {/* Zaplatené */}
          <div className="flex items-center space-x-6">
            <span className="font-medium">
              {reservation.is_deposit_paid &&
              reservation?.long_term_event_type_id !== "6"
                ? "Doplatené"
                : "Zaplatené"}
            </span>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name={`is_paid_${reservation.dog_id}`}
                value="1"
                disabled={loading}
                checked={reservation.is_paid === "1"}
                onChange={() => handlePaymentChange("is_paid", "1")}
                className="w-5 h-5 text-green-500 border-gray-300 focus:ring-2 focus:ring-green-400"
              />
              <span>Áno</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name={`is_paid_${reservation.dog_id}`}
                value="0"
                disabled={loading}
                checked={reservation.is_paid === "0"}
                onChange={() => handlePaymentChange("is_paid", "0")}
                className="w-5 h-5 text-red-500 border-gray-300 focus:ring-2 focus:ring-red-400"
              />
              <span>Nie</span>
            </label>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-xl shadow-inner space-y-1">
        <h3 className="font-semibold text-lg text-gray-700 mb-2">Majiteľ</h3>
        <div>
          Meno: <strong>{fullName}</strong>
        </div>
        {reservation?.email && <div>Email: {reservation.email}</div>}
        {reservation?.phone_number && (
          <div>Telefón: {reservation.phone_number}</div>
        )}
        <div>
          Adresa: {reservation?.street ?? ""}, {reservation?.zip ?? ""}{" "}
          {reservation?.city ?? ""}
        </div>
      </div>

      {/* Dog */}
      {reservation?.dog_name && (
        <div className="bg-gray-50 p-4 rounded-xl shadow-inner space-y-1">
          <h3 className="font-semibold text-lg text-gray-700 mb-2">Pes</h3>
          <div>
            Meno: <strong>{reservation?.dog_name}</strong>
          </div>
          <div>Plemeno: {reservation?.breed}</div>
          <div>Pohlavie: {reservation?.gender}</div>
          {reservation?.age && <div>Vek: {reservation.age}</div>}
          {reservation?.birth && (
            <div>Dátum narodenia: {reservation.birth}</div>
          )}
          {reservation?.chip_number && (
            <div>Čip: {reservation.chip_number}</div>
          )}
        </div>
      )}

      {/* Long-term / Accommodation Info */}
      {reservation?.accommodation_name && (
        <div className="bg-gray-50 p-4 rounded-xl shadow-inner space-y-2">
          <h3 className="font-semibold text-lg text-gray-700 mb-2">
            Ubytovanie
          </h3>
          {reservation?.accommodation_name && (
            <div className="flex w-full justify-between">
              <div>
                Názov ubytovania:{" "}
                <strong>{reservation.accommodation_name}</strong>
              </div>

              {reservation?.accommodation_total_price && (
                <div>
                  Cena:
                  <strong>
                    {" "}
                    {reservation.accommodation_total_price}€
                  </strong>{" "}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {reservation?.training_walks &&
        reservation?.long_term_event_type_id !== "6" && (
          <div className="bg-gray-50 p-4 rounded-xl shadow-inner space-y-2">
            <h3 className="font-semibold text-lg text-gray-700 mb-2">
              Doplnkové služby
            </h3>
            {reservation?.training_walks && (
              <div className="flex w-full justify-between">
                <div>
                  Počet tréningových vychádzok: {reservation.training_walks}
                </div>
                {reservation?.training_walks_price && (
                  <div>
                    Cena:
                    <strong> {reservation.training_walks_price}€</strong>{" "}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      {reservation?.special_requirements && (
        <div className="bg-gray-50 p-4 rounded-xl shadow-inner space-y-2">
          <h3 className="font-semibold text-lg text-gray-700 mb-2">
            Ďalšie informácie
          </h3>
          {reservation?.problems && <div>Problémy: {reservation.problems}</div>}
          {reservation?.special_requirements && (
            <div>Požiadavky na výcvik: {reservation.special_requirements}</div>
          )}
        </div>
      )}

      {/* Notes */}
      {(reservation?.long_term_note ||
        reservation?.event_note ||
        reservation?.note) && (
        <div className="bg-gray-50 p-4 rounded-xl shadow-inner space-y-2">
          <h3 className="font-semibold text-lg text-gray-700 mb-2">Poznámka</h3>
          <div>
            {reservation.long_term_note ||
              reservation.event_note ||
              reservation.note}
          </div>
        </div>
      )}
    </div>
  );
}

export default ReservationDetail;
