// app/admin/manage-events/page.jsx
"use client";
import { useContext } from "react";
import { AdminDataContext } from "../../../context/AdminDataContext";
import Loading from "../../../components/Loading";
import AccommodationsAdmin from "../../../components/admin/AccomodationsTable";

export default function ManageEventsPage() {
  const { accomodations, loading } = useContext(AdminDataContext);

  if (loading) return <Loading />;

  return (
    <AccommodationsAdmin
      accommodationsProps={accomodations}
      loading={loading}
    />
  );
}
