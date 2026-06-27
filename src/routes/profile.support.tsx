import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, MessageCircle, Mail, Phone, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/profile/support")({
  component: SupportPage,
});

const FAQS = [
  {
    q: "Как разместить жильё?",
    a: "Профиль → «Сдача недвижимости» → «Стать хозяином». После активации появится кабинет владельца с разделом «Объекты».",
  },
  {
    q: "Как подтвердить личность?",
    a: "Профиль → Верификация. Загрузите фото удостоверения личности. Проверка занимает до 24 часов.",
  },
  {
    q: "Как отменить бронирование?",
    a: "Раздел «Бронирования» → выберите нужное → кнопка «Отменить». Условия возврата зависят от владельца.",
  },
  {
    q: "Почему не приходят уведомления?",
    a: "Профиль → Настройки → Уведомления. Убедитесь, что уведомления разрешены в браузере и выбраны нужные типы.",
  },
  {
    q: "Как пожаловаться на объявление?",
    a: "На странице объявления нажмите «⋯» → «Пожаловаться». Модераторы рассмотрят в течение 24 часов.",
  },
];

function SupportPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="safe-top sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/85 px-4 pb-2 pt-4 backdrop-blur-lg">
        <Link
          to="/profile"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-card ring-1 ring-border"
          aria-label="Назад"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="font-display text-lg font-semibold">Поддержка</h1>
      </header>

      <main className="space-y-4 px-4 pt-4 pb-24">
        <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 px-4 py-4 ring-1 ring-primary/20">
          <p className="text-sm font-semibold">Нужна помощь?</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Отвечаем в Telegram и WhatsApp ежедневно с 9:00 до 22:00 (Алматы, UTC+5).
          </p>
        </div>

        <div>
          <h3 className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Связаться
          </h3>
          <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-border">
            <ContactRow
              icon={MessageCircle}
              label="Telegram"
              value="@yurta_support"
              href="https://t.me/yurta_support"
            />
            <ContactRow
              icon={Phone}
              label="WhatsApp"
              value="+7 700 000 00 00"
              href="https://wa.me/77000000000"
            />
            <ContactRow
              icon={Mail}
              label="Email"
              value="support@yurta.app"
              href="mailto:support@yurta.app"
            />
          </div>
        </div>

        <div>
          <h3 className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Частые вопросы
          </h3>
          <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-border">
            {FAQS.map((faq, i) => (
              <FaqRow key={i} question={faq.q} answer={faq.a} last={i === FAQS.length - 1} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

function ContactRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  href: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 border-b border-border px-4 py-3.5 last:border-0 active:bg-muted/50"
    >
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm font-semibold">{value}</div>
      </div>
      <ChevronDown className="h-4 w-4 -rotate-90 text-muted-foreground" />
    </a>
  );
}

function FaqRow({ question, answer, last }: { question: string; answer: string; last: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={last ? "" : "border-b border-border"}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
      >
        <span className="flex-1 text-sm font-semibold">{question}</span>
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>
      {open && (
        <p className="px-4 pb-3.5 text-xs leading-relaxed text-muted-foreground">{answer}</p>
      )}
    </div>
  );
}
