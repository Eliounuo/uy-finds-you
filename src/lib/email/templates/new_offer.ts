import { wrap, button } from "./_layout";

export function newOfferTemplate(params: {
  tenantName?: string;
  propertyTitle: string;
  price: number;
  appUrl?: string;
}) {
  const url = params.appUrl || "https://yurta.app";
  const name = params.tenantName?.trim() || "друг";
  return {
    subject: `Новое предложение: ${params.propertyTitle}`,
    html: wrap(
      "Новое предложение",
      `<h1 style="margin:0 0 12px;font-size:22px;">${name}, вам пришло новое предложение!</h1>
       <p><b>${params.propertyTitle}</b></p>
       <p style="font-size:20px;font-weight:700;color:#9B1C1C;">${params.price.toLocaleString("ru-RU")} ₸ / сутки</p>
       <p style="margin:24px 0;">${button(url + "/requests", "Посмотреть оффер")}</p>`,
    ),
  };
}
