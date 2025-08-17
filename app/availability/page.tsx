"use client";

import React from "react";
import { DatesPicker } from "../containers/DatesPicker/DatesPicker";

export default function AvailabilityPage() {
  const handleRangeSelect = (range: any) => {
    console.log("Range selected:", range);
    // You can add any additional logic here when a range is selected
  };

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-4xl mx-auto max-w-[648px]">
        <DatesPicker onRangeSelect={handleRangeSelect} className="mb-8" />
      </div>
    </div>
  );
}
