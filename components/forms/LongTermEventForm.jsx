"use client";
import React, { useState, useEffect, useRef } from "react";
import { ClientForm } from "./ClientForm";
import { DogFormAllInfo } from "./DogFormAllInfo";
import CustomDropdown from "../CustomDropdown";
import PaymentForm from "./PaymentForm";

function LongTermEventForm({
  serviceName,
  numOfNights,

  availableTimes,
  accommodations,
  startDate,
  endDate,
  setModal,
  accommodationsPrice,
  price,
}) {
  const clientRef = useRef();
  const dogRef = useRef();
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");
  const [messageColor, setMessageColor] = useState("text-red-600");
  const [formData, setFormData] = useState({
    selectedTime: "",
    accommodation: "",
    note: "",
    problems: "",
    trainingRequirements: "",
    note: "",
  });
  const [accomodationPrice, setAccommodationPrice] = useState(0);

  const [isLoading, setIsLoading] = useState(false);

  const generateTimeOptions = (from, to, maxSelectableHour = 15) => {
    const options = [];
    const [fromH, fromM] = from.split(":").map(Number);
    const [toH, toM] = to.split(":").map(Number);

    let startHour = fromM > 0 ? fromH + 1 : fromH;
    let endHour = toM > 0 ? toH - 1 : toH;
    endHour = Math.max(startHour, endHour - 2);
    endHour = Math.min(endHour, maxSelectableHour);

    for (let h = startHour; h <= endHour; h++) {
      options.push(`${h.toString().padStart(2, "0")}:00`);
    }
    return options;
  };

  function getAccommodationPrice(name) {
    const accommodation = accommodationsPrice.find(
      (item) => item.name === name,
    );
    if (!accommodation) return 0; // not found
    const price = parseFloat(accommodation.price);

    setAccommodationPrice(isNaN(price) ? 0 : price * numOfNights);
  }

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

  useEffect(() => {
    if (accommodations.length == 0) {
      setFormData((prev) => ({ ...prev, accommodation: "Koterec" }));
    }
  }, []);
  // Auto-select first available time
  useEffect(() => {
    if (availableTimes.length > 0) {
      const firstRange = availableTimes[0];
      const options = generateTimeOptions(firstRange.from, firstRange.to);
      setFormData((prev) => ({ ...prev, selectedTime: options[0] || "" }));
    }
  }, [availableTimes]);

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

  const handleSubmit = async () => {
    setIsLoading(true);
    setMessage(""); // clear previous messages

    // --- validate client and dog forms ---
    const clientOk = clientRef.current.isValid();
    const dogOk = dogRef.current.isValid();

    const timeOk = formData.selectedTime.trim() !== "";
    const accommodationOk = formData.accommodation.trim() !== "";
    const trainingOk = formData.trainingRequirements.trim() !== "";

    if (!clientOk || !dogOk || !timeOk || !accommodationOk || !trainingOk) {
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
      startDate: convertToMySQLDateTime(startDate, formData.selectedTime),
      endDate: convertToMySQLDateTime(endDate, formData.selectedTime), // optional end time
      accommodation: formData.accommodation,
      note: formData.note,
      problems: formData.problems,
      specialRequirements: formData.trainingRequirements, // map trainingRequirements to specialRequirements if needed
      trainingRequirements: formData.trainingRequirements,
    };

    try {
      const response = await fetch(
        "https://psiaskola.sk/wp-json/longterm/v1/create-long-term-reservation",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const result = await response.json();

      setIsLoading(false);

      // if (!response.ok) {
      //   setMessage(result.message || "Nastala chyba pri odosielaní.");
      //   setMessageColor("text-red-600");
      //   return;
      // }

      // setMessage(
      //   "Rezervácia bola úspešne vytvorená, na mail vám bolo zaslané potvrdenie"
      // );
      // setMessageColor("text-[var(--color-primary)]");

      // setSuccess(true);

      // // Optionally reset form
      // setFormData({
      //   selectedTime: "",
      //   accommodation: "",
      //   note: "",
      //   problems: "",
      //   trainingRequirements: "",
      //   note: "",
      // });
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
            {/* Close button that calls onClose */}
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
          <div className="mb-6 border-b border-[var(--color-secondary)] pb-3 text-center">
            <h2 className="text-xl font-bold mb-1">Rezervácia</h2>

            <div>
              <strong> {serviceName}</strong>
            </div>
            <div>
              <strong style={{ marginRight: "5px" }}>Od:</strong>
              <strong>{startDate}</strong>
            </div>
            <div>
              <strong style={{ marginRight: "5px" }}>Do:</strong>
              <strong>{endDate}</strong>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {/* Custom Time Dropdown */}
            <CustomDropdown
              label="Vyberte čas odovzdania psa"
              value={formData.selectedTime}
              options={availableTimes.flatMap((time) =>
                generateTimeOptions(time.from, time.to),
              )}
              onSelect={(selected) =>
                setFormData((prev) => ({ ...prev, selectedTime: selected }))
              }
            />

            {/* Client & Dog Forms */}
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
              hasError={message && !formData.accommodation} // show red border if empty after submit
            />

            {/* Note */}
            <div className="flex flex-col gap-1 shadow-xl bg-white p-6 rounded-2xl">
              <label className="font-semibold text-md">Problémy psa</label>
              <textarea
                value={formData.problems}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    problems: e.target.value,
                  }))
                }
                className={`border p-2 rounded-xl bg-white w-full resize-none ${
                  formData.problems.trim() === "" && message
                    ? "border-red-500"
                    : "border-[var(--color-tertiary)]"
                }`}
              />
              {formData.problems.trim() === "" && message && (
                <p className="text-red-500 text-sm">Pole je povinné</p>
              )}
            </div>

            {/* Training Requirements */}
            <div className="flex flex-col gap-1 shadow-xl bg-white p-6 rounded-2xl">
              <label className="font-semibold text-md">
                Požiadavky na výcvik
              </label>
              <textarea
                value={formData.trainingRequirements}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    trainingRequirements: e.target.value,
                  }))
                }
                className={`border p-2 rounded-xl bg-white w-full resize-none ${
                  formData.trainingRequirements.trim() === "" && message
                    ? "border-red-500"
                    : "border-[var(--color-tertiary)]"
                }`}
              />
              {formData.trainingRequirements.trim() === "" && message && (
                <p className="text-red-500 text-sm">Pole je povinné</p>
              )}
            </div>

            {/* Special Requirements */}
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

            <div className="flex flex-col gap-1 shadow-xl bg-white p-6 rounded-2xl font-bold">
              {accomodationPrice > 0 ? (
                <div>
                  <div className="text-xl">Cena:</div>
                  <div className="text-right flex flex-col flex-1">
                    <div className="font-normal">
                      {formData.accommodation}: {accomodationPrice.toFixed(2)}€
                    </div>
                    <div className="font-normal">
                      {serviceName}: {parseFloat(price).toFixed(2)}€
                    </div>
                    Spolu: {(parseFloat(price) + accomodationPrice).toFixed(2)}€
                  </div>
                </div>
              ) : (
                <div>
                  {" "}
                  Cena: {(parseFloat(price) + accomodationPrice).toFixed(2)}€
                </div>
              )}
            </div>
            {message && !success && (
              <p className={`mt-2 font-semibold ${messageColor} text-center`}>
                {message}
              </p>
            )}
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className={`w-full p-3 rounded-2xl flex items-center justify-center gap-2
    bg-[var(--color-tertiary)] text-white
    ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              {isLoading && (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              )}
              <span>{isLoading ? "Odosielam..." : "Odoslať"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default LongTermEventForm;
