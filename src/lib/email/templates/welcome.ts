import { wrap, button } from "./_layout";

export function welcomeTemplate(params: { name?: string; appUrl?: string }) {
  const name = params.name?.trim() || "друг";
  const url = params.appUrl || "https://yurta.app";
  return {
    subject: "Добро пожаловать в YURTA",
    html: wrap(
      "Добро пожаловать",
      `<h1 style="margin:0 0 12px;font-size:22px;">Привет, ${name}!</h1>
       <p>Спасибо, что присоединились к <b>YURTA</b>. Теперь квартиры будут искать вас сами — просто опубликуйте заявку.</p>
       <p style="margin:24px 0;">${button(url + "/create-request", "Создать заявку")}</p>
       <p style="color:#666;font-size:13px;">Если кнопка не работает, откройте: ${url}/create-request</p>`,
    ),
  };
}
