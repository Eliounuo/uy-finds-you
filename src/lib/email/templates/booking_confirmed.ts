import { wrap, button } from "./_layout";

export function bookingConfirmedTemplate(params: {
  propertyTitle: string;
  checkIn: string;
  checkOut: string;
  total: number;
  appUrl?: string;
}) {
  const url = params.appUrl || "https://yurta.app";
  return {
    subject: `Бронь подтверждена: ${params.propertyTitle}`,
    html: wrap(
      "Бронь подтверждена",
      `<h1 style="margin:0 0 12px;font-size:22px;">Готово ✅</h1>
       <p>Ваша бронь по объекту <b>${params.propertyTitle}</b> подтверждена.</p>
       <table cellpadding="6" style="margin:14px 0;font-size:14px;">
         <tr><td style="color:#888;">Заезд:</td><td><b>${params.checkIn}</b></td></tr>
         <tr><td style="color:#888;">Выезд:</td><td><b>${params.checkOut}</b></td></tr>
         <tr><td style="color:#888;">Итого:</td><td><b>${params.total.toLocaleString("ru-RU")} ₸</b></td></tr>
       </table>
       <p style="margin:24px 0;">${button(url + "/bookings", "Мои бронирования")}</p>`,
    ),
  };
}
