"use client";

import { useEffect, useMemo, useState } from "react";
import Loading from "../Loading";
import ReservationDetail from "./ReservationDetail";

const toDateInputValue = (date) => date.toISOString().slice(0, 10);

const getWeekRange = () => {
  const now = new Date();
  const firstDay = new Date(now);

  const lastDay = new Date(firstDay);
  lastDay.setDate(firstDay.getDate() + 6);

  return {
    from: toDateInputValue(firstDay),
    to: toDateInputValue(lastDay),
  };
};

const getDateRange = (type) => {
  const today = new Date();
  const fromDate = new Date(today);
  const toDate = new Date(today);

  if (type === "today") {
    return {
      from: toDateInputValue(fromDate),
      to: toDateInputValue(toDate),
    };
  }

  if (type === "week") {
    toDate.setDate(fromDate.getDate() + 6);
    return {
      from: toDateInputValue(fromDate),
      to: toDateInputValue(toDate),
    };
  }

  if (type === "calendarWeek") {
    const day = fromDate.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    fromDate.setDate(fromDate.getDate() + mondayOffset);
    toDate.setTime(fromDate.getTime());
    toDate.setDate(fromDate.getDate() + 6);
    return {
      from: toDateInputValue(fromDate),
      to: toDateInputValue(toDate),
    };
  }

  fromDate.setDate(1);
  toDate.setMonth(fromDate.getMonth() + 1, 0);
  return {
    from: toDateInputValue(fromDate),
    to: toDateInputValue(toDate),
  };
};

const formatDateSK = (dateStr) =>
  new Intl.DateTimeFormat("sk-SK", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(dateStr));

const isToday = (dateStr) => dateStr === toDateInputValue(new Date());

const occupancyClass = (current, max) => {
  if (!max) return "bg-gray-100 text-gray-700";
  const ratio = current / max;
  if (ratio >= 1) return "bg-red-100 text-red-800";
  if (ratio >= 0.85) return "bg-yellow-100 text-yellow-800";
  return "bg-[var(--color-light)] text-[var(--color-primary)]";
};

const getOriginalEndDay = (dog) => {
  if (dog.original_end_day) return dog.original_end_day;
  if (!dog.end_day || !dog.extra_days) return null;

  const originalEndDate = new Date(dog.end_day);
  originalEndDate.setDate(originalEndDate.getDate() - Number(dog.extra_days));
  return toDateInputValue(originalEndDate);
};

function DogButton({
  dog,
  dayDate,
  detailLoading,
  loadingReservationId,
  onOpenReservationDetail,
}) {
  const originalEndDay = getOriginalEndDay(dog);
  const showExtendedBadge =
    Number(dog.extra_days) > 0 && originalEndDay && dayDate > originalEndDay;

  return (
    <button
      type="button"
      onClick={() => onOpenReservationDetail(dog.reservation_id)}
      className="w-full min-w-0 rounded-lg border border-gray-300 px-3 py-2 text-left transition hover:border-[var(--color-secondary)] hover:bg-gray-50 disabled:cursor-wait disabled:opacity-60 sm:w-auto"
      disabled={detailLoading}
    >
      <span className="block truncate font-semibold text-gray-900">
        {loadingReservationId === dog.reservation_id
          ? "Načítavam detail..."
          : dog.dog_name}
      </span>
      <span className="block truncate text-xs text-gray-600">
        {dog.event_name}
        {dog.client_name ? ` | ${dog.client_name}` : ""}
      </span>
      {(dog.is_arrival_day || dog.is_pickup_day || showExtendedBadge) && (
        <span className="mt-2 flex flex-wrap gap-1">
          {dog.is_arrival_day && (
            <span className="rounded-full bg-[var(--color-tertiary)]/10 px-2 py-0.5 text-[11px] font-semibold text-[var(--color-tertiary)]">
              Príchod dnes
            </span>
          )}
          {dog.is_pickup_day && (
            <span className="rounded-full bg-[var(--color-secondary)]/10 px-2 py-0.5 text-[11px] font-semibold text-[var(--color-primary)]">
              Odovzdanie dnes
            </span>
          )}
          {showExtendedBadge && (
            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700">
              Predĺžené +{dog.extra_days} {dog.extra_days > 1 ? "dni" : "deň"}
            </span>
          )}
        </span>
      )}
    </button>
  );
}

export default function AccommodatedDogsOverview() {
  const initialRange = useMemo(() => getWeekRange(), []);
  const [from, setFrom] = useState(initialRange.from);
  const [to, setTo] = useState(initialRange.to);
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [loadingReservationId, setLoadingReservationId] = useState(null);
  useEffect(() => {
    const controller = new AbortController();

    setError("");

    if (from && to && new Date(to) < new Date(from)) {
      setDays([]);
      setLoading(false);
      setError("Zvolený dátum Od musí byť skôr ako zvolený dátum Do");
      return () => controller.abort();
    }

    setLoading(true);

    fetch(
      `/api/wp/events/v1/accommodated-dogs-overview?from=${from}&to=${to}`,
      {
        signal: controller.signal,
      },
    )
      .then((res) => {
        if (!res.ok) throw new Error("Prehlad sa nepodarilo nacitat.");
        return res.json();
      })
      .then((data) => {
        setDays(Array.isArray(data.days) ? data.days : []);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        console.error(err);
        setError(err instanceof Error ? err.message : "Nastala chyba.");
        setLoading(false);
      });

    return () => controller.abort();
  }, [from, to]);

  const openReservationDetail = async (reservationId) => {
    if (detailLoading) return;

    setDetailLoading(true);
    setLoadingReservationId(reservationId);
    setError("");

    try {
      const response = await fetch(
        `/api/wp/events/v1/long-term-reservation-detail/${reservationId}`,
      );

      if (!response.ok) {
        throw new Error("Detail rezervacie sa nepodarilo nacitat.");
      }

      const reservation = await response.json();
      setSelectedReservation(reservation);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Nastala chyba.");
    } finally {
      setDetailLoading(false);
      setLoadingReservationId(null);
    }
  };

  const closeModal = () => setSelectedReservation(null);
  const setQuickRange = (type) => {
    const range = getDateRange(type);
    setFrom(range.from);
    setTo(range.to);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Prehľad ubytovaných psov
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Zaplnená kapacita podľa ubytovania
          </p>
        </div>

        <div className="grid w-full grid-cols-1 gap-3 sm:w-auto sm:grid-cols-2">
          <label className="text-sm font-semibold text-gray-700">
            Od
            <input
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="text-sm font-semibold text-gray-700">
            Do
            <input
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {[
            ["today", "Dnes"],
            ["week", "Nasledujúcich 7 dní"],
            ["calendarWeek", "Tento týždeň"],
            ["month", "Tento mesiac"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setQuickRange(value)}
              className="rounded-lg border border-[var(--color-secondary)] px-3 py-2 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-light)]"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          {error}
        </div>
      )}

      {loading ? (
        <Loading />
      ) : days.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-gray-500">
          V zadanom období nemáte ubytované žiadne psy.
        </div>
      ) : (
        <>
          <div className="space-y-4 lg:hidden">
            {days.map((day) => (
              <section
                key={day.date}
                className={`rounded-xl border border-gray-200 p-4 shadow-sm ${
                  isToday(day.date) ? "bg-[var(--color-light)]" : "bg-white"
                }`}
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <h2 className="min-w-0 truncate text-base font-bold text-gray-900">
                    {formatDateSK(day.date)}
                    {isToday(day.date) && (
                      <span className="ml-2 rounded-full bg-white px-2 py-0.5 text-xs text-[var(--color-primary)]">
                        Dnes
                      </span>
                    )}
                  </h2>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-sm font-semibold ${occupancyClass(
                      day.total_dogs,
                      day.total_capacity,
                    )}`}
                  >
                    {day.total_dogs}/{day.total_capacity}
                  </span>
                </div>

                <div className="space-y-3">
                  {day.accommodations.map((accommodation) => (
                    <div
                      key={`${day.date}-${accommodation.accommodation_id}`}
                      className="rounded-lg border border-gray-200 bg-white p-3"
                    >
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-gray-900">
                          {accommodation.accommodation_name}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${occupancyClass(
                            accommodation.dogs_count,
                            accommodation.accommodation_capacity,
                          )}`}
                        >
                          {accommodation.dogs_count}/
                          {accommodation.accommodation_capacity}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {accommodation.dogs.map((dog) => (
                          <DogButton
                            key={`${day.date}-${dog.reservation_id}-${dog.dog_id}`}
                            dog={dog}
                            dayDate={day.date}
                            detailLoading={detailLoading}
                            loadingReservationId={loadingReservationId}
                            onOpenReservationDetail={openReservationDetail}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm lg:block">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-600">
                  <tr>
                    <th className="px-4 py-3">Deň</th>
                    <th className="px-4 py-3">Počet psov</th>
                    <th className="px-4 py-3">Ubytovanie a psy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {days.map((day) => (
                    <tr
                      key={day.date}
                      className={`align-top ${isToday(day.date) ? "bg-[var(--color-light)]" : ""}`}
                    >
                      <td className="whitespace-nowrap px-4 py-4 font-semibold text-gray-900">
                        {formatDateSK(day.date)}
                        {isToday(day.date) && (
                          <span className="ml-2 rounded-full bg-white px-2 py-0.5 text-xs text-[var(--color-primary)]">
                            Dnes
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 font-semibold ${occupancyClass(
                            day.total_dogs,
                            day.total_capacity,
                          )}`}
                        >
                          {day.total_dogs}/{day.total_capacity}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-3">
                          {day.accommodations.map((accommodation) => (
                            <div
                              key={`${day.date}-${accommodation.accommodation_id}`}
                              className="rounded-lg border border-gray-200 bg-white p-3"
                            >
                              <div className="mb-2 flex flex-wrap items-center gap-2">
                                <span className="font-semibold text-gray-900">
                                  {accommodation.accommodation_name}
                                </span>
                                <span
                                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${occupancyClass(
                                    accommodation.dogs_count,
                                    accommodation.accommodation_capacity,
                                  )}`}
                                >
                                  {accommodation.dogs_count}/
                                  {accommodation.accommodation_capacity}
                                </span>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                {accommodation.dogs.map((dog) => (
                                  <DogButton
                                    key={`${day.date}-${dog.reservation_id}-${dog.dog_id}`}
                                    dog={dog}
                                    dayDate={day.date}
                                    detailLoading={detailLoading}
                                    loadingReservationId={loadingReservationId}
                                    onOpenReservationDetail={
                                      openReservationDetail
                                    }
                                  />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {selectedReservation && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50"
          onClick={closeModal}
        >
          <div
            className="relative h-screen w-full max-w-4xl overflow-y-auto rounded-none bg-white shadow-2xl sm:rounded-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              onClick={closeModal}
              className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full text-xl font-bold text-gray-500 transition hover:bg-slate-100 hover:text-black"
              aria-label="Close modal"
            >
              x
            </button>
            <div className="flex-1 overflow-y-auto p-5 sm:p-6">
              <ReservationDetail
                reservationProps={selectedReservation}
                onPaymentChange={() => {}}
                onReservationUpdate={(updatedReservation) => {
                  setSelectedReservation((prev) => ({
                    ...prev,
                    ...updatedReservation,
                  }));
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
