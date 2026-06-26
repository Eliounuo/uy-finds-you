import { wrap, button } from "./_layout";

export function checkInReminderTemplate(params: {
  propertyTitle: string;
  address?: string;
  checkIn: string;
  hostPhone?: string;
  appUrl?: string;
}) {
  const url = params.appUrl || "https://yurta.app";
  return {
    subject: `Завтра заезд: ${params.propertyTitle}`,
    html: wrap(
      "Напоминание о заезде",
      `<h1 style="margin:0 0 12px;font-size:22px;">Завтра заезд 🔑</h1>
       <p><b>${params.propertyTitle}</b></p>
       ${params.address ? `<p style="color:#555;">📍 ${params.address}</p>` : ""}
       <p>Время заезда: <b>${params.checkIn}</b></p>
       ${params.hostPhone ? `<p>Хозяин: <a href="tel:${params.hostPhone}" style="color:#9B1C1C;">${params.hostPhone}</a></p>` : ""}
       <p style="margin:24px 0;">${button(url + "/bookings", "Открыть бронь")}</p>`,
    ),
  };
}
