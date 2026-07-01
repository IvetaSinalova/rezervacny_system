"use client";

import { useEffect, useMemo, useState } from "react";
import Loading from "../Loading";
import ReservationList from "./ReservationList";

function MetaRow({ label, value }) {
  if (!value) return null;

  return (
    <div className="grid grid-cols-1 gap-1 border-t border-slate-200 py-3 first:border-t-0 first:pt-0 last:pb-0 sm:grid-cols-[190px_1fr] sm:gap-4">
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
        {label}
      </span>
      <span
        className="text-left text-sm text-slate-700 sm:text-right sm:text-[15px]"
      >
        {value}
      </span>
    </div>
  );
}

function InfoField({ label, value, strong = false }) {
  if (!value) return null;

  return (
    <div className="border-b border-slate-200 py-3 last:border-b-0">
      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
        {label}
      </div>
      <div
        className={`mt-1 break-words text-sm leading-6 sm:text-[15px] ${strong ? "font-semibold text-slate-900" : "text-slate-700"}`}
      >
        {value}
      </div>
    </div>
  );
}

export default function CanceledReservationsOverview({
  title = "Zrušené rezervácie",
}) {
  const [search, setSearch] = useState("");
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState("newest");
  const [canceledByFilter, setCanceledByFilter] = useState("all");
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const formatDateSK = (date) => {
    if (!date) return "";

    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return "";

    return new Intl.DateTimeFormat("sk-SK", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(parsedDate);
  };

  const formatDateTimeSK = (date) => {
    if (!date) return "";

    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return "";

    const timeMatch =
      typeof date === "string"
        ? date.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/)
        : null;
    const hasNonZeroTime =
      Boolean(timeMatch) &&
      (timeMatch[1] !== "00" ||
        timeMatch[2] !== "00" ||
        (timeMatch[3] ?? "00") !== "00");

    return new Intl.DateTimeFormat("sk-SK", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      ...(hasNonZeroTime
        ? {
            hour: "2-digit",
            minute: "2-digit",
          }
        : {}),
    }).format(parsedDate);
  };

  const hasValidDogBirth = (value) =>
    Boolean(value && value !== "0000-00-00" && formatDateSK(value));

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          "/api/wp/moje-auto/v1/canceled-reservations",
        );
        const data = await response.json();

        setReservations(
          data.map((item) => ({
            ...item,
            reservation_id: item.id,
            event_name: item.service_name,
          })),
        );
      } catch (err) {
        console.error("Chyba pri načítaní dát:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const normalize = (value) =>
    String(value ?? "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "");

  const filteredReservations = useMemo(() => {
    return [...reservations]
      .filter((reservation) =>
        [
          reservation.event_name,
          reservation.first_name,
          reservation.last_name,
          reservation.email,
          reservation.dog_name,
          reservation.dog_breed,
          reservation.canceled_by === "admin"
            ? "admin zrušené adminom"
            : reservation.canceled_by === "client"
              ? "klient zrušené klientom"
              : "",
        ].some((value) => normalize(value).includes(normalize(search))),
      )
      .filter((reservation) => {
        if (canceledByFilter === "all") return true;
        if (canceledByFilter === "unknown") return !reservation.canceled_by;
        return reservation.canceled_by === canceledByFilter;
      })
      .sort((a, b) => (sortOrder === "newest" ? b.id - a.id : a.id - b.id));
  }, [canceledByFilter, reservations, search, sortOrder]);

  const openModal = (item) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedItem(null);
  };

  const cancellationTimestamp = selectedItem?.created_at || "";
  const reservationCreatedTimestamp =
    selectedItem?.reservation_created_at || "";
  const serviceDateRange =
    selectedItem?.service_start && selectedItem?.service_end
      ? `${selectedItem.service_start} - ${selectedItem.service_end}`
      : "";

  const canceledByLabel =
    selectedItem?.canceled_by === "admin"
      ? "Zrušené adminom"
      : selectedItem?.canceled_by === "client"
        ? "Zrušené klientom"
        : "";

  const canceledByBadgeClass =
    selectedItem?.canceled_by === "admin"
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : selectedItem?.canceled_by === "client"
        ? "border-rose-200 bg-rose-50 text-rose-800"
        : "border-slate-200 bg-slate-50 text-slate-700";

  const dogDetailItems = [
    selectedItem?.dog_name,
    selectedItem?.dog_breed,
    selectedItem?.dog_gender,
    hasValidDogBirth(selectedItem?.dog_birth)
      ? formatDateSK(selectedItem?.dog_birth)
      : "",
  ].filter(Boolean);

  const hasDogDetails = dogDetailItems.length > 0;

  if (loading) return <Loading />;

  return (
    <div className="space-y-8 p-4 font-sans sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <input
          type="text"
          placeholder="Vyhľadávanie..."
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500 md:w-1/2"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="flex flex-col gap-3 sm:flex-row">
          <select
            className="cursor-pointer rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500"
            value={canceledByFilter}
            onChange={(e) => setCanceledByFilter(e.target.value)}
          >
            <option value="all">Všetky storná</option>
            <option value="client">Zrušené klientom</option>
            <option value="admin">Zrušené adminom</option>
            <option value="unknown">Neuvedené</option>
          </select>

          <select
            className="cursor-pointer rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="newest">Najnovšie</option>
            <option value="oldest">Najstaršie</option>
          </select>
        </div>
      </div>

      <ReservationList
        title={title}
        reservations={filteredReservations}
        onClick={openModal}
      />

      {modalVisible && selectedItem && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50"
          onClick={closeModal}
        >
          <div
            className="relative h-screen w-full max-w-4xl overflow-y-auto rounded-none bg-white shadow-2xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full text-3xl leading-none text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 sm:right-5 sm:top-5"
              aria-label="Zavrieť detail"
            >
              ×
            </button>

            <div className="p-5 sm:p-8">
              <div className="mb-6 border-b border-slate-200 pb-5">
                <p className="pr-12 text-[30px] font-semibold leading-tight text-slate-900 sm:text-[34px]">
                  Zrušenie rezervácie
                </p>
                <h2 className="mt-2 pr-12 text-lg font-semibold text-slate-800 sm:text-[22px]">
                  {selectedItem.service_name}
                </h2>
                {serviceDateRange && (
                  <p className="mt-2 pr-12 text-sm text-slate-600 sm:text-[15px]">
                    {serviceDateRange}
                  </p>
                )}
              </div>

              <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 sm:px-5">
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Stav zrušenia
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${canceledByBadgeClass}`}
                      >
                        {canceledByLabel || "Neuvedené"}
                      </span>
                    </div>
                  </div>

                  <div className="min-w-0 w-full md:max-w-[420px]">
                    <MetaRow
                      label="Rezervácia vytvorená"
                      value={formatDateTimeSK(reservationCreatedTimestamp)}
                    />
                    <MetaRow
                      label="Rezervácia zrušená"
                      value={formatDateTimeSK(cancellationTimestamp)}
                    />
                  </div>
                </div>
              </div>

              <div className="mb-6 rounded-2xl border border-slate-200 bg-white px-4 py-5 sm:px-6">
                <div className="mb-4 border-b border-slate-200 pb-3">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Detail
                  </h3>
                </div>

                <div
                  className={`grid grid-cols-1 gap-5 ${
                    hasDogDetails ? "lg:grid-cols-[minmax(0,0.9fr)_minmax(0,0.9fr)]" : ""
                  }`}
                >
                  <div className={hasDogDetails ? "" : "w-full"}>
                    <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
                      Klient
                    </h4>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 sm:px-5">
                      <InfoField
                        label="Meno"
                        value={`${selectedItem.first_name || ""} ${selectedItem.last_name || ""}`.trim()}
                        strong
                      />
                      <InfoField label="Email" value={selectedItem.email} />
                      <InfoField
                        label="Telefón"
                        value={selectedItem.phone_number}
                      />
                      <InfoField
                        label="Adresa"
                        value={`${selectedItem.street || ""}, ${selectedItem.zip || ""} ${selectedItem.city || ""}`.trim()}
                      />
                    </div>
                  </div>

                  {hasDogDetails && (
                    <div>
                    <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
                      Pes
                    </h4>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 sm:px-5">
                        <InfoField
                          label="Meno psa"
                          value={selectedItem.dog_name}
                          strong
                        />
                        <InfoField
                          label="Plemeno"
                          value={selectedItem.dog_breed}
                        />
                        <InfoField
                          label="Pohlavie"
                          value={selectedItem.dog_gender}
                        />
                        <InfoField
                          label="Dátum narodenia"
                          value={
                            hasValidDogBirth(selectedItem.dog_birth)
                              ? formatDateSK(selectedItem.dog_birth)
                              : ""
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={closeModal}
                className="mt-8 w-full rounded-2xl bg-slate-900 py-4 text-sm font-semibold text-white transition hover:bg-slate-800"
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
