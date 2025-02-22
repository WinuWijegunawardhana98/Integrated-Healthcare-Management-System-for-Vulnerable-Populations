import React, { useState } from "react";

const ListTable = () => {
  const [selectedTime, setSelectedTime] = useState("morning");

  return (
    <div className="p-4 border rounded shadow-md bg-white">
      <h2 className="text-lg font-semibold mb-2">Medication Adherence Time</h2>
      <div className="space-y-2">
        {["morning", "afternoon", "evening", "night"].map((time, index) => (
          <label key={index} className="flex items-center space-x-2">
            <input
              type="radio"
              name="adherence-time"
              value={time}
              checked={selectedTime === time}
              onChange={() => setSelectedTime(time)}
            />
            <span className="capitalize">{time}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default ListTable;
