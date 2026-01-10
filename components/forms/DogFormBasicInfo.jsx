"use client";
import { useState, forwardRef, useImperativeHandle } from "react";

export const DogFormBasicInfo = forwardRef(({}, ref) => {
  const [dog, setDog] = useState({ name: "", breed: "", age: "" });
  const [errors, setErrors] = useState({});

  const labels = { name: "Meno psa", breed: "Plemeno", age: "Vek" };
  const sanitize = (value) => value.replace(/[-'";\\]/g, "");

  const handleChange = (e) => {
    const sanitizedValue = sanitize(e.target.value);
    const updated = { ...dog, [e.target.name]: sanitizedValue };
    setDog(updated);
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    Object.keys(dog).forEach((key) => {
      if (!dog[key].trim()) newErrors[key] = "Pole je povinné";
      if (/['";\\]/.test(dog[key])) newErrors[key] = "Nepovolené znaky";
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useImperativeHandle(ref, () => ({
    isValid: validate,
    getData: () => dog,
  }));

  return (
    <div className="p-6 rounded-2xl shadow-xl bg-white text-black space-y-4">
      <h2 className="text-xl font-bold">Údaje o psovi</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.keys(dog).map((key) => (
          <div key={key} className="flex flex-col gap-1">
            <label className="font-semibold text-sm">{labels[key]}</label>
            <input
              name={key}
              value={dog[key]}
              onChange={handleChange}
              className={`p-2 rounded-xl bg-white border ${
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
