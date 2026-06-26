import { wrap, button } from "./_layout";

export function verificationStatusTemplate(params: {
  approved: boolean;
  reason?: string;
  appUrl?: string;
}) {
  const url = params.appUrl || "https://yurta.app";
  if (params.approved) {
    return {
      subject: "Верификация подтверждена ✅",
      html: wrap(
        "Верификация",
        `<h1 style="margin:0 0 12px;font-size:22px;">Поздравляем!</h1>
         <p>Ваш аккаунт прошёл верификацию. Теперь у вас есть значок ✅ — клиенты доверяют вам больше.</p>
         <p style="margin:24px 0;">${button(url + "/profile", "Открыть профиль")}</p>`,
      ),
    };
  }
  return {
    subject: "Заявка на верификацию отклонена",
    html: wrap(
      "Верификация",
      `<h1 style="margin:0 0 12px;font-size:22px;">Заявка отклонена</h1>
       ${params.reason ? `<p>Причина: <b>${params.reason}</b></p>` : ""}
       <p>Вы можете отправить новую заявку, исправив замечания.</p>
       <p style="margin:24px 0;">${button(url + "/profile/verification", "Подать снова")}</p>`,
    ),
  };
}
