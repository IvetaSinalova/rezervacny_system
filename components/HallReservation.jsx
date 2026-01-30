"use client";
import React, { useEffect, useState, useRef } from "react";
import { sk } from "date-fns/locale";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import Loading from "./Loading";

import { ClientForm } from "./forms/ClientForm";
import "react-time-picker/dist/TimePicker.css";
import "../styles/EventCalendar.css";

function HallReservation() {
  const [disabledDays, setDisabledDays] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [dataSent, setDataSent] = useState(false);
  const [hourPrice, setHourPrice] = useState(0);
  const [formData, setFormData] = useState({
    date: "",
    startTime: "",
    hours: 1,
    totalPrice: 0,
    note: "",
  });
  const [message, setMessage] = useState("");
  const [messageColor, setMessageColor] = useState("text-red-600");
  const [success, setSuccess] = useState(false);
  const [submitClicked, setSubmitClicked] = useState(false);
  const [loading, setLoading] = useState(false);
  const clientRef = useRef();

  /* Fetch disabled days + price */
  useEffect(() => {
    setLoading(true);
    fetch("https://psiaskola.sk/wp-json/events/v1/hall-reservation-info")
      .then((res) => res.json())
      .then((data) => {
        const disabledDays = Object.values(data.disabled_days);

        setDisabledDays(disabledDays.map((d) => new Date(d)));
        setFormData((prev) => ({
          ...prev,
          totalPrice: data.price,
        }));

        setHourPrice(data.price);
        setLoading(false);
      })
      .catch((error) => {
        console.log(error);
        console.error;
        setLoading(false);
      });
  }, []);

  /* Calculate total price */
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      totalPrice: prev.hours * hourPrice,
    }));
  }, [formData.hours]);

  function formatDateToDDMMYYYY(date) {
    if (!date) return "";

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}.${month}.${year}`;
  }

  const pickDay = (day) => {
    setSelectedDay(day);
    setModalOpen(true);

    setFormData((prev) => ({
      ...prev,
      date: formatDateToDDMMYYYY(day),
    }));
  };

  const handleSubmit = () => {
    setSubmitClicked(true);
    //setDataSent(true);
    setMessage("");
    const clientOk = clientRef.current.isValid();
    if (!clientOk || formData.startTime == "") {
      setMessage("Prosím, skontrolujte všetky polia. Niektoré údaje chýbajú.");
      setDataSent(false);
      setMessageColor("text-red-600");
      return;
    }
    const payload = {
      client: clientRef.current.getData(), // all client fields
      formData: formData,
    };

    fetch(
      "https://www.psiaskola.sk/wp-json/events/v1/create-hall-reservation",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setMessage(
            "Rezervácia bola úspešne vytvorená, na mail vám bolo zaslané potvrdenie",
          );
          setMessageColor("text-[var(--color-primary)]");

          setSuccess(true);
          setSubmitClicked();
        } else {
          console.error("Error:", data);
          alert("Chyba pri vytváraní rezervácie.");
        }
      })
      .catch((err) => {
        console.error("Request failed:", err);
        alert("Chyba pri komunikácii so serverom.");
      });

    setSubmitClicked(false);
  };

  const hideModal = () => {
    setModalOpen(false);
    setSelectedDay(null);
    setFormData({
      date: "",
      startTime: "",
      hours: 1,
      totalPrice: 0,
      note: "",
    });
    setSubmitClicked(false);
    setSuccess(false);
  };

  if (loading)
    return (
      <div className="w-screen h-screen">
        <Loading />
      </div>
    );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          fontSize: "30px",
          padding: "10px 0px",
          fontWeight: "bold",
          color: "var(--color-primary)",
        }}
      >
        Rezervácia haly
      </div>
      {/* CALENDAR */}

      <DayPicker
        mode="single"
        numberOfMonths={2}
        locale={sk}
        disabled={disabledDays}
        selected={selectedDay}
        onSelect={(day) => pickDay(day)}
        modifiersStyles={{
          today: {
            backgroundColor: "#e0dbd5",
            color: "black",
            borderRadius: "50%",
          },
          selected: {
            backgroundColor: "var(--color-tertiary)",
            color: "#fff",
            borderRadius: "50%",
          },
        }}
      />

      {/* MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          {success && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
              <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center relative">
                <p className={`font-semibold text-xl ${messageColor}`}>
                  {message}
                </p>

                <button
                  onClick={hideModal}
                  className="mt-4 px-6 py-2 bg-[var(--color-tertiary)] text-white rounded-2xl hover:opacity-90 transition"
                >
                  Zavrieť
                </button>
              </div>
            </div>
          )}
          {!success && (
            <div className="relative bg-white w-full max-w-3xl h-screen overflow-y-auto rounded-none shadow-2xl p-8">
              {/* CLOSE BUTTON */}
              <button
                onClick={hideModal}
                className="absolute top-3 right-3 w-10 h-10 flex items-center justify-center rounded-full border border-[var(--color-secondary)] text-[var(--color-secondary)] text-2xl hover:bg-[var(--color-secondary)] hover:text-white transition-all"
              >
                ×
              </button>
              <div className="mb-6 border-b border-[var(--color-secondary)] pb-3 text-center">
                <h2 className="text-xl font-bold mb-1">Rezervácia haly</h2>
                <div className="font-bold text-lg">{formData.date}</div>
              </div>

              {/* FORM CONTENT */}
              <div className="flex flex-col gap-6">
                {/* START TIME */}
                <div className="flex flex-col gap-2 p-6 bg-white rounded-2xl shadow">
                  <label className="font-semibold text-sm">
                    Začiatok rezervácie
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        startTime: e.target.value,
                      }))
                    }
                    className={`w-full border rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-tertiary)] ${
                      formData.startTime == "" &&
                      submitClicked &&
                      "border-red-500"
                    }`}
                  />
                  {formData.startTime == "" && submitClicked && (
                    <div className="text-red-500">Pole je povinné</div>
                  )}
                </div>

                {/* HOURS */}
                <div className="flex flex-col gap-2 p-6 bg-white rounded-2xl shadow">
                  <label className="font-semibold text-sm">Počet hodín</label>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={formData.hours}
                    onWheel={(e) => e.target.blur()}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        hours: Number(e.target.value),
                      }))
                    }
                    className="w-full border  rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-tertiary)]"
                  />
                </div>

                {/* CLIENT FORM */}

                <ClientForm ref={clientRef} />

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

                {/* PRICE */}
                <div className="flex justify-between items-center p-6 bg-white rounded-2xl shadow font-bold text-lg">
                  <span>Cena:</span>
                  <span className="text-2xl">
                    {formData.hours * hourPrice} €
                  </span>
                </div>

                {/* SUBMIT BUTTON (OPTIONAL) */}
                <button
                  onClick={handleSubmit}
                  disabled={dataSent}
                  className={`w-full p-3 rounded-2xl flex items-center justify-center gap-2
              bg-[var(--color-tertiary)] text-white
              ${dataSent ? "opacity-70 cursor-not-allowed" : ""}`}
                >
                  {dataSent && (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  <span>{dataSent ? "Odosielam..." : "Odoslať"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default HallReservation;
