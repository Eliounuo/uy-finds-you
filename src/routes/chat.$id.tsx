import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { useAuth } from "@/lib/use-auth";
import { chatMessagesQuery, chatHeaderQuery } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime } from "@/lib/mock-data";

export const Route = createFileRoute("/chat/$id")({ component: ChatRoom });

function ChatRoom() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: header } = useQuery(chatHeaderQuery(id));
  const { data: messages = [], isLoading } = useQuery(chatMessagesQuery(id));
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    const channel = supabase
      .channel(`messages:${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `chat_id=eq.${id}` }, () => {
        qc.invalidateQueries({ queryKey: ["chat-messages", id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, qc]);

  const send = async () => {
    if (!text.trim() || !user || sending) return;
    setSending(true);
    const body = text.trim();
    setText("");
    await supabase.from("messages").insert({ chat_id: id, sender_id: user.id, body });
    qc.invalidateQueries({ queryKey: ["chat-messages", id] });
    setSending(false);
  };

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <Link to="/chat" className="grid h-9 w-9 place-items-center rounded-full bg-card ring-1 ring-border"><ArrowLeft className="h-4 w-4"/></Link>
        <div className="min-w-0 flex-1">
          <div className="truncate font-display font-bold">{header?.properties?.title ?? "Диалог"}</div>
          <div className="text-[11px] text-muted-foreground">{header?.properties?.city}</div>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
        {isLoading && <div className="flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground"/></div>}
        {messages.map((m) => {
          const mine = m.sender_id === user?.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-card ring-1 ring-border"}`}>
                <div>{m.body}</div>
                <div className={`mt-0.5 text-[10px] ${mine ? "opacity-80" : "text-muted-foreground"}`}>{formatDateTime(m.created_at)}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="safe-bottom flex items-center gap-2 border-t border-border bg-background px-3 py-2">
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Сообщение…" maxLength={1000}
          className="flex-1 rounded-full bg-card px-4 py-2.5 text-sm outline-none ring-1 ring-border"/>
        <button onClick={send} disabled={!text.trim() || sending} className="grid h-11 w-11 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-50">
          {sending ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4"/>}
        </button>
      </div>
    </div>
  );
}
