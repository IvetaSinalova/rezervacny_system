// app/admin/manage-events/page.jsx
"use client";
import { useContext, useState, useEffect } from "react";
import { AdminDataContext } from "../../../context/AdminDataContext";
import Loading from "../../../components/Loading";
import AccommodationsAdmin from "../../../components/admin/AccomodationsTable";

export default function ManageEventsPage() {
  //const { accomodations, loading } = useContext(AdminDataContext);
  const [accomodations, setAccomodations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("https://psiaskola.sk/wp-json/events/v1/all-accomodations").then(
        (res) => res.json(),
      ),
    ])
      .then(([accomodations]) => {
        setAccomodations(accomodations);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <Loading />;

  return (
    <AccommodationsAdmin
      accommodationsProps={accomodations}
      loading={loading}
    />
  );
}
