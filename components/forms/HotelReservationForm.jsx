"use client";
import React, { useState, useRef } from "react";
import { ClientForm } from "./ClientForm";
import { DogFormAllInfo } from "./DogFormAllInfo";
import CustomDropdown from "../CustomDropdown";
import PaymentForm from "./PaymentForm";

function HotelReservationForm({
  pricePerDay,
  numOfNights,
  startDate,
  serviceName,
  accommodations,
  endDate = null,
  setModal,
  trainingWalkPrice,
  accommodationsPrice,
  deselectDays,
}) {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [trainingWalkTotalPrice, setTrainingWalkTotalPrice] = useState(0);
  const [messageColor, setMessageColor] = useState("text-red-600");
  const [accomodationPrice, setAccommodationPrice] = useState(0);
  const clientRef = useRef();
  const dogRef = useRef();
  const getDayOfWeek = (date) => {
    // if date is a string, convert to Date
    const d = typeof date === "string" ? new Date(date) : date;
    return d.getDay(); // 0 = Sunday, 6 = Saturday
  };

  const formatDate = (date) =>
    date instanceof Date ? date.toLocaleDateString("sk-SK") : "";

  const generateTimeOptions = (from, to) => {
    const options = [];

    const [fromHour] = from.split(":").map(Number);
    const [toHour] = to.split(":").map(Number);

    for (let hour = fromHour; hour < toHour; hour++) {
      options.push(`${String(hour).padStart(2, "0")}:00`);
    }

    return options;
  };

  const getTimeRangesForDate = (dateStr) => {
    const day = getDayOfWeek(dateStr);

    // Saturday (6) or Sunday (0)
    if (day === 0 || day === 6) {
      return [
        { from: "08:00", to: "10:00" },
        { from: "18:00", to: "20:00" },
      ];
    }

    // Monday–Friday
    return [
      { from: "08:00", to: "15:00" },
      { from: "18:00", to: "20:00" },
    ];
  };

  const timeRanges = getTimeRangesForDate(startDate);

  const startTimeOptions = getTimeRangesForDate(startDate).flatMap((range) =>
    generateTimeOptions(range.from, range.to)
  );

  const endTimeOptions = getTimeRangesForDate(endDate ?? startDate).flatMap(
    (range) => generateTimeOptions(range.from, range.to)
  );

  const [formData, setFormData] = useState({
    startTime: startTimeOptions[0],
    endTime: endTimeOptions[0],
    accommodation: "",
    trainingWalks: 0,
  });

  const getAvailableAccomodations = (allAccomodations) => {
    const availableAccomodations = [];
    allAccomodations.map((a) => {
      if (a.free > 0) {
        availableAccomodations.push(a.name);
      }
    });
    if (availableAccomodations.length == 0) {
      availableAccomodations.push("Koterec");
    }
    return availableAccomodations;
  };

  const convertToMySQLDateTime = (dateStr, timeStr) => {
    // Assuming dateStr = "26.12.2025" and timeStr = "09:30"
    const [day, month, year] = dateStr
      .split(".")
      .map((x) => x.padStart(2, "0").trim());
    const [hours, minutes] = timeStr
      .split(":")
      .map((x) => x.padStart(2, "0").trim());
    return `${year}-${month}-${day} ${hours}:${minutes}:00`;
  };

  function getAccommodationPrice(name) {
    const accommodation = accommodationsPrice.find(
      (item) => item.name === name
    );
    if (!accommodation) return 0; // not found
    const price = parseFloat(accommodation.price);
    setAccommodationPrice(isNaN(price) ? 0 : price * numOfNights);
  }

  const handleSubmit = async () => {
    setIsLoading(true);
    setMessage(""); // clear previous messages

    // --- validate client and dog forms ---
    const clientOk = clientRef.current.isValid();
    const dogOk = dogRef.current.isValid();
    const accommodationOk = formData.accommodation.trim() !== "";

    if (!clientOk || !dogOk || !accommodationOk) {
      setMessage("Prosím, skontrolujte všetky polia. Niektoré údaje chýbajú.");
      setIsLoading(false);
      setMessageColor("text-red-600");
      return;
    }

    // --- construct payload ---
    const payload = {
      client: clientRef.current.getData(), // all client fields
      dog: dogRef.current.getData(), // all dog fields
      serviceName: serviceName,
      startDate: convertToMySQLDateTime(
        formatDate(startDate),
        formData.startTime
      ),
      endDate: convertToMySQLDateTime(
        endDate ? formatDate(endDate) : formatDate(startDate),
        formData.endTime
      ), // optional end time
      accommodation: formData.accommodation,
      note: formData.note || null,
      trainingWalks: formData.trainingWalks,
    };

    try {
      const response = await fetch(
        "https://psiaskola.sk/wp-json/longterm/v1/create-hotel-reservation",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();
      setIsLoading(false);

      if (!response.ok) {
        setMessage(result.message || "Nastala chyba pri odosielaní.");
        setMessageColor("text-red-600");
        return;
      }

      setMessage(
        "Rezervácia bola úspešne vytvorená, na mail vám bolo zaslané potvrdenie"
      );
      setMessageColor("text-[var(--color-primary)]");

      setSuccess(true);

      // Optionally reset form
      setFormData({
        selectedTime: "",
        accommodation: "",
        note: "",
        problems: "",
        trainingRequirements: "",
        note: "",
      });
      deselectDays();
    } catch (error) {
      console.error(error);
      setMessage("Chyba pri odosielaní dát.");
      setMessageColor("text-red-600");
      setIsLoading(false);
    }
  };

  return (
    <div>
      {success && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center relative">
            <p className={`font-semibold text-xl ${messageColor}`}>{message}</p>

            <button
              onClick={() => setModal(false)}
              className="mt-4 px-6 py-2 bg-[var(--color-tertiary)] text-white rounded-2xl hover:opacity-90 transition"
            >
              Zavrieť
            </button>
          </div>
        </div>
      )}

      {!success && (
        <div>
          {/* Event Info Header */}
          <div className="mb-6 border-b border-[var(--color-secondary)] pb-3 text-center">
            <h2 className="text-xl font-bold mb-1">Rezervácia</h2>

            <div>
              <strong>{serviceName}</strong>
            </div>

            <div>
              <strong style={{ marginRight: "5px" }}>Od:</strong>
              <strong>{formatDate(startDate)}</strong>
            </div>

            <div>
              <strong style={{ marginRight: "5px" }}>Do:</strong>
              <strong>{formatDate(endDate)}</strong>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <CustomDropdown
              label="Vyberte čas odovzdania psa do hotela"
              value={formData.startTime}
              options={startTimeOptions}
              onSelect={(selected) =>
                setFormData((prev) => ({ ...prev, startTime: selected }))
              }
            />

            <CustomDropdown
              label="Vyberte čas vyzdvihnutia psa z hotela"
              value={formData.endTime}
              options={endTimeOptions}
              onSelect={(selected) =>
                setFormData((prev) => ({ ...prev, endTime: selected }))
              }
            />

            <ClientForm ref={clientRef} />
            <DogFormAllInfo ref={dogRef} />

            <CustomDropdown
              label="Vyberte druh ubytovania"
              options={getAvailableAccomodations(accommodations)}
              value={formData.accommodation}
              onSelect={(selected) => {
                setFormData((prev) => ({
                  ...prev,
                  accommodation: selected,
                }));
                getAccommodationPrice(selected);
              }}
              hasError={message && !formData.accommodation}
            />

            <div className="flex flex-col gap-1 shadow-xl bg-white p-6 rounded-2xl">
              <label className="font-semibold text-sm">
                Výcviková vychádzka
              </label>
              <input
                name="trainingWalks"
                value={formData.trainingWalks}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    trainingWalks: e.target.value,
                  }));
                  setTrainingWalkTotalPrice(e.target.value * trainingWalkPrice);
                }}
                className="p-2 rounded-xl bg-white border"
              />
            </div>

            <div className="flex flex-col gap-1 shadow-xl bg-white p-6 rounded-2xl">
              <label className="font-semibold text-md">Poznámka</label>
              <textarea
                value={formData.note}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    note: e.target.value,
                  }))
                }
                className="border border-[var(--color-tertiary)] p-2 rounded-xl bg-white w-full resize-none"
              />
            </div>
            <PaymentForm />
            <div className="flex w-full gap-1 shadow-xl bg-white p-6 rounded-2xl font-bold text-md">
              <div className="text-xl">Cena:</div>

              <div className="text-right flex flex-col flex-1">
                {accomodationPrice > 0 && (
                  <div className="font-normal">
                    {formData.accommodation}: {accomodationPrice}€
                  </div>
                )}
                <div className="font-normal">
                  Výcviková vychádzka: {trainingWalkTotalPrice}€
                </div>
                <div className="font-normal">
                  Ubytovanie: {pricePerDay * numOfNights}€
                </div>
                <div className="text-xl">
                  Spolu:{" "}
                  {trainingWalkTotalPrice +
                    pricePerDay * numOfNights +
                    accomodationPrice}
                  €
                </div>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className={`w-full p-3 rounded-2xl flex items-center justify-center gap-2
              bg-[var(--color-tertiary)] text-white
              ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              {isLoading && (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              <span>{isLoading ? "Odosielam..." : "Odoslať"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default HotelReservationForm;
