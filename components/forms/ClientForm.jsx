"use client";
import { useState, forwardRef, useImperativeHandle } from "react";

export const ClientForm = forwardRef(({ autofill }, ref) => {
  const [isLoading, setIsLoading] = useState(false);
  const [client, setClient] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    street: "",
    zip: "",
    city: "",
    country: "",
  });

  const [errors, setErrors] = useState({}); // field-level errors

  const labels = {
    firstName: "Meno",
    lastName: "Priezvisko",
    email: "Email",
    phone: "Telefón",
    street: "Ulica",
    zip: "PSČ",
    city: "Mesto",
    country: "Štát",
  };
  const emailRegex = /^[\w.-]+@[\w.-]+\.[A-Za-z]{2,}$/;
  const sanitize = (value) => value.replace(/[-'";\\]/g, "");

  const handleChange = (e) => {
    const sanitizedValue = sanitize(e.target.value);
    const updated = { ...client, [e.target.name]: sanitizedValue };
    setClient(updated);
    setErrors((prev) => ({ ...prev, [e.target.name]: "" })); // clear error on change

    if (e.target.name == "email" && autofill) {
      if (emailRegex.test(sanitizedValue)) {
        getClientInfo(e.target.value);
      }
    }
  };

  const validate = () => {
    const newErrors = {};

    Object.keys(client).forEach((key) => {
      if (!client[key].trim()) newErrors[key] = "Pole je povinné";
    });

    // Email validation
    const emailRegex = /^[\w.-]+@[\w.-]+\.[A-Za-z]{2,}$/;
    if (client.email && !emailRegex.test(client.email)) {
      newErrors.email = "Neplatný email";
    }

    // Phone validation (numbers, +, - and space only)
    const phoneRegex = /^[-0-9+ ]+$/;
    if (client.phone && !phoneRegex.test(client.phone)) {
      newErrors.phone = "Neplatné telefónne číslo";
    }

    // SQL injection check
    Object.keys(client).forEach((key) => {
      if (/[\"'\\;]/.test(client[key])) {
        newErrors[key] = "Nepovolené znaky";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useImperativeHandle(ref, () => ({
    isValid: validate,
    getData: () => client,
  }));

  const getClientInfo = async (email) => {
    try {
      setIsLoading(true);
      // Note: Replace 'yourdomain.com' with your actual site URL
      // or use a relative path if the React app is hosted on the same domain
      const response = await fetch(
        "https://www.psiaskola.sk/wp-json/events/v1/get-client-info",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        },
      );

      const data = await response.json();
      if (!response.ok) {
        setClient({
          firstName: "",
          lastName: "",
          email: data.email,
          phone: "",
          street: "",
          zip: "",
          city: "",
          country: "",
        });
        // This catches the WP_Error you sent from PHP
        throw new Error(data.message || "Something went wrong");
      }

      setClient({
        firstName: data.first_name,
        lastName: data.last_name,
        email: data.email,
        phone: data.phone_number,
        street: data.street,
        zip: data.zip,
        city: data.city,
        country: data.country,
      });
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 rounded-2xl shadow-xl bg-white text-black space-y-4">
      <h2 className="text-xl font-bold">Údaje o klientovi</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.keys(client).map((key) => (
          <div key={key} className="flex flex-col gap-1">
            <label className="font-semibold text-sm">{labels[key]}</label>
            <input
              name={key}
              value={client[key]}
              onChange={handleChange}
              disabled={isLoading} // Form becomes read-only
              className={`p-2 rounded-xl bg-white border transition-colors ${
                errors[key]
                  ? "border-red-500"
                  : "border-[var(--color-tertiary)]"
              } ${isLoading ? "bg-gray-400 cursor-not-allowed" : ""}`}
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
