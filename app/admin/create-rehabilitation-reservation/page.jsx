import React from "react";
import AccommodationCalendar from "../../../components/AccommodationCalendar";

function page() {
  return (
    <AccommodationCalendar serviceName={"Prevýchova psa"} autofill={true} />
  );
}

export default page;
