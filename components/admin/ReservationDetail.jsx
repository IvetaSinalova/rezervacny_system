"use client";

import React, { useState, useEffect, use } from "react";
import { toast } from "react-hot-toast";
import "../../styles/EventCalendar.css";
import Loading from "../Loading";
function ReservationDetail({ reservationProps, onPaymentChange }) {
  const [reservation, setReservation] = useState(reservationProps);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitiaLoad] = useState(true);

  const formatDateSK = (dateStr) => {
    const date = new Date(dateStr);
    if (!date) return "";

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}.${month}. ${year}`;
  };

  // Add this inside your ReservationDetail component
  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setReservation((prev) => ({ ...prev, [name]: value }));
  };

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setReservation(reservationProps);
  }, [reservationProps]);

  useEffect(() => {
    if (
      reservation?.reservation_type == "long_term" &&
      reservation.start_date == undefined
    ) {
      reservation.start_date = reservation.long_term_start_date;
      reservation.end_date = reservation.long_term_end_date;
      setInitiaLoad(false);
    }
  }, [reservation]);

  const handleSaveOwner = async () => {
    setIsSaving(true);

    const response = await fetch(
      "https://www.psiaskola.sk/wp-json/events/v1/update-client",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: reservation.first_name,
          last_name: reservation.last_name,
          phone_number: reservation.phone_number,
          email: reservation.email,
          street: reservation.street,
          zip: reservation.zip,
          city: reservation.city,
          client_id: reservation.client_id,
        }),
      },
    );
    const data = await response.json();

    setIsSaving(false);
    if (!response.ok || !data.success) {
      alert("Nepodarilo sa aktualizovať informácie o majiteľovi.");
    } else {
      alert("Informácie boli aktualizované.");
      const reservation_id =
        reservation.reservation_type === "long_term"
          ? (reservation.long_term_reservation_id ?? reservation.reservation_id)
          : reservation.reservation_id;

      const dataToUpdate = {
        first_name: reservation.first_name,
        last_name: reservation.last_name,
        phone_number: reservation.phone_number,
        email: reservation.email,
        street: reservation.street,
        zip: reservation.zip,
        city: reservation.city,
      };
      console.log("data to update");
      console.log(dataToUpdate);
      // 2. Loop through the entries and trigger the function for each
      Object.entries(dataToUpdate).forEach(([attr, value]) => {
        console.log(attr);
        console.log(value);
        // Only call it if the value actually exists
        if (value !== undefined && value !== null) {
          onPaymentChange(attr, value, reservation_id);
        }
      });
    }
  };

  const handleSaveDog = async () => {
    setIsSaving(true);

    const response = await fetch(
      "https://www.psiaskola.sk/wp-json/events/v1/update-dog",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: reservation.dog_name,
          breed: reservation.breed,
          birth: reservation.birth,
          gender: reservation.gender,
          dog_id: reservation.dog_id,
        }),
      },
    );
    const data = await response.json();

    setIsSaving(false);
    if (!response.ok || !data.success) {
      alert("Nepodarilo sa aktualizovať informácie o psovi.");
    } else {
      const reservation_id =
        reservation.reservation_type === "long_term"
          ? (reservation.long_term_reservation_id ?? reservation.reservation_id)
          : reservation.reservation_id;

      const dataToUpdate = {
        dog_name: reservation.dog_name,
        breed: reservation.breed,
        birth: reservation.birth,
        gender: reservation.gender,
      };
      Č;

      // 2. Loop through the entries and trigger the function for each
      Object.entries(dataToUpdate).forEach(([attr, value]) => {
        // Only call it if the value actually exists
        if (value !== undefined && value !== null) {
          onPaymentChange(attr, value, reservation_id);
        }
      });
    }
  };

  const handlePaymentChange = async (attr, value) => {
    setReservation((prev) => ({ ...prev, [attr]: value }));
    setLoading(true);

    try {
      const reservation_id =
        reservation.reservation_type === "long_term"
          ? (reservation.long_term_reservation_id ?? reservation.reservation_id)
          : reservation.reservation_id;
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

  if (initialLoad) {
    <Loading />;
  }
  console.log(reservation);

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
            <div className="text-center font-bold text-lg mt-2 mb-3">
              <div>{reservation.event_total_price}€</div>
              {reservation.sf_id && (
                <a
                  href={`https://moja.superfaktura.sk/invoices/pdf/${reservation.sf_id}`}
                  target="_blank"
                  className="underline font-normal"
                >
                  {" "}
                  Stiahnuť faktúru{" "}
                </a>
              )}
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
        <div className="bg-gray-50 p-6 rounded-xl shadow-inner">
          <h3 className="font-semibold text-lg text-gray-700 mb-2">Platba</h3>
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
                    disabled={isSaving}
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
                    disabled={isSaving}
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
                disabled={isSaving}
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
                disabled={isSaving}
                checked={reservation.is_paid === "0"}
                onChange={() => handlePaymentChange("is_paid", "0")}
                className="w-5 h-5 text-red-500 border-gray-300 focus:ring-2 focus:ring-red-400"
              />
              <span>Nie</span>
            </label>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-6 rounded-xl shadow-inner">
        <h3 className="font-semibold text-lg text-gray-700 mb-2">Majiteľ</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* First Name */}
          <div className="flex flex-col space-y-1">
            <label className="text-sm font-medium text-gray-600 ml-1">
              Meno
            </label>
            <input
              name="first_name"
              disabled={isSaving}
              value={reservation.first_name || ""}
              onChange={handleFieldChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-all bg-white"
              placeholder="Meno"
            />
          </div>

          {/* Last Name */}
          <div className="flex flex-col space-y-1">
            <label className="text-sm font-medium text-gray-600 ml-1">
              Priezvisko
            </label>
            <input
              name="last_name"
              disabled={isSaving}
              value={reservation.last_name || ""}
              onChange={handleFieldChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-all bg-white"
              placeholder="Priezvisko"
            />
          </div>

          {/* Phone */}
          <div className="flex flex-col space-y-1">
            <label className="text-sm font-medium text-gray-600 ml-1">
              Telefón
            </label>
            <input
              name="phone_number"
              value={reservation.phone_number || ""}
              disabled={isSaving}
              onChange={handleFieldChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-all bg-white"
              placeholder="Telefón"
            />
          </div>

          {/* Email */}
          <div className="flex flex-col space-y-1">
            <label className="text-sm font-medium text-gray-600 ml-1">
              Email
            </label>
            <input
              name="email"
              value={reservation.email || ""}
              disabled={isSaving}
              onChange={handleFieldChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-all bg-white"
              placeholder="Email"
            />
          </div>

          {/* Street */}
          <div className="flex flex-col space-y-1">
            <label className="text-sm font-medium text-gray-600 ml-1">
              Ulica
            </label>
            <input
              name="street"
              disabled={isSaving}
              value={reservation.street || ""}
              onChange={handleFieldChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-all bg-white"
              placeholder="Ulica a číslo"
            />
          </div>

          {/* ZIP */}
          <div className="flex flex-col space-y-1">
            <label className="text-sm font-medium text-gray-600 ml-1">
              PSČ
            </label>
            <input
              name="zip"
              disabled={isSaving}
              value={reservation.zip || ""}
              onChange={handleFieldChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-all bg-white"
              placeholder="PSČ"
            />
          </div>

          {/* City */}
          <div className="flex flex-col space-y-1">
            <label className="text-sm font-medium text-gray-600 ml-1">
              Mesto
            </label>
            <input
              name="city"
              disabled={isSaving}
              value={reservation.city || ""}
              onChange={handleFieldChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-all bg-white"
              placeholder="Mesto"
            />
          </div>
        </div>
        <div className="flex justify-end w-full">
          <button
            type="submit"
            onClick={handleSaveOwner} // Make sure your save function is called here
            disabled={isSaving} // Disable if saving OR if payment is loading
            className={`btn-save mt-4 px-6 py-2 text-white rounded-lg transition-all flex items-center gap-2 ${
              isSaving || loading
                ? "opacity-50 cursor-not-allowed bg-gray-400"
                : "hover:opacity-90 bg-[var(--color-tertiary)]"
            }`}
          >
            {isSaving ? (
              <>
                <span className="animate-pulse">Ukladám...</span>
              </>
            ) : (
              "Uložiť"
            )}
          </button>
        </div>
      </div>

      {/* Dog */}
      {reservation?.dog_name && (
        <div className="bg-gray-50 p-6 rounded-xl shadow-inner border border-gray-100">
          <h3 className="font-semibold text-lg text-gray-700 mb-2">Pes</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Dog Name */}
            <div className="flex flex-col space-y-1">
              <label className="text-sm font-medium text-gray-600 ml-1">
                Meno psa
              </label>
              <input
                name="dog_name"
                disabled={isSaving}
                value={reservation.dog_name || ""}
                onChange={handleFieldChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-all bg-white"
                placeholder="Meno psa"
              />
            </div>

            {/* Breed */}
            <div className="flex flex-col space-y-1">
              <label className="text-sm font-medium text-gray-600 ml-1">
                Plemeno
              </label>
              <input
                name="breed"
                disabled={isSaving}
                value={reservation.breed || ""}
                onChange={handleFieldChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-all bg-white"
                placeholder="Plemeno"
              />
            </div>

            {/* Gender */}
            <div className="flex flex-col space-y-1">
              <label className="text-sm font-medium text-gray-600 ml-1">
                Pohlavie
              </label>
              <input
                name="gender"
                disabled={isSaving}
                value={reservation.gender || ""}
                onChange={handleFieldChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-all bg-white"
                placeholder="Pohlavie"
              />
            </div>

            {/* Age / Birthday */}
            <div className="flex flex-col space-y-1">
              <label className="text-sm font-medium text-gray-600 ml-1">
                Dátum narodenia
              </label>
              <input
                name="birth"
                type="date"
                disabled={isSaving}
                value={reservation.birth || ""}
                onChange={handleFieldChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-all bg-white"
                placeholder="RRRR-MM-DD"
              />
            </div>
          </div>
          <div className="flex justify-end w-full">
            <button
              type="submit"
              onClick={handleSaveDog} // Make sure your save function is called here
              disabled={isSaving} // Disable if saving OR if payment is loading
              className={`btn-save mt-4 px-6 py-2 text-white rounded-lg transition-all flex items-center gap-2 ${
                isSaving || loading
                  ? "opacity-50 cursor-not-allowed bg-gray-400"
                  : "hover:opacity-90 bg-[var(--color-tertiary)]"
              }`}
            >
              {isSaving ? (
                <>
                  <span className="animate-pulse">Ukladám...</span>
                </>
              ) : (
                "Uložiť"
              )}
            </button>
          </div>
        </div>
      )}
      {/* Long-term / Accommodation Info */}
      {reservation?.accommodation_name && (
        <div className="bg-gray-50 p-4 rounded-xl shadow-inner space-y-2">
          <h3 className="font-semibold text-md text-gray-700 mb-2">
            Ubytovanie
          </h3>
          {reservation?.accommodation_name && (
            <div className="flex w-full justify-between">
              <div>
                Názov ubytovania:{" "}
                <strong>{reservation.accommodation_name}</strong>
              </div>
              {reservation?.accommodation_total_price &&
              reservation.accommodation_total_price > 0 ? (
                <div>
                  Cena:
                  <strong>
                    {reservation.accommodation_total_price
                      .toFixed(2)
                      .replace(".", ",")}
                    €
                  </strong>
                </div>
              ) : (
                ""
              )}
            </div>
          )}
        </div>
      )}

      {reservation?.training_walks &&
        reservation?.long_term_event_type_id !== "6" && (
          <div className="bg-gray-50 p-4 rounded-xl shadow-inner space-y-2">
            <h3 className="font-semibold text-md text-gray-700 mb-2">
              Doplnkové služby
            </h3>
            {reservation?.training_walks && reservation.training_walks != 0 && (
              <div className="flex w-full justify-between">
                <div>
                  Počet tréningových vychádzok: {reservation.training_walks}
                </div>
                {reservation?.training_walks_price && (
                  <div>
                    Cena:
                    <strong>
                      {" "}
                      {reservation.training_walks_price
                        .toFixed(2)
                        .replace(".", ",")}
                      €
                    </strong>{" "}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      {reservation?.special_requirements && (
        <div className="bg-gray-50 p-4 rounded-xl shadow-inner space-y-2">
          <h3 className="font-semibold text-md text-gray-700 mb-2">
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
          <h3 className="font-semibold text-md text-gray-700 mb-2">Poznámka</h3>
          <div className="mt-1 bg-white p-2 rounded-xl border-2 border-gray-100 mb-2">
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
