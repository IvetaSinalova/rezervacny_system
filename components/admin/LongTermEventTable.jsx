"use client";
import React, { useState, useEffect } from "react";
import Loading from "../Loading";

export default function LongTermEventTable() {
  const [events, setEvents] = useState([]);
  const [editedEvents, setEditedEvents] = useState({});
  const [newEvent, setNewEvent] = useState({
    name: "",
    price: "",
    fixed_days: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://psiaskola.sk/wp-json/events/v1/long-term-events")
      .then((res) => res.json())
      .then((data) => {
        setEvents(data);
        setLoading(false);
      })
      .catch((error) => {
        console.log(error);
        setLoading(false);
      });
  }, []);

  const handleFieldChange = (id, field, value) => {
    setEditedEvents((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));

    setEvents((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleSaveChanges = async () => {
    setLoading(true);
    const updates = Object.keys(editedEvents).map((id) => ({
      id,
      ...editedEvents[id],
    }));

    if (updates.length === 0) return;
    try {
      const res = await fetch(
        "https://psiaskola.sk/wp-json/events/v1/update-long-term-events",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        }
      );
      const data = await res.json();
      setLoading(false);
      if (data.success) {
        alert(`Všetky zmeny uložené! (${data.updated} položiek)`);
        setEditedEvents({});
      } else alert("Chyba pri ukladaní zmien!");
    } catch (err) {
      setLoading(false);

      console.error(err);
      alert("Chyba pri ukladaní zmien!");
    }
  };

  const handleCreate = async () => {
    try {
      const res = await fetch(
        "https://psiaskola.sk/wp-json/events/v1/create-long-term-event",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newEvent),
        }
      );
      const data = await res.json();
      if (data.id) {
        setEvents((prev) => [...prev, { ...newEvent, id: data.id }]);
        setNewEvent({ name: "", price: "", fixed_days: "" });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Naozaj chcete vymazať túto položku?")) return;
    try {
      await fetch(
        "https://psiaskola.sk/wp-json/events/v1/delete-long-term-event",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        }
      );
      setEvents((prev) => prev.filter((item) => item.id !== id));
      setEditedEvents((prev) => {
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
    <div className="p-4">
      <h2 className="text-center font-bold text-lg mb-4 text-primary">
        Spravovať dlhodobé kurzy a ubytovanie
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
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
                Cena
              </th>
              <th
                style={{
                  padding: "0.5rem",
                  border: "1px solid var(--color-secondary)",
                }}
              >
                Počet dní
              </th>
              {/* <th className="p-2 border border-secondary"></th> */}
            </tr>
          </thead>
          <tbody>
            {events.map((item) => (
              <tr key={item.id}>
                <td className="p-2 border border-secondary">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) =>
                      handleFieldChange(item.id, "name", e.target.value)
                    }
                    className="w-full p-2"
                  />
                </td>
                <td className="p-2 border border-secondary">
                  <input
                    type="number"
                    step="0.01"
                    value={item.price}
                    onChange={(e) =>
                      handleFieldChange(item.id, "price", e.target.value)
                    }
                    className="w-full p-2"
                  />
                </td>
                <td className="p-2 border border-secondary">
                  <input
                    type="number"
                    value={item.fixed_days}
                    onChange={(e) =>
                      handleFieldChange(item.id, "fixed_days", e.target.value)
                    }
                    className="w-full p-2"
                  />
                </td>
                {/* <td className="p-2 border border-secondary text-center">
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="bg-red-600 text-white px-2 py-1 rounded"
                  >
                    X
                  </button>
                </td> */}
              </tr>
            ))}
            {/* <tr>
              <td className="p-2 border border-secondary">
                <input
                  type="text"
                  placeholder="Názov"
                  value={newEvent.name}
                  onChange={(e) =>
                    setNewEvent((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full p-2"
                />
              </td>
              <td className="p-2 border border-secondary">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Cena"
                  value={newEvent.price}
                  onChange={(e) =>
                    setNewEvent((prev) => ({ ...prev, price: e.target.value }))
                  }
                  className="w-full p-2"
                />
              </td>
              <td className="p-2 border border-secondary">
                <input
                  type="number"
                  placeholder="Fixné dni"
                  value={newEvent.fixed_days}
                  onChange={(e) =>
                    setNewEvent((prev) => ({
                      ...prev,
                      fixed_days: e.target.value,
                    }))
                  }
                  className="w-full p-2"
                />
              </td>
              <td className="p-2 border border-secondary text-center">
                <button
                  onClick={handleCreate}
                  className="bg-primary text-white px-2 py-1 rounded"
                >
                  Pridať
                </button>
              </td>
            </tr> */}
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
