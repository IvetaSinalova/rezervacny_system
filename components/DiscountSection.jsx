"use client";
import React, { useEffect, useState } from "react";

const DiscountSection = ({
  cartTotal,
  setReducedSum,
  eventType,
  discountInfo = null,
  serviceId = null,
  serviceName = null,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [status, setStatus] = useState({
    loading: false,
    message: "",
    type: "",
  });

  useEffect(() => {
    if (!discountInfo) {
      setStatus({
        loading: false,
        message: "",
        type: "",
      });
    }
  }, [discountInfo]);

  const handleApplyDiscount = async () => {
    if (!promoCode) return;
    setStatus({ loading: true, message: "", type: "" });

    try {
      const response = await fetch(
        "https://www.psiaskola.sk/wp-json/v1/validate-discount",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: promoCode,
            cartTotal: cartTotal,
            serviceId: serviceId,
            serviceName: serviceName,
            eventType: eventType,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Neplatný kód");
      }

      setReducedSum(data);
      setStatus({
        loading: false,
        message: "Zľava bola úspešne aplikovaná!",
        type: "success",
      });
    } catch (err) {
      setReducedSum(null);
      setStatus({
        loading: false,
        message: err.message,
        type: "error",
      });
    }
  };

  return (
    <div className="flex flex-col gap-1 shadow-xl bg-white p-6 rounded-2xl transition-all duration-300">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className=" hover:opacity-80 font-semibold text-left text-md flex items-center gap-2"
        >
          <span className="text-lg">+</span> Máte zľavový kód?
        </button>
      ) : (
        <div className="space-y-3">
          <label className="font-semibold text-md block">Zľavový kód</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              placeholder="Zadajte kód"
              className="border border-[var(--color-tertiary)] p-2 rounded-xl bg-white w-full outline-none focus:ring-2 focus:ring-[var(--color-tertiary)]/20"
            />
            <button
              onClick={handleApplyDiscount}
              disabled={status.loading || !promoCode}
              className={`px-6 py-2 rounded-xl flex items-center justify-center gap-2 font-semibold
                bg-[var(--color-tertiary)] text-white transition
                ${status.loading || !promoCode ? "opacity-70 cursor-not-allowed" : "hover:opacity-90"}`}
            >
              {status.loading && (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              <span>{status.loading ? "..." : "Použiť"}</span>
            </button>
          </div>

          {status.message && (
            <p
              className={`text-sm font-semibold ${status.type === "success" ? "text-[var(--color-primary)]" : "text-red-600"}`}
            >
              {status.message}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default DiscountSection;
