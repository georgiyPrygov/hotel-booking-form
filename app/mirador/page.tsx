import React from "react";
import { DatesPicker } from "../../containers/DatesPicker/DatesPicker";

export default function MiradorPage() {
  return (
    <div className="bg-[#e2e0da] py-8">
      <div className="max-w-4xl mx-auto max-w-[648px]">
        <DatesPicker className="mb-8" isMirador />
      </div>
    </div>
  );
}
