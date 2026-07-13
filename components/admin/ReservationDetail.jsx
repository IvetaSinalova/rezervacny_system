"use client";

import React, { useState, useEffect, use } from "react";
import { toast } from "react-hot-toast";
import "../../styles/EventCalendar.css";
import Loading from "../Loading";

const SWITCHABLE_LONG_TERM_SERVICE_TYPES = {
  prevychova: { id: "1", label: "Prevýchova psa" },
  vycvik: { id: "2", label: "Výcvik s ubytovaním" },
};

function ReservationDetail({
  reservationProps,
  onPaymentChange,
  onReservationUpdate,
}) {
  console.log(reservationProps);
  const [reservation, setReservation] = useState(reservationProps);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitiaLoad] = useState(true);
  const [switchingServiceType, setSwitchingServiceType] = useState(false);
  const [switchingAccommodation, setSwitchingAccommodation] = useState(false);
  const [accommodations, setAccommodations] = useState([]);
  const [priceDraft, setPriceDraft] = useState(
    reservationProps?.event_total_price ?? reservationProps?.final_price ?? "",
  );
  const [savingPrice, setSavingPrice] = useState(false);

  useEffect(() => {
    const value =
      reservationProps.long_term_special_requirements ||
      reservationProps.event_special_requirements;

    if (value) {
      setReservation((prev) => ({
        ...prev,
        special_requirements: value,
      }));
      console.log(value);
      console.log(reservation.special_requirements);
    }
  }, [reservationProps]);

  const formatDateSK = (dateStr) => {
    const date = new Date(dateStr);
    if (!date) return "";

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}.${month}. ${year}`;
  };

  const formatDateTimeSK = (dateStr) => {
    if (!dateStr) return "";

    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return "";

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${day}.${month}. ${year} ${hours}:${minutes}`;
  };

  // Add this inside your ReservationDetail component
  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setReservation((prev) => ({ ...prev, [name]: value }));
  };

  const [isSaving, setIsSaving] = useState(false);

  const reservationId =
    reservation?.reservation_type === "long_term"
      ? (reservation.long_term_reservation_id ?? reservation.reservation_id)
      : reservation?.reservation_id;
  const currentLongTermServiceId = String(
    reservation?.long_term_event_type_id ?? "",
  );
  const canSwitchServiceType =
    reservation?.reservation_type === "long_term" &&
    ["1", "2"].includes(currentLongTermServiceId);
  const currentAccommodationId = String(
    reservation?.accommodation_id ??
      accommodations.find(
        (item) => item.name === reservation?.accommodation_name,
      )?.id ??
      "",
  );
  const visibleAccommodations = accommodations.filter(
    (item) => String(item.id) !== "6" && item.name !== "Homeless",
  );
  const canSwitchAccommodation =
    reservation?.reservation_type === "long_term" &&
    Boolean(currentAccommodationId) &&
    visibleAccommodations.length > 0 &&
    visibleAccommodations.some(
      (item) => String(item.id) === currentAccommodationId,
    );
  const currentSwitchValue =
    currentLongTermServiceId ===
    SWITCHABLE_LONG_TERM_SERVICE_TYPES.prevychova.id
      ? "prevychova"
      : "vycvik";

  const extraDays = Number(reservation?.extra_days ?? 0);
  const newHandoverDate =
    reservation?.new_handover_date ||
    (extraDays > 0 && reservation?.end_date
      ? new Date(
          new Date(reservation.end_date).getTime() + extraDays * 86400000,
        ).toISOString()
      : null);

  useEffect(() => {
    if (reservationProps?.reservation_type !== "long_term") return;

    fetch("/api/wp/events/v1/all-accomodations")
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAccommodations(data);
        }
      })
      .catch((err) => console.error(err));
  }, [reservationProps?.reservation_type]);

  const handleServiceTypeSwitch = async (newServiceType) => {
    if (!canSwitchServiceType || newServiceType === currentSwitchValue) return;

    const targetLabel =
      SWITCHABLE_LONG_TERM_SERVICE_TYPES[newServiceType]?.label || "";

    if (
      !confirm(
        `Naozaj chcete zmeniť službu na ${targetLabel}? Cena bude prepočítaná.`,
      )
    ) {
      return;
    }

    setSwitchingServiceType(true);
    setLoading(true);

    try {
      const response = await fetch(
        `/api/wp/events/v1/reservations/${reservationId}/switch-service-type`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newServiceType }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(data.message || "Nepodarilo sa zmeniť typ služby.");
        return;
      }

      setReservation((prev) => ({ ...prev, ...data.reservation }));
      setPriceDraft(data.reservation.event_total_price ?? "");
      onReservationUpdate?.(data.reservation);
    } catch (err) {
      console.error(err);
      alert("Chyba spojenia so serverom.");
    } finally {
      setSwitchingServiceType(false);
      setLoading(false);
    }
  };

  const handleAccommodationSwitch = async (newAccommodationId) => {
    if (
      !canSwitchAccommodation ||
      String(newAccommodationId) === currentAccommodationId
    ) {
      return;
    }

    const targetAccommodation = accommodations.find(
      (item) => String(item.id) === String(newAccommodationId),
    );
    const targetLabel = targetAccommodation?.name || "";

    if (
      !confirm(
        `Naozaj chcete zmeniť ubytovanie na ${targetLabel}? Cena bude prepočítaná.`,
      )
    ) {
      return;
    }

    setSwitchingAccommodation(true);
    setLoading(true);

    try {
      const response = await fetch(
        `/api/wp/events/v1/reservations/${reservationId}/accommodation`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accommodationId: Number(newAccommodationId) }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(data.message || "Nepodarilo sa zmeniť typ ubytovania.");
        return;
      }

      setReservation((prev) => ({ ...prev, ...data.reservation }));
      setPriceDraft(data.reservation.event_total_price ?? "");
      onReservationUpdate?.(data.reservation);
    } catch (err) {
      console.error(err);
      alert("Chyba spojenia so serverom.");
    } finally {
      setSwitchingAccommodation(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    setReservation(reservationProps);
    setPriceDraft(
      reservationProps?.event_total_price ??
        reservationProps?.final_price ??
        "",
    );
  }, [reservationProps]);

  const handlePriceSave = async () => {
    const parsedPrice = Number(String(priceDraft).replace(",", "."));

    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      alert("Zadajte platnú cenu.");
      return;
    }

    const currentPrice = Number(
      reservation?.event_total_price ?? reservation?.final_price ?? 0,
    );
    if (parsedPrice === currentPrice) return;

    setSavingPrice(true);
    setLoading(true);

    try {
      const response = await fetch(
        `/api/wp/events/v1/reservations/${reservationId}/price`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reservation_type: reservation.reservation_type,
            price: parsedPrice,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(data.message || "Nepodarilo sa uložiť cenu.");
        return;
      }

      setReservation((prev) => ({ ...prev, ...data.reservation }));
      setPriceDraft(data.reservation.event_total_price ?? parsedPrice);
      onReservationUpdate?.(data.reservation);
    } catch (err) {
      console.error(err);
      alert("Chyba spojenia so serverom.");
    } finally {
      setSavingPrice(false);
      setLoading(false);
    }
  };

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

    const response = await fetch("/api/wp/events/v1/update-client", {
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
        country: reservation.country,
        client_id: reservation.client_id,
      }),
    });
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
        country: reservation.country,
      };

      // 2. Loop through the entries and trigger the function for each
      Object.entries(dataToUpdate).forEach(([attr, value]) => {
        // Only call it if the value actually exists
        if (value !== undefined && value !== null) {
          onPaymentChange(attr, value, reservation_id);
        }
      });
    }
  };

  const handleSaveDog = async () => {
    setIsSaving(true);

    const response = await fetch("/api/wp/events/v1/update-dog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: reservation.dog_name,
        breed: reservation.breed,
        birth: reservation.birth,
        gender: reservation.gender,
        dog_id: reservation.dog_id,
      }),
    });
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
      const response = await fetch("/api/wp/events/v1/update-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservation_id: reservation_id,
          reservation_type: reservation.reservation_type,
          field: attr, // "is_paid" or "is_deposit_paid"
          value: value,
        }),
      });

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

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 rounded-2xl sm:space-y-6">
      <div>
        <h3 className="text-center text-xl font-bold sm:text-2xl">
          Detail rezervácie
        </h3>
        {reservation.event_name && (
          <div className="mt-3 break-words px-2 text-center text-lg font-bold sm:text-xl">
            {reservation.event_name}
          </div>
        )}
        {reservation.start_date && (
          <div className="px-2 text-center text-sm font-semibold sm:text-base">
            {reservation.end_date
              ? `${formatDateTimeSK(reservation.start_date)} - ${formatDateTimeSK(
                  reservation.end_date,
                )}`
              : formatDateTimeSK(reservation.start_date)}
          </div>
        )}
        {reservation.created_at && (
          <div className="mt-2 px-2 text-center text-sm text-gray-600">
            Vytvorené: {formatDateTimeSK(reservation.created_at)}
          </div>
        )}
        {extraDays > 0 && (
          <div className="mt-2 px-2 text-center">
            <div className="text-red-500 text-xl font-bold">
              +{extraDays}{" "}
              {extraDays > 1 ? "dní" : "deň"}
            </div>
            {newHandoverDate && (
              <div className="mt-1 text-sm font-semibold text-gray-700">
                Nový termín odovzdania - {formatDateTimeSK(newHandoverDate)}
              </div>
            )}
          </div>
        )}

        {/* <div className="text-center font-bold text-lg mt-2 mb-3">
          {/* <div>{reservation.event_total_price}€</div> }
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
        </div> */}

        <div className="mt-4 text-center">
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
                  "/api/wp/events/v1/delete-reservation",
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
            className={`w-full rounded-lg bg-red-500 px-4 py-3 text-sm font-semibold text-white sm:w-auto ${
              isSaving || loading
                ? "opacity-50 cursor-not-allowed bg-gray-400"
                : "hover:bg-red-600 hover:opacity-90"
            } `}
          >
            Zrušiť rezerváciu
          </button>
        </div>
        {["long_term", "event"].includes(reservation?.reservation_type) &&
          reservation?.long_term_event_type_id !== "6" && (
            <div className="mt-4 rounded-2xl bg-gray-50 p-4 shadow-inner sm:p-6">
              <label className="text-sm font-medium text-gray-600 ml-1 mb-1 block">
                Cena rezervácie
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={priceDraft}
                  disabled={savingPrice || loading}
                  onChange={(e) => setPriceDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handlePriceSave();
                    }
                  }}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-all bg-white"
                />
                <button
                  type="button"
                  disabled={savingPrice || loading}
                  onClick={handlePriceSave}
                  className="btn-save w-full rounded-lg bg-[var(--color-tertiary)] px-4 py-2 text-white disabled:opacity-50 sm:w-auto"
                >
                  {savingPrice ? "Ukladám..." : "Uložiť"}
                </button>
              </div>
            </div>
          )}
        {canSwitchServiceType && (
          <div className="mt-4 rounded-2xl bg-gray-50 p-4 shadow-inner sm:p-6">
            <label className="text-sm font-medium text-gray-600 ml-1 mb-1 block">
              Typ služby
            </label>
            <select
              value={currentSwitchValue}
              disabled={switchingServiceType || loading}
              onChange={(e) => handleServiceTypeSwitch(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-all bg-white"
            >
              <option value="prevychova">
                {SWITCHABLE_LONG_TERM_SERVICE_TYPES.prevychova.label}
              </option>
              <option value="vycvik">
                {SWITCHABLE_LONG_TERM_SERVICE_TYPES.vycvik.label}
              </option>
            </select>
            {switchingServiceType && (
              <div className="text-sm text-gray-500 mt-2">
                Prepočítavam cenu...
              </div>
            )}
          </div>
        )}
        {canSwitchAccommodation && (
          <div className="mt-4 rounded-2xl bg-gray-50 p-4 shadow-inner sm:p-6">
            <label className="text-sm font-medium text-gray-600 ml-1 mb-1 block">
              Typ ubytovania
            </label>
            <select
              value={currentAccommodationId}
              disabled={switchingAccommodation || loading}
              onChange={(e) => handleAccommodationSwitch(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-all bg-white"
            >
              {visibleAccommodations.map((item) => (
                <option key={item.id} value={String(item.id)}>
                  {item.name}
                </option>
              ))}
            </select>
            {switchingAccommodation && (
              <div className="text-sm text-gray-500 mt-2">
                Prepočítavam cenu...
              </div>
            )}
          </div>
        )}
      </div>
      <div>
        <div className="rounded-2xl bg-gray-50 p-4 shadow-inner sm:p-6">
          <h3 className="font-semibold text-lg text-gray-700 mb-2">Platba</h3>
          {/* Záloha uhradená */}
          {reservation?.is_deposit_paid &&
            reservation?.long_term_event_type_id !== "6" && (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
                <span className="font-medium">Záloha uhradená:</span>

                <label className="flex cursor-pointer items-center space-x-2">
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

                <label className="flex cursor-pointer items-center space-x-2">
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
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
            <span className="font-medium">
              {reservation.is_deposit_paid &&
              reservation?.long_term_event_type_id !== "6"
                ? "Doplatené"
                : "Zaplatené"}
            </span>

            <label className="flex cursor-pointer items-center space-x-2">
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

            <label className="flex cursor-pointer items-center space-x-2">
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

      <div className="rounded-2xl bg-gray-50 p-4 shadow-inner sm:p-6">
        <h3 className="font-semibold text-lg text-gray-700 mb-2">Majiteľ</h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

          {/* Country */}
          <div className="flex flex-col space-y-1">
            <label className="text-sm font-medium text-gray-600 ml-1">
              Štát
            </label>
            <input
              name="country"
              disabled={isSaving}
              value={reservation.country || ""}
              onChange={handleFieldChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-all bg-white"
              placeholder="Štát"
            />
          </div>
        </div>
        <div className="flex w-full justify-stretch sm:justify-end">
          <button
            type="submit"
            onClick={handleSaveOwner} // Make sure your save function is called here
            disabled={isSaving} // Disable if saving OR if payment is loading
            className={`btn-save mt-4 flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3 text-white transition-all sm:w-auto sm:py-2 ${
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
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 shadow-inner sm:p-6">
          <h3 className="font-semibold text-lg text-gray-700 mb-2">Pes</h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
          <div className="flex w-full justify-stretch sm:justify-end">
            <button
              type="submit"
              onClick={handleSaveDog} // Make sure your save function is called here
              disabled={isSaving} // Disable if saving OR if payment is loading
              className={`btn-save mt-4 flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3 text-white transition-all sm:w-auto sm:py-2 ${
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
      {/* {reservation?.accommodation_name && (
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
      )} */}

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
      {(reservation?.special_requirements || reservation.problems) && (
        <div className="bg-gray-50 p-4 rounded-xl shadow-inner space-y-2">
          <h3 className="font-semibold text-md text-gray-700 mb-2">
            Ďalšie informácie
          </h3>
          {reservation?.problems && (
            <div className="mb-2">
              <div className="font-bold">Problémy:</div> {reservation.problems}
            </div>
          )}
          {(reservation?.special_requirements ||
            reservation.long_term_special_requirements) && (
            <div>
              <div className="font-bold">Požiadavky na výcvik: </div>
              {reservation.special_requirements ||
                reservation.long_term_special_requirements}
            </div>
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
