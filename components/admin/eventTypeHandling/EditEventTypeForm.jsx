import { useState, useEffect } from "react";

export default function EditEventTypeForm({
  eventTypes,
  updateLoading,
  loading,
  addedEvent,
}) {
  const [events, setEvents] = useState(eventTypes);
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetch("https://psiaskola.sk/wp-json/events/v1/all-types-events-admin")
      .then((res) => res.json())
      .then((data) => {
        setEvents(data);
        updateLoading(false);
      })
      .catch((err) => {
        console.error(err);
        updateLoading(false);
      });
  }, [addedEvent]);

  const handleChange = (id, field, value) => {
    setEvents((prev) =>
      prev.map((event) =>
        event.id === id ? { ...event, [field]: value } : event
      )
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    updateLoading(true);
    try {
      const res = await fetch(
        "https://psiaskola.sk/wp-json/events/v1/update-types-events",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ events }),
        }
      );

      const data = await res.json();
      if (data.success) {
        updateLoading(false);

        setStatus("Udalosti boli úspešne aktualizované!");
      } else {
        updateLoading(false);
        setStatus("Chyba: " + (data.message || "Neznáma chyba"));
      }
    } catch (err) {
      console.error(err);
      setStatus("Chyba pri odosielaní požiadavky");
    }
  };

  return (
    <div>
      {!loading && (
        <form
          onSubmit={handleSubmit}
          style={{ maxWidth: "800px", margin: "1rem" }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ border: "1px solid #ccc", padding: "0.5rem" }}>
                  Názov
                </th>
                <th style={{ border: "1px solid #ccc", padding: "0.5rem" }}>
                  Farba
                </th>
                <th style={{ border: "1px solid #ccc", padding: "0.5rem" }}>
                  Cena
                </th>
                <th style={{ border: "1px solid #ccc", padding: "0.5rem" }}>
                  Max počet lekcií
                </th>
                <th
                  style={{ border: "1px solid #ccc", padding: "0.5rem" }}
                ></th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id}>
                  <td style={{ border: "1px solid #ccc", padding: "0.5rem" }}>
                    <input
                      type="text"
                      value={event.name}
                      onChange={(e) =>
                        handleChange(event.id, "name", e.target.value)
                      }
                      style={{ width: "100%" }}
                    />
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "0.5rem" }}>
                    <input
                      type="color"
                      value={event.color}
                      onChange={(e) =>
                        handleChange(event.id, "color", e.target.value)
                      }
                      style={{ width: "100%", border: "none", height: "2rem" }}
                    />
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "0.5rem" }}>
                    <input
                      type="number"
                      value={event.price}
                      onChange={(e) =>
                        handleChange(event.id, "price", e.target.value)
                      }
                      style={{ width: "100%" }}
                    />
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "0.5rem" }}>
                    <input
                      type="number"
                      value={event.maxLessons}
                      onChange={(e) =>
                        handleChange(event.id, "maxLessons", e.target.value)
                      }
                      style={{ width: "100%" }}
                    />
                  </td>
                  <td
                    style={{
                      border: "1px solid #ccc",
                      padding: "0.5rem",
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
                      onClick={async () => {
                        updateLoading(true);
                        if (
                          !confirm(
                            "Naozaj chcete odstrániť túto udalosť? Odstránite tým aj všetky výskyty udalosti v kalendári."
                          )
                        )
                          return;

                        try {
                          const res = await fetch(
                            "https://psiaskola.sk/wp-json/events/v1/delete-event",
                            {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ id: event.id }),
                            }
                          );
                          const data = await res.json();
                          if (data.success) {
                            setEvents((prev) =>
                              prev.filter((e) => e.id !== event.id)
                            );
                            setStatus("Udalosť bola úspešne odstránená");
                            updateLoading(false);
                          } else {
                            setStatus(
                              "Chyba: " + (data.message || "Neznáma chyba")
                            );
                            updateLoading(false);
                          }
                        } catch (err) {
                          console.error(err);
                          setStatus("Chyba pri odstraňovaní udalosti");
                        }
                      }}
                    >
                      X
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            type="submit"
            style={{
              marginTop: "1rem",
              padding: "0.75rem 1.5rem",
              background: "#302D23",
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
          >
            Aktualizovať udalosti
          </button>

          {status && <p style={{ marginTop: "1rem" }}>{status}</p>}
        </form>
      )}
    </div>
  );
}
