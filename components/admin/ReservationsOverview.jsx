"use client";

import { useEffect, useMemo, useState } from "react";
import ReservationDetail from "./ReservationDetail";
import ReservationList from "./ReservationList";

export default function ReservationsOverview({
  reservationsProps = [],
  title = "",
  range,
}) {
  const [search, setSearch] = useState("");
  const [reservations, setReservations] = useState(reservationsProps);
  const [sortOrder, setSortOrder] = useState("newest");
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    setReservations(reservationsProps);
  }, [reservationsProps]);

  // Normalize string for search (diacritics-safe)
  const normalize = (v) =>
    String(v ?? "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "");

  // Filter + sort helper
  // Filter + sort helper
  const filterAndSort = (data) => {
    return [...data]
      .filter((r) =>
        [
          r.event_name,
          r.first_name,
          r.last_name,
          r.email,
          r.phone_number,
          r.dog_name,
        ].some((v) => normalize(v).includes(normalize(search))),
      )
      .sort((a, b) => {
        if (sortOrder === "newest") {
          return new Date(b.created_at) - new Date(a.created_at); // newest created first
        } else {
          return new Date(a.created_at) - new Date(b.created_at); // oldest created first
        }
      });
  };

  // Memoized data
  const filteredReservations = useMemo(
    () => filterAndSort(reservations),
    [reservations, search, sortOrder],
  );

  // Open modal
  const openModal = (reservation) => {
    setSelectedReservation(reservation);
    setModalVisible(true);
  };

  // Close modal
  const closeModal = () => {
    setModalVisible(false);
    setSelectedReservation(null);
  };

  return (
    <div className="space-y-8">
      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <input
          type="text"
          placeholder="Vyhľadávanie..."
          className="border border-gray-500 px-4 py-2 w-full md:w-1/2 rounded-xl"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="border rounded-xl px-4 py-2 border-gray-500"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
        >
          <option value="newest">Najnovšie</option>
          <option value="oldest">Najstaršie</option>
        </select>
      </div>

      {/* Long-term reservations */}
      <ReservationList
        title={title}
        reservations={filteredReservations}
        onClick={openModal}
        dateLabel={range ? "Obdobie" : "Termín"}
        range={range}
      />

      {/* Modal */}
      {modalVisible && selectedReservation && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-4xl w-full  overflow-y-auto p-6 relative h-screen"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 text-gray-500 hover:text-black text-xl font-bold"
              aria-label="Close modal"
            >
              ✕
            </button>
            <div className="flex-1 overflow-y-auto p-6">
              <ReservationDetail
                reservationProps={selectedReservation}
                onPaymentChange={(attr, value, reservation_id) => {
                  // update parent state
                  setReservations((prev) =>
                    prev.map((r) =>
                      r.reservation_id === selectedReservation.reservation_id
                        ? { ...r, [attr]: value }
                        : r,
                    ),
                  );
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
