"use client";
import { useRef, useState } from "react";
import { ClientForm } from "./ClientForm";
import { DogFormAllInfo } from "./DogFormAllInfo";

export default function EventForm({
  price,
  maxLessons,
  calendarEventId,
  onClose,
  autofill = false,
}) {
  const clientRef = useRef();
  const dogRef = useRef();
  const [formData, setFormData] = useState({
    note: "",
    trainingRequirements: "",
  });
  const [message, setMessage] = useState("");
  const [messageColor, setMessageColor] = useState("text-red-600");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setMessage("");
    setIsLoading(true);

    const clientOk = clientRef.current.isValid();
    const dogOk = dogRef.current.isValid();
    if (!clientOk || !dogOk || formData.trainingRequirements == "") {
      setMessage(
        "Prosím, skontrolujte všetky polia. Zlé alebo nevyplnené údaje.",
      );
      setMessageColor("text-red-600");
      setIsLoading(false);
      return;
    }

    const payload = {
      eventId: calendarEventId,
      client: clientRef.current.getData(),
      dog: dogRef.current.getData(),
      note: formData.note,
      trainingRequirements: formData.trainingRequirements,
    };

    try {
      const res = await fetch(
        "https://www.psiaskola.sk/wp-json/events/v1/add-event-reservation",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const data = await res.json();
      if (data.success) {
        setMessage(
          "Rezervácia bola úspešne vytvorená, na email vám bolo zaslané potvrdenie",
        );
        setMessageColor("text-[var(--color-primary)]");
        setSuccess(true);
      } else {
        setMessage(data.message || "Nepodarilo sa vytvoriť rezerváciu");
        setMessageColor("text-red-600");
      }
      setIsLoading(false);
    } catch (err) {
      console.error(err);
      setMessage("Chyba servera. Skúste neskôr.");
      setMessageColor("text-red-600");
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Success overlay */}
      {success && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center relative">
            <p className={`font-semibold text-xl ${messageColor}`}>{message}</p>
            {/* Close button that calls onClose */}
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2 bg-[var(--color-tertiary)] text-white rounded-2xl hover:opacity-90 transition"
            >
              Zavrieť
            </button>
          </div>
        </div>
      )}

      {/* Form */}
      {!success && (
        <div className="flex flex-col gap-4">
          <ClientForm ref={clientRef} autofill={autofill} />
          <DogFormAllInfo ref={dogRef} />

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

          <div className="flex flex-col gap-1 shadow-xl bg-white p-6 rounded-2xl">
            <label className="font-semibold text-sm">Poznámka</label>
            <textarea
              value={formData.note}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  note: e.target.value,
                }))
              }
              className="border border-[var(--color-tertiary)] p-2 rounded-xl bg-white"
              placeholder="Napíšte poznámku k rezervácii..."
            />
          </div>
          <div className="flex w-full gap-1 shadow-xl bg-white p-6 rounded-2xl font-bold text-md">
            <div className="text-xl">Cena:</div>

            <div className="text-right flex flex-col flex-1">
              <div className="text-xl">
                {price.toFixed(2).replace(".", ",")}€
              </div>
              <div className="text-lg font-normal">
                Počet lekcií: {maxLessons}
              </div>
            </div>
          </div>
          {/* Inline messages */}
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
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            <span>{isLoading ? "Odosielam..." : "Odoslať"}</span>
          </button>
        </div>
      )}
    </div>
  );
}
