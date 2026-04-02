"use client";
import React, { useState } from "react";

const InvoiceToggle = ({ onChange }) => {
  const [isInvoiceRequested, setIsInvoiceRequested] = useState(false);

  const handleToggle = () => {
    const newValue = !isInvoiceRequested;
    setIsInvoiceRequested(newValue);

    if (onChange) {
      onChange(newValue);
    }
  };

  // Styles mapped to your color logic
  const activeStyle = {
    borderColor: "var(--color-tertiary)",
    backgroundColor: "rgba(var(--color-tertiary-rgb), 0.05)", // Subtle tint if RGB variable exists
  };

  const inactiveStyle = {
    borderColor: "var(--color-primary)",
    backgroundColor: "transparent",
  };

  return (
    <div
      onClick={handleToggle}
      style={isInvoiceRequested ? activeStyle : inactiveStyle}
      className="flex items-center justify-between p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 ease-in-out shadow-sm hover:shadow-md"
    >
      <div className="flex flex-col">
        <span
          className="font-bold text-lg transition-colors duration-300"
          style={{
            color: isInvoiceRequested
              ? "var(--color-tertiary)"
              : "var(--color-primary)",
          }}
        >
          Vytvoriť rezerváciu s faktúrou
        </span>
        <p className="text-sm opacity-60 font-medium">
          {isInvoiceRequested
            ? "Faktúra bude odoslaná"
            : "Faktúra nebude odoslaná"}
        </p>
      </div>

      {/* Toggle Switch */}
      <div
        className="w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300"
        style={{
          backgroundColor: isInvoiceRequested
            ? "var(--color-tertiary)"
            : "#e5e7eb", // Light gray for "off"
        }}
      >
        <div
          className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${
            isInvoiceRequested ? "translate-x-6" : "translate-x-0"
          }`}
        />
      </div>
    </div>
  );
};

export default InvoiceToggle;
