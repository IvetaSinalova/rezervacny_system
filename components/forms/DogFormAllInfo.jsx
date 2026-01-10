"use client";
import { useState, useImperativeHandle, forwardRef } from "react";

export const DogFormAllInfo = forwardRef(({}, ref) => {
  const [formData, setFormData] = useState({
    name: "",
    breed: "",
    dateOfBirth: "",
    gender: "",
  });

  const [errors, setErrors] = useState({});

  const labels = {
    name: "Meno",
    breed: "Plemeno",
    dateOfBirth: "Narodený",
    gender: "Pohlavie",
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {};

    Object.keys(formData).forEach((key) => {
      if (!formData[key].trim()) {
        newErrors[key] = "Pole je povinné";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useImperativeHandle(ref, () => ({
    isValid: validate,
    getData: () => formData,
  }));

  const fieldKeys = ["name", "breed", "dateOfBirth", "gender"];

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="p-6 rounded-2xl shadow-xl bg-white text-black space-y-6">
      <h2 className="text-xl font-bold">Údaje o psovi</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fieldKeys.map((key) => (
          <div key={key} className="flex flex-col gap-1">
            <label className="font-semibold text-sm">{labels[key]}</label>

            <input
              type={key === "dateOfBirth" ? "date" : "text"}
              name={key}
              value={formData[key]}
              onChange={handleChange}
              max={key === "dateOfBirth" ? today : undefined}
              className={`p-2 rounded-xl bg-white border w-full ${
                errors[key]
                  ? "border-red-500"
                  : "border-[var(--color-tertiary)]"
              }`}
            />

            {errors[key] && (
              <p className="text-red-500 text-sm">{errors[key]}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});
