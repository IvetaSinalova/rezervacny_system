import { useState } from "react";
import Loading from "../../Loading";

export default function AddEventForm({
  updateLoading,
  loading,
  updateAddedEvent,
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#6f806f");
  const [maxLessons, setMaxLessons] = useState(1);
  const [status, setStatus] = useState("");
  const [price, setPrice] = useState(0); // new state
  const inputStyle = {
    padding: "0.5rem",
    border: "1px solid #ccc",
    borderRadius: "4px",
    flex: 1,
    boxSizing: "border-box",
  };

  const fieldWrapperStyle = {
    display: "flex",
    alignItems: "center",
    marginBottom: "1rem",
  };

  const labelStyle = {
    marginRight: "1rem",
    minWidth: "120px",
    fontWeight: "bold",
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    updateLoading(true);

    const payload = {
      name,
      color,
      max_lessons: parseInt(maxLessons),
      price: parseFloat(price),
    };

    try {
      const res = await fetch(
        "https://psiaskola.sk/wp-json/events/v1/add-event-type",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (data.success) {
        setStatus("Udalosť bola úspešne pridaná!");
        setName("");
        setColor("#6f806f");
        setMaxLessons(1);
        updateAddedEvent(true);
        updateLoading(false);
      } else {
        setStatus("Chyba: " + (data.message || "Neznáma chyba"));
        updateLoading(false);
      }
    } catch (err) {
      console.error(err);
      setStatus("Chyba pri odosielaní požiadavky");
      updateLoading(false);
    }
  };

  return (
    <div>
      {!loading && (
        <form
          onSubmit={handleSubmit}
          style={{ maxWidth: "500px", margin: "1rem" }}
        >
          <div style={fieldWrapperStyle}>
            <label style={labelStyle}>Názov:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={inputStyle}
            />
          </div>

          <div style={fieldWrapperStyle}>
            <label style={labelStyle}>Farba:</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              style={{ flex: 1, height: "2.5rem", border: "none", padding: 0 }}
            />
          </div>

          <div style={fieldWrapperStyle}>
            <label style={labelStyle}>Max počet lekcií:</label>
            <input
              type="number"
              value={maxLessons}
              onChange={(e) => setMaxLessons(e.target.value)}
              min={1}
              required
              style={inputStyle}
            />
          </div>
          <div style={fieldWrapperStyle}>
            <label style={labelStyle}>Cena:</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              min={0}
              required
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            style={{
              padding: "0.75rem 1.5rem",
              background: "#302D23",
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
          >
            Pridať udalosť
          </button>

          {status && <p style={{ marginTop: "1rem" }}>{status}</p>}
        </form>
      )}
    </div>
  );
}
