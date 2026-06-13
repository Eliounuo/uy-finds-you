import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { chats } from "@/lib/mock-data";
import { useApp } from "@/lib/app-mode";

export const Route = createFileRoute("/chat/")({
  component: ChatList,
});

function ChatList() {
  const { mode } = useApp();
  return (
    <>
      <AppHeader title="Сообщения" />
      <div className="px-2 pt-2 pb-32">
        {chats.map((c) => (
          <Link
            key={c.id}
            to="/chat/$id"
            params={{ id: c.id }}
            className="flex items-center gap-3 rounded-2xl px-2 py-3 active:bg-muted"
          >
            <img src={c.withAvatar} alt={c.withName} className="h-12 w-12 rounded-full object-cover" />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate font-display font-bold">{c.withName}</span>
                <span className="shrink-0 text-[11px] text-muted-foreground">{c.lastTime}</span>
              </div>
              <div className="truncate text-xs text-muted-foreground">{c.propertyTitle}</div>
              <div className="mt-0.5 flex items-center justify-between gap-2">
                <span className="truncate text-sm">{c.lastMessage}</span>
                {c.unread > 0 && (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">
                    {c.unread}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
        {mode === "pro" && chats.length === 0 && (
          <p className="mt-10 text-center text-sm text-muted-foreground">
            Здесь появятся диалоги с клиентами.
          </p>
        )}
      </div>
    </>
  );
}
