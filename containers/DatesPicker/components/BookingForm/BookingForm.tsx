import React, { useState } from "react";
import { DateRange } from "react-day-picker";
import { BookingService } from "../../../../services/bookingService";

interface BookingFormData {
  name: string;
  phone: string;
  adults: number;
  children: number;
  dogs: number;
}

interface BookingFormErrors {
  name?: string;
  phone?: string;
  adults?: string;
  children?: string;
  dogs?: string;
}

interface BookingFormProps {
  roomName: string;
  roomNumber: number;
  selectedRange: DateRange;
  onSubmit: () => void; // Just a success callback
  onCancel: () => void;
  isMirador?: boolean;
}

export const BookingForm: React.FC<BookingFormProps> = ({
  roomName,
  roomNumber,
  selectedRange,
  onSubmit,
  onCancel,
  isMirador = false,
}) => {
  const [formData, setFormData] = useState<BookingFormData>({
    name: "",
    phone: "",
    adults: 1,
    children: 0,
    dogs: 0,
  });

  const [errors, setErrors] = useState<BookingFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: BookingFormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Ім'я є обов'язковим";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Номер телефону є обов'язковим";
    } else if (!/^\+?[\d\s\-\(\)]{10,}$/.test(formData.phone.trim())) {
      newErrors.phone = "Невірний формат номера телефону";
    }

    if (formData.adults < 1) {
      newErrors.adults = "Мінімум 1 дорослий";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!selectedRange?.from) {
      return;
    }

    // If no end date is selected, use the next day
    const endDate = selectedRange.to || new Date(selectedRange.from.getTime() + 24 * 60 * 60 * 1000);

    setIsSubmitting(true);

    try {
      // Use booking service to handle the submission
      const result = await BookingService.handleBookingSubmission(
        formData,
        {
          from: selectedRange.from,
          to: endDate,
        },
        {
          roomName,
          roomNumber,
        },
        isMirador
      );

      if (result.success) {
        // Call success callback to show success page
        onSubmit();
      }
      // Remove error alerts - silently fail or handle via UI state
    } catch (error) {
      console.error("Booking submission error:", error);
      // Remove network error alerts - silently fail or handle via UI state
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNumberChange = (field: keyof Pick<BookingFormData, "adults" | "children" | "dogs">, delta: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: Math.max(0, prev[field] + delta),
    }));
  };

  const formatDateRange = () => {
    if (!selectedRange.from) return "";

    const fromDate = selectedRange.from.toLocaleDateString("uk-UA", {
      day: "numeric",
      month: "long",
    });

    const toDate = selectedRange.to?.toLocaleDateString("uk-UA", {
      day: "numeric",
      month: "long",
    });

    return toDate ? `${fromDate} - ${toDate}` : fromDate;
  };

  const getNightsCount = () => {
    if (!selectedRange.from) return 1;

    // If no end date is selected, assume 1 night (next day checkout)
    const endDate = selectedRange.to || new Date(selectedRange.from.getTime() + 24 * 60 * 60 * 1000);
    const timeDiff = endDate.getTime() - selectedRange.from.getTime();
    const nights = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    return Math.max(1, nights);
  };

  const getNightsText = (nights: number) => {
    if (nights === 1) return "ніч";
    if (nights >= 2 && nights <= 4) return "ночі";
    return "ночей";
  };

  return (
    <div className="max-w-2xl mx-auto bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Заявка на бронювання</h3>
        <div className="text-sm text-gray-600">
          <p className="font-semibold text-lg" style={{ color: "var(--color-blue-400)" }}>
            {roomName}
          </p>
          <p>
            {formatDateRange()} • {getNightsCount()} {getNightsText(getNightsCount())}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name Field */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Ім'я *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${
              errors.name ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Введіть ваше ім'я"
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>

        {/* Phone Field */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
            Номер телефону *
          </label>
          <input
            type="tel"
            id="phone"
            value={formData.phone}
            onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${
              errors.phone ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="+380 XX XXX XX XX"
          />
          {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
        </div>

        {/* Guest Numbers */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700">Кількість гостей</h4>

          {/* Adults */}
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <div className="font-medium text-gray-900">Дорослі</div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => handleNumberChange("adults", -1)}
                disabled={formData.adults <= 1}
                className="w-8 h-8 border border-gray-300 rounded-full flex items-center justify-center text-gray-600 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                −
              </button>
              <span className="w-8 text-center font-medium">{formData.adults}</span>
              <button
                type="button"
                onClick={() => handleNumberChange("adults", 1)}
                className="w-8 h-8 border border-gray-300 rounded-full flex items-center justify-center text-gray-600 hover:border-gray-400 cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* Children */}
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <div className="font-medium text-gray-900">Діти</div>
              <div className="text-sm text-gray-500">До 3 років включно</div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => handleNumberChange("children", -1)}
                disabled={formData.children <= 0}
                className="w-8 h-8 border border-gray-300 rounded-full flex items-center justify-center text-gray-600 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                −
              </button>
              <span className="w-8 text-center font-medium">{formData.children}</span>
              <button
                type="button"
                onClick={() => handleNumberChange("children", 1)}
                className="w-8 h-8 border border-gray-300 rounded-full flex items-center justify-center text-gray-600 hover:border-gray-400 cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* Dogs */}
          <div className="flex items-center justify-between py-3">
            <div>
              <div className="font-medium text-gray-900">Домашні тварини</div>
              <div className="text-sm text-gray-500">Песики до 12кг</div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => handleNumberChange("dogs", -1)}
                disabled={formData.dogs <= 0}
                className="w-8 h-8 border border-gray-300 rounded-full flex items-center justify-center text-gray-600 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                −
              </button>
              <span className="w-8 text-center font-medium">{formData.dogs}</span>
              <button
                type="button"
                onClick={() => handleNumberChange("dogs", 1)}
                className="w-8 h-8 border border-gray-300 rounded-full flex items-center justify-center text-gray-600 hover:border-gray-400 cursor-pointer"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Validation Error for Adults */}
        {errors.adults && <p className="text-sm text-red-600">{errors.adults}</p>}

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Назад
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors font-medium ${
              isSubmitting ? "cursor-not-allowed opacity-75" : "cursor-pointer"
            }`}
            style={{
              backgroundColor: isSubmitting ? "var(--color-gray-400)" : "var(--color-blue-400)",
              borderColor: isSubmitting ? "var(--color-gray-400)" : "var(--color-blue-400)",
            }}
            onMouseEnter={e => {
              if (!isSubmitting) {
                e.currentTarget.style.backgroundColor = "var(--color-blue-500)";
              }
            }}
            onMouseLeave={e => {
              if (!isSubmitting) {
                e.currentTarget.style.backgroundColor = "var(--color-blue-400)";
              }
            }}
          >
            {isSubmitting ? "Відправляємо..." : "Відправити заявку"}
          </button>
        </div>
      </form>
    </div>
  );
};
