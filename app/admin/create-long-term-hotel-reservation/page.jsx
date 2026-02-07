import React from "react";
import HotelReservation from "../../../components/HotelReservation";

function page() {
  return (
    <HotelReservation
      serviceName={"Hotel s dlhodobým ubytovaním"}
      autofill={true}
    />
  );
}

export default page;
