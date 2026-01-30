"use client";
import React, { useState } from "react";
import "../../styles/PaymentSelector.css";

const PaymentForm = () => {
  const [selectedMethod, setSelectedMethod] = useState("kartou");

  const handleChange = (event) => {
    setSelectedMethod(event.target.value);
  };

  return (
    <div className="p-6 rounded-2xl shadow-xl bg-white text-black space-y-4">
      {/* Container with flex-col to keep Title on top and Options below */}
      <div className="flex flex-col gap-3">
        <h2 className="text-md font-bold">Platba</h2>

        {/* Row container aligned to the right */}
        <div className="payment-container flex flex-wrap gap-3">
          <label
            className={`payment-option whitespace-nowrap ${
              selectedMethod === "kartou" ? "active" : ""
            }`}
          >
            <input
              type="radio"
              name="payment"
              value="kartou"
              checked={selectedMethod === "kartou"}
              onChange={handleChange}
            />
            <span className="custom-radio"></span>
            Kartou
          </label>

          <label
            className={`payment-option whitespace-nowrap ${
              selectedMethod === "prevodom" ? "active" : ""
            }`}
          >
            <input
              type="radio"
              name="payment"
              value="prevodom"
              checked={selectedMethod === "prevodom"}
              onChange={handleChange}
            />
            <span className="custom-radio"></span>
            Prevodom na účet
          </label>
        </div>
      </div>
    </div>
  );
};

export default PaymentForm;
