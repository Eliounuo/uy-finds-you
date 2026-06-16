import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle, Loader2 } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { useAuth } from "@/lib/use-auth";
import { myChatsQuery } from "@/lib/queries";
import { formatDateTime } from "@/lib/mock-data";

export const Route = createFileRoute("/pro/chat")({ component: ProChatList });

function ProChatList() {
  const { user } = useAuth();
  const { data = [], isLoading } = useQuery(myChatsQuery(user?.id ?? null));

  return (
    <>
      <AppHeader title="Сообщения" />
      <div className="space-y-2 px-4 pt-2 pb-32">
        {!user && (
          <div className="rounded-2xl bg-card p-6 text-center ring-1 ring-border">
            <p className="text-sm text-muted-foreground">Войдите, чтобы переписываться</p>
          </div>
        )}
        {user && isLoading && (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {user && !isLoading && data.length === 0 && (
          <div className="rounded-2xl bg-card p-6 text-center ring-1 ring-border">
            <MessageCircle className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">Пока нет диалогов</p>
          </div>
        )}
        {data.map((c) => (
          <Link
            key={c.id}
            to="/chat/$id"
            params={{ id: c.id }}
            className="flex items-center gap-3 rounded-2xl bg-card p-3 ring-1 ring-border"
          >
            {c.properties?.photos[0] ? (
              <img src={c.properties.photos[0]} alt="" className="h-12 w-12 rounded-xl object-cover" />
            ) : (
              <div className="h-12 w-12 rounded-xl bg-muted" />
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate font-display font-semibold">
                {c.properties?.title ?? "Диалог"}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatDateTime(c.last_message_at)}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
