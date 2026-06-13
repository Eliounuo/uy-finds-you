import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { chats } from "@/lib/mock-data";

export const Route = createFileRoute("/pro/chat")({
  component: ProChatList,
});

function ProChatList() {
  return (
    <>
      <AppHeader title="Чат с клиентами" />
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
                <span className="truncate font-display font-bold">Клиент: {c.withName}</span>
                <span className="shrink-0 text-[11px] text-muted-foreground">{c.lastTime}</span>
              </div>
              <div className="truncate text-xs text-muted-foreground">{c.propertyTitle}</div>
              <div className="truncate text-sm">{c.lastMessage}</div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
