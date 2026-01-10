"use client";
import { useState, useEffect } from "react";
import SearchDropdown from "../SearchDropdown";

function ClientPicker({
  updateLongTermId,
  updateLoadingReturnDog,
  updateExistsReturnDog,
}) {
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    updateLoadingReturnDog(true);

    fetch("https://psiaskola.sk/wp-json/events/v1/get-user-to-plan-dog-return")
      .then((res) => res.json())
      .then((data) => {
        const mapped = data.map((r) => ({
          value: r.reservation_id,
          label: `${r.dog_name} – ${r.owner_first_name} ${r.owner_last_name}`,
        }));

        setOptions(mapped);
        updateExistsReturnDog(mapped.length > 0);
      })
      .finally(() => updateLoadingReturnDog(false));
  }, []);

  return (
    <div className="mb-6">
      {options.length > 0 ? (
        <SearchDropdown
          label="Pes - Majiteľ"
          options={options}
          value={selected}
          onSelect={(opt) => {
            setSelected(opt);
            updateLongTermId(opt.value);
          }}
        />
      ) : (
        <div className="text-md text-center font-bold">
          Všetky psy majú už naplánované odovzdanie majiteľovi.
        </div>
      )}
    </div>
  );
}

export default ClientPicker;
