import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);
const receiverEmail = process.env.RECEIVER_EMAIL || "";
const fromEmail = "onboarding@resend.dev";

interface BookingRequest {
  startDate: string;
  endDate: string;
  name: string;
  phone: string;
  adults: number;
  children: number;
  pets: number;
  roomName?: string;
  roomNumber?: number;
  isMirador?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const data: BookingRequest = await request.json();

    // Validate required fields
    const { startDate, endDate, name, phone, adults, children, pets } = data;

    if (!startDate || !endDate || !name || !phone) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: startDate, endDate, name, phone",
        },
        { status: 400 }
      );
    }

    // Validate email environment variable
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "Email service not configured",
        },
        { status: 500 }
      );
    }

    // Format dates for display
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString("uk-UA", {
        day: "numeric",
        month: "long",
        year: "numeric",
        weekday: "long",
      });
    };

    // Calculate nights
    const start = new Date(startDate);
    const end = new Date(endDate);
    const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    // Create email content
    const emailSubject = `Заявка - ${name}`;
    const viewType = data.isMirador ? "Mirador" : "Звичайна";

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937; margin-bottom: 20px;">
          Заявка на бронювання
        </h2>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
          <p style="margin: 5px 0;"><strong>Гість:</strong> ${name}</p>
          <p style="margin: 5px 0;"><strong>Телефон:</strong> ${phone}</p>
          <p style="margin: 5px 0;"><strong>Заїзд:</strong> ${formatDate(startDate)}</p>
          <p style="margin: 5px 0;"><strong>Виїзд:</strong> ${formatDate(endDate)}</p>
          <p style="margin: 5px 0;"><strong>Ночей:</strong> ${nights}</p>
          ${data.roomName && data.roomNumber ? `<p style="margin: 5px 0;"><strong>Номер:</strong> ${data.roomName} (№${data.roomNumber})</p>` : ""}
          <p style="margin: 5px 0;"><strong>Гостей:</strong> ${adults + children} (дорослі: ${adults}, діти: ${children})</p>
          ${pets > 0 ? `<p style="margin: 5px 0;"><strong>Тварини:</strong> ${pets}</p>` : ""}
          <p style="margin: 5px 0;"><strong>Вид форми:</strong> ${viewType}</p>
          <p style="margin: 5px 0; color: #6b7280; font-size: 14px;">Отримано: ${new Date().toLocaleString("uk-UA")}</p>
        </div>
      </div>
    `;

    // Send email via Resend
    const emailData = await resend.emails.send({
      from: fromEmail,
      to: [receiverEmail],
      subject: emailSubject,
      html: emailContent,
    });

    return NextResponse.json({
      success: true,
      message: "Заявка на бронювання успішно відправлена",
      data: {
        bookingId: emailData.data?.id,
        guestName: name,
        checkIn: startDate,
        checkOut: endDate,
        nights,
        room: {
          name: data.roomName,
          number: data.roomNumber,
        },
        guests: {
          adults,
          children,
          pets,
          total: adults + children,
        },
      },
    });
  } catch (error) {
    console.error("Booking submission error:", error);

    // Handle Resend-specific errors
    if (error instanceof Error && error.message.includes("API key")) {
      return NextResponse.json(
        {
          success: false,
          error: "Email service configuration error",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to submit booking request",
        message: process.env.NODE_ENV === "development" ? (error as Error).message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
