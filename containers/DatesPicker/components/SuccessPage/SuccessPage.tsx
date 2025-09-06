import React from "react";

interface SuccessPageProps {
  onBackToRooms: () => void;
}

export const SuccessPage: React.FC<SuccessPageProps> = ({ onBackToRooms }) => {
  return (
    <div className="max-w-2xl mx-auto p-6 text-center">
      {/* Success Icon */}
      <div className="mb-6">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      {/* Success Title */}
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">Заявка успішно відправлена!</h2>

      {/* Success Message */}
      <div className="text-gray-700 text-lg leading-relaxed mb-8">
        <p className="mb-4">
          Дякуємо за вашу заявку, наш адміністратор невдовзі зв'яжеться з вами щоб підтвердити бронювання, якщо цього не
          відбудеться протягом години, ви можете зв'язатись з нами за номером
        </p>
        <p>
          <a
            href="tel:+380971914806"
            className="font-medium hover:underline"
            style={{ color: "var(--color-blue-400)" }}
          >
            +38 (097) 191 48 06
          </a>
        </p>
      </div>

      {/* Back to Rooms Button */}
      <button
        onClick={onBackToRooms}
        className="px-6 py-3 text-white font-medium rounded-lg transition-colors cursor-pointer"
        style={{
          backgroundColor: "var(--color-blue-400)",
          borderColor: "var(--color-blue-400)",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.backgroundColor = "var(--color-blue-500)";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.backgroundColor = "var(--color-blue-400)";
        }}
      >
        Переглянути інші номери
      </button>
    </div>
  );
};
