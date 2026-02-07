import React from "react";
import AccommodationCalendar from "../../../components/AccommodationCalendar";

function page() {
  return (
    <AccommodationCalendar
      serviceName={"Výcvik s ubytovaním"}
      autofill={true}
    />
  );
}

export default page;
