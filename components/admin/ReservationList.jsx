"use client";
export default function ReservationList({
  title,
  reservations,
  onClick,
  range = false,
  dateLabel,
}) {
  const formatDateSK = (date) => {
    if (!date) return "";

    return new Intl.DateTimeFormat("sk-SK", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(date));
  };

  const canceledByLabel = (value) =>
    value === "admin"
      ? "Zrušené adminom"
      : value === "client"
        ? "Zrušené klientom"
        : "";

  const canceledByBadgeClass = (value) =>
    value === "admin"
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : value === "client"
        ? "border-rose-200 bg-rose-50 text-rose-800"
        : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <div className="bg-white shadow-xl rounded-2xl p-6">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>

      {reservations.length === 0 && (
        <div className="text-gray-500">Žiadne záznamy</div>
      )}

      <ul className="divide-y">
        {reservations.map((r) => (
          <li
            key={`${r.reservation_id}-${r.event_calendar_id}`}
            onClick={() => onClick(r)}
            className="py-4 cursor-pointer hover:bg-gray-50 px-2 transition"
          >
            <div className="flex flex-col md:flex-row justify-between gap-2">
              <div>
                <div className="font-semibold text-lg">
                  {r.first_name} {r.last_name}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <div className="font-semibold text-sm">{r.event_name}</div>
                  {canceledByLabel(r.canceled_by) && (
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${canceledByBadgeClass(r.canceled_by)}`}
                    >
                      {canceledByLabel(r.canceled_by)}
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  {r.email} • {r.phone_number}
                </div>
                {r.dog_name && (
                  <div className="text-sm text-gray-600">
                    Pes: <b>{r.dog_name}</b>
                  </div>
                )}
              </div>

              <div className="text-sm text-right">
                {r.start_date && (
                  <div>
                    <b>{dateLabel}:</b>{" "}
                    {range
                      ? `${formatDateSK(r.start_date)} – ${formatDateSK(
                          r.end_date,
                        )}`
                      : formatDateSK(r.start_date)}
                  </div>
                )}
                {r.created_at && (
                  <div>
                    <b>Vytvorené: </b>
                    {formatDateSK(r.created_at)}
                  </div>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
