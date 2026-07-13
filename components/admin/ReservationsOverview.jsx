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
  const [statusFilter, setStatusFilter] = useState("all");
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
  const getReservationStatus = (reservation) => {
    const now = new Date();
    const start = new Date(reservation.start_date);
    const end = new Date(reservation.end_date || reservation.start_date);

    if (Number.isNaN(start.getTime())) return "active";
    if (start > now) return "future";
    if (!Number.isNaN(end.getTime()) && end < now) return "ended";
    return "active";
  };


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
      .filter(
        (r) => statusFilter === "all" || getReservationStatus(r) === statusFilter,
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
    [reservations, search, sortOrder, statusFilter],
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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <input
          type="text"
          placeholder="Vyhľadávanie..."
          className="border border-gray-500 px-4 py-2 w-full md:w-1/2 rounded-xl"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="flex flex-col gap-3 sm:flex-row">
          <select
            className="border rounded-xl px-4 py-2 border-gray-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Všetky statusy</option>
            <option value="active">Aktívne</option>
            <option value="future">Budúce</option>
            <option value="ended">Ukončené</option>
          </select>

          <select
            className="border rounded-xl px-4 py-2 border-gray-500"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="newest">Najnovšie</option>
            <option value="oldest">Najstaršie</option>
          </select>
        </div>
      </div>


      {/* Long-term reservations */}
      <ReservationList
        title={title}
        reservations={filteredReservations}
        onClick={openModal}
        dateLabel={range ? "Obdobie" : "Termín"}
        range={range}
        getReservationStatus={getReservationStatus}
      />

      {/* Modal */}
      {modalVisible && selectedReservation && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50"
          onClick={closeModal}
        >
          <div
            className="relative h-screen w-full max-w-4xl overflow-y-auto rounded-none bg-white shadow-2xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={closeModal}
              className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full text-xl font-bold text-gray-500 transition hover:bg-slate-100 hover:text-black"
              aria-label="Close modal"
            >
              ×
            </button>
            <div className="flex-1 overflow-y-auto p-5 sm:p-6">
              <ReservationDetail
                reservationProps={selectedReservation}
                onReservationUpdate={(updatedReservation) => {
                  setSelectedReservation((prev) => ({
                    ...prev,
                    ...updatedReservation,
                  }));
                  setReservations((prev) =>
                    prev.map((r) =>
                      r.reservation_id === selectedReservation.reservation_id
                        ? { ...r, ...updatedReservation }
                        : r,
                    ),
                  );
                }}
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
