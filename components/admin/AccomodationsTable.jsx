"use client";

import React, { useEffect, useState } from "react";
import Loading from "../Loading";

export default function AccommodationsAdmin({ accommodationsProps, loading }) {
  const [accommodations, setAccommodations] = useState(accommodationsProps);
  const [editedAccommodations, setEditedAccommodations] = useState({});

  // Form state for new accommodation
  const [newAccommodation, setNewAccommodation] = useState({
    name: "",
    capacity: "",
    price: "",
  });

  useEffect(() => {
    setAccommodations(accommodationsProps);
  }, [accommodationsProps]);

  const handleFieldChange = (id, field, value) => {
    setEditedAccommodations((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
    setAccommodations((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  // CREATE
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(
        "https://psiaskola.sk/wp-json/events/v1/create-accomodation",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newAccommodation),
        }
      );
      const created = await res.json();
      if (created.id) {
        setAccommodations((prev) => [...prev, newAccommodation]);
        setNewAccommodation({ name: "", capacity: "", price: "" });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // UPDATE
  const handleSaveChanges = async () => {
    const updates = Object.keys(editedAccommodations).map((id) => ({
      id,
      ...editedAccommodations[id],
    }));

    if (updates.length === 0) return; // nothing to update
    try {
      const res = await fetch(
        "https://psiaskola.sk/wp-json/events/v1/update-accomodations",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(accommodations),
        }
      );

      const data = await res.json();
      if (data.success) {
        alert(`Všetky zmeny boli uložené! (${data.updated} položiek)`);
        setEditedAccommodations({});
      } else {
        alert("Chyba pri ukladaní zmien!");
      }
    } catch (err) {
      console.error(err);
      alert("Chyba pri ukladaní zmien!");
    }
  };

  // DELETE
  const handleDelete = async (id) => {
    if (!confirm("Naozaj chcete vymazať túto položku?")) return;
    try {
      await fetch(
        "https://psiaskola.sk/wp-json/events/v1/delete-accomodation",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        }
      );
      setAccommodations((prev) => prev.filter((item) => item.id !== id));
      setEditedAccommodations((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <Loading />;

  return (
    <div style={{ padding: "1rem" }}>
      <h2
        style={{
          color: "var(--color-primary)",
          marginBottom: "1rem",
          fontSize: "18px",
          textAlign: "center",
          fontWeight: "bold",
        }}
      >
        Spravovať ubytovanie
      </h2>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead
            style={{
              backgroundColor: "var(--color-secondary)",
              color: "white",
            }}
          >
            <tr>
              <th
                style={{
                  padding: "0.5rem",
                  border: "1px solid var(--color-secondary)",
                }}
              >
                Názov
              </th>
              <th
                style={{
                  padding: "0.5rem",
                  border: "1px solid var(--color-secondary)",
                }}
              >
                Kapacita
              </th>
              <th
                style={{
                  padding: "0.5rem",
                  border: "1px solid var(--color-secondary)",
                }}
              >
                Cena
              </th>
              <th
                style={{
                  padding: "0.5rem",
                  border: "1px solid var(--color-secondary)",
                }}
              ></th>
            </tr>
          </thead>
          <tbody>
            {accommodations.map((item) => (
              <tr key={item.id}>
                <td
                  style={{
                    padding: "0.5rem",
                    border: "1px solid var(--color-secondary)",
                  }}
                >
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) =>
                      handleFieldChange(item.id, "name", e.target.value)
                    }
                    style={{
                      width: "100%",
                      border: "none",
                      background: "transparent",
                      padding: "10px",
                    }}
                  />
                </td>
                <td
                  style={{
                    padding: "0.5rem",
                    border: "1px solid var(--color-secondary)",
                  }}
                >
                  <input
                    type="number"
                    value={item.capacity}
                    onChange={(e) =>
                      handleFieldChange(item.id, "capacity", e.target.value)
                    }
                    style={{
                      width: "100%",
                      border: "none",
                      background: "transparent",
                      padding: "10px",
                    }}
                  />
                </td>
                <td
                  style={{
                    padding: "0.5rem",
                    border: "1px solid var(--color-secondary)",
                  }}
                >
                  <input
                    type="number"
                    step="0.01"
                    value={item.price}
                    onChange={(e) =>
                      handleFieldChange(item.id, "price", e.target.value)
                    }
                    style={{
                      width: "100%",
                      border: "none",
                      background: "transparent",
                      padding: "10px",
                    }}
                  />
                </td>
                <td
                  style={{
                    border: "1px solid var(--color-secondary)",
                    textAlign: "center",
                  }}
                >
                  <button
                    type="button"
                    style={{
                      background: "#c0392b",
                      color: "#fff",
                      padding: "0.5rem",
                      cursor: "pointer",
                    }}
                  >
                    X
                  </button>
                </td>
              </tr>
            ))}

            {/* Row for creating new accommodation */}
            <tr>
              <td
                style={{
                  padding: "0.5rem",
                  border: "1px solid var(--color-secondary)",
                }}
              >
                <input
                  type="text"
                  placeholder="Meno"
                  value={newAccommodation.name}
                  onChange={(e) =>
                    setNewAccommodation((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  style={{ width: "100%", padding: "10px" }}
                />
              </td>
              <td
                style={{
                  padding: "0.5rem",
                  border: "1px solid var(--color-secondary)",
                }}
              >
                <input
                  type="number"
                  placeholder="Kapacita"
                  value={newAccommodation.capacity}
                  onChange={(e) =>
                    setNewAccommodation((prev) => ({
                      ...prev,
                      capacity: e.target.value,
                    }))
                  }
                  style={{ width: "100%", padding: "10px" }}
                />
              </td>
              <td
                style={{
                  padding: "0.5rem",
                  border: "1px solid var(--color-secondary)",
                }}
              >
                <input
                  type="number"
                  step="0.01"
                  placeholder="Cena"
                  value={newAccommodation.price}
                  onChange={(e) =>
                    setNewAccommodation((prev) => ({
                      ...prev,
                      price: e.target.value,
                    }))
                  }
                  style={{ width: "100%", padding: "10px" }}
                />
              </td>
              <td
                style={{
                  padding: "0.5rem",
                  border: "1px solid var(--color-secondary)",
                  textAlign: "center",
                }}
              >
                <button
                  onClick={handleCreate}
                  style={{
                    backgroundColor: "var(--color-primary)",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    padding: "0.25rem 0.5rem",
                    cursor: "pointer",
                  }}
                >
                  Pridať
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <button
        onClick={handleSaveChanges}
        style={{
          marginTop: "1rem",
          backgroundColor: "var(--color-primary)",
          color: "white",
          padding: "0.5rem 1rem",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        Uložiť zmeny
      </button>
    </div>
  );
}
