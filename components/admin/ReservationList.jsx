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
                <div className="font-semibold text-sm">{r.event_name}</div>
                <div className="text-sm text-gray-600">
                  {r.email} • {r.phone_number}
                </div>
                <div className="text-sm text-gray-600">
                  Pes: <b>{r.dog_name}</b>
                </div>
              </div>

              <div className="text-sm text-right">
                <div>
                  <b>{dateLabel}:</b>{" "}
                  {range
                    ? `${formatDateSK(r.start_date)} – ${formatDateSK(
                        r.end_date,
                      )}`
                    : formatDateSK(r.start_date)}
                </div>
                <div>
                  <b>Vytvorené: </b>
                  {formatDateSK(r.created_at)}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
