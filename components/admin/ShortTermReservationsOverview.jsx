"use client";
import React, { useEffect, useState } from "react";
import Loading from "../Loading";
import ReservationsOverview from "./ReservationsOverview";

const ShortTermReservationsOverview = () => {
  const [reservations, setReservation] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(
      "https://psiaskola.sk/wp-json/events/v1/short-term-reservations-overview",
    )
      .then((res) => res.json())
      .then((data) => {
        setReservation(data);
        setLoading(false);
      })
      .catch((error) => {
        console.log(error);
        setLoading(false);
      });
  }, []);

  if (loading) return <Loading />;
  return (
    <ReservationsOverview
      reservationsProps={reservations}
      title="Kurzy"
      range={false}
    />
  );
};

export default ShortTermReservationsOverview;
