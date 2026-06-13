import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Send } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { chats, type ChatThread } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/chat/$id")({
  component: ChatRoom,
  loader: ({ params }) => {
    const c = chats.find((x) => x.id === params.id);
    if (!c) throw notFound();
    return c;
  },
  notFoundComponent: () => (
    <div className="p-6 text-center text-sm text-muted-foreground">Чат не найден</div>
  ),
});

function ChatRoom() {
  const chat = Route.useLoaderData() as ChatThread;
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<ChatThread["messages"]>(chat.messages);


  const send = () => {
    if (!text.trim()) return;
    setMessages((m) => [
      ...m,
      { id: String(Date.now()), from: "me" as const, text: text.trim(), time: "сейчас" },
    ]);
    setText("");
  };

  return (
    <div className="flex h-screen flex-col">
      <AppHeader
        back
        right={
          <div className="flex items-center gap-2">
            <img src={chat.withAvatar} alt="" className="h-9 w-9 rounded-full object-cover" />
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold">{chat.withName}</span>
              <span className="text-[10px] text-muted-foreground">в сети</span>
            </div>
          </div>
        }
      />

      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
        <div className="mx-auto max-w-fit rounded-full bg-muted px-3 py-1 text-[11px] text-muted-foreground">
          По объекту: {chat.propertyTitle}
        </div>
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "flex",
              m.from === "me" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[78%] rounded-2xl px-3.5 py-2 text-sm",
                m.from === "me"
                  ? "rounded-br-md bg-primary text-primary-foreground"
                  : "rounded-bl-md bg-card ring-1 ring-border"
              )}
            >
              {m.text}
              <div
                className={cn(
                  "mt-0.5 text-[10px]",
                  m.from === "me" ? "text-primary-foreground/70" : "text-muted-foreground"
                )}
              >
                {m.time}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="safe-bottom flex items-center gap-2 border-t border-border bg-card px-3 py-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Сообщение…"
          className="flex-1 rounded-full bg-muted px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground"
        />
        <button
          onClick={send}
          className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground"
          aria-label="Отправить"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
