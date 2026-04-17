"use client";

import { useEffect, useMemo, useState } from "react";
import Loading from "../Loading";
import ReservationList from "./ReservationList";

export default function CanceledReservationsOverview({
  title = "Zrušené rezervácie",
}) {
  const [search, setSearch] = useState("");
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState("newest");
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          "https://www.psiaskola.sk/wp-json/moje-auto/v1/canceled-reservations",
        );
        const data = await response.json();

        // Mapovanie pre ReservationList tak, aby v riadku boli len požadované info
        const mappedData = data.map((item) => ({
          ...item,
          reservation_id: item.id,
          event_name: item.service_name,
          // Do email poľa v zozname môžeme v prípade potreby podstrčiť formátovanie
          // ale ReservationList by mal natívne brať .email a .first_name/.last_name
        }));

        setReservations(mappedData);
      } catch (err) {
        console.error("Chyba pri načítaní dát:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const normalize = (v) =>
    String(v ?? "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "");

  const filteredReservations = useMemo(() => {
    return [...reservations]
      .filter((r) =>
        [r.event_name, r.first_name, r.last_name, r.email].some((v) =>
          normalize(v).includes(normalize(search)),
        ),
      )
      .sort((a, b) => (sortOrder === "newest" ? b.id - a.id : a.id - b.id));
  }, [reservations, search, sortOrder]);

  const openModal = (item) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedItem(null);
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-8 p-4">
      {/* Ovládacie prvky */}
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <input
          type="text"
          placeholder="Vyhľadávanie..."
          className="border border-gray-500 px-4 py-2 w-full md:w-1/2 rounded-xl outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="border rounded-xl px-4 py-2 border-gray-500 bg-white outline-none cursor-pointer"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
        >
          <option value="newest">Najnovšie</option>
          <option value="oldest">Najstaršie</option>
        </select>
      </div>

      {/* Zoznam - ReservationList zobrazí service_name, meno a email */}
      <ReservationList
        title={title}
        reservations={filteredReservations}
        onClick={openModal}
      />

      {/* Modal Detail */}
      {modalVisible && selectedItem && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-black text-xl font-bold"
            >
              ✕
            </button>

            <div className="p-8">
              <h2 className="text-2xl font-bold mb-6 border-b pb-4 text-gray-800">
                Detail rezervácie
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                    Klient
                  </label>
                  <p className="text-lg font-medium text-gray-900">
                    {selectedItem.first_name} {selectedItem.last_name}
                  </p>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                    Služba
                  </label>
                  <p className="text-lg font-medium text-gray-900">
                    {selectedItem.service_name}
                  </p>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                    Email
                  </label>
                  <p className="text-lg text-gray-900">{selectedItem.email}</p>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                    Telefón
                  </label>
                  <p className="text-lg text-gray-900 font-mono">
                    {selectedItem.phone_number || "-"}
                  </p>
                </div>
              </div>

              <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400 font-bold uppercase text-[10px]">
                    Adresa
                  </span>
                  <span className="text-gray-700 text-right">
                    {selectedItem.street}, {selectedItem.zip}{" "}
                    {selectedItem.city}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400 font-bold uppercase text-[10px]">
                    Pôvodný termín
                  </span>
                  <span className="text-gray-900 font-medium">
                    {selectedItem.service_start} — {selectedItem.service_end}
                  </span>
                </div>
                <div className="flex justify-between text-sm border-t border-gray-200 pt-3">
                  <span className="text-gray-400 font-bold uppercase text-[10px]">
                    ID záznamu
                  </span>
                  <span className="text-gray-500 font-mono">
                    #{selectedItem.id}
                  </span>
                </div>
              </div>

              <button
                onClick={closeModal}
                className="mt-8 w-full py-3 bg-gray-800 text-white rounded-xl font-bold hover:bg-black transition-all active:scale-[0.98]"
              >
                Zavrieť detail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
