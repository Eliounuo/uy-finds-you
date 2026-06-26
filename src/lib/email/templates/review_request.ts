import { wrap, button } from "./_layout";

export function reviewRequestTemplate(params: {
  propertyTitle: string;
  bookingId: string;
  appUrl?: string;
}) {
  const url = params.appUrl || "https://yurta.app";
  return {
    subject: "Оцените ваше проживание",
    html: wrap(
      "Оставьте отзыв",
      `<h1 style="margin:0 0 12px;font-size:22px;">Как прошло проживание?</h1>
       <p>Поделитесь впечатлениями об объекте <b>${params.propertyTitle}</b>. Это поможет другим арендаторам и хозяину.</p>
       <p style="margin:24px 0;">${button(url + "/bookings/" + params.bookingId, "Оставить отзыв")}</p>`,
    ),
  };
}
