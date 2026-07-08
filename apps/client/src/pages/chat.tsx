import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Layout from "@/src/layout/index";
import { ChatBox } from "@/components/chat-box"
import { cn } from "@/lib/utils";
import {
  getProjectMessages,
  streamProjectChat,
  toUiMessage,
} from "@/lib/projects";
import { ApiError } from "@/lib/api";

type UiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
};

type ChatLocationState = {
  pendingMessage?: string;
};

export default function ChatPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const pendingMessage = (location.state as ChatLocationState | null)
    ?.pendingMessage;

  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const pendingSentRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText]);

  const loadHistory = useCallback(async () => {
    if (!projectId) return;

    setLoading(true);
    setError(null);

    try {
      const history = await getProjectMessages(projectId);
      setMessages(history.map(toUiMessage));
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Failed to load chat history";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!projectId || !content.trim() || sending) return;

      setSending(true);
      setError(null);
      setStreamingText("");

      const optimisticId = `temp-${crypto.randomUUID()}`;
      setMessages((prev) => [
        ...prev,
        { id: optimisticId, role: "user", content },
      ]);

      try {
        await streamProjectChat(projectId, content, (event) => {
          if (event.type === "agent_thinking") {
            const text =
              typeof event.data.message === "string" ? event.data.message : "";
            if (text) setStreamingText(text);
          }

          if (event.type === "agent_complete") {
            const text =
              typeof event.data.message === "string" ? event.data.message : "";
            if (text) {
              setMessages((prev) => [
                ...prev,
                {
                  id: crypto.randomUUID(),
                  role: "assistant",
                  content: text,
                },
              ]);
            }
            setStreamingText("");
          }

          if (event.type === "preview_ready") {
            const url =
              typeof event.data.previewUrl === "string"
                ? event.data.previewUrl
                : null;
            if (url) setPreviewUrl(url);
          }

          if (event.type === "error") {
            const text =
              typeof event.data.message === "string"
                ? event.data.message
                : "Something went wrong";
            setError(text);
          }
        });

        const history = await getProjectMessages(projectId);
        setMessages(history.map(toUiMessage));
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : "Failed to send message";
        setError(message);
        setMessages((prev) => prev.filter((item) => item.id !== optimisticId));
      } finally {
        setSending(false);
        setStreamingText("");
      }
    },
    [projectId, sending],
  );

  useEffect(() => {
    if (!projectId) {
      navigate("/dashboard", { replace: true });
      return;
    }

    void loadHistory();
  }, [projectId, loadHistory, navigate]);

  useEffect(() => {
    if (
      !projectId ||
      !pendingMessage ||
      pendingSentRef.current ||
      loading ||
      sending
    ) {
      return;
    }

    pendingSentRef.current = true;
    navigate(`/chat/${projectId}`, { replace: true, state: {} });
    void sendMessage(pendingMessage);
  }, [
    projectId,
    pendingMessage,
    loading,
    sending,
    navigate,
    sendMessage,
  ]);

  return (
    <Layout>
      <div className="h-[100vh] bg-[var(--sidebar))] p-3 pb-0">
        <div className="relative flex h-full flex-col overflow-hidden rounded-t-[20px]  bg-cover bg-center">
          <div className="pointer-events-none absolute inset-0 bg-black/10" />

          <div className="relative z-10 flex flex-1 flex-col">
            <div className="flex-1 space-y-6 overflow-y-auto px-4 py-8 sm:px-8">
              {loading ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-muted-foreground">
                    Loading chat...
                  </p>
                </div>
              ) : messages.length === 0 && !streamingText ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-muted-foreground">
                    Start a conversation below
                  </p>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex",
                        message.role === "user"
                          ? "justify-end"
                          : "justify-start",
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap sm:max-w-[70%]",
                          message.role === "user"
                            ? "bg-foreground text-background"
                            : "border border-border/60 bg-card/90 text-foreground backdrop-blur",
                        )}
                      >
                        {message.content}
                      </div>
                    </div>
                  ))}

                  {streamingText ? (
                    <div className="flex justify-start">
                      <div className="max-w-[85%] rounded-2xl border border-border/60 bg-card/90 px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap text-foreground backdrop-blur sm:max-w-[70%]">
                        {streamingText}
                      </div>
                    </div>
                  ) : null}

                  {sending && !streamingText ? (
                    <div className="flex justify-start">
                      <div className="rounded-2xl border border-border/60 bg-card/90 px-4 py-3 text-sm text-muted-foreground backdrop-blur">
                        Thinking...
                      </div>
                    </div>
                  ) : null}
                </>
              )}

              {error ? (
                <p className="text-center text-sm text-destructive">{error}</p>
              ) : null}

              <div ref={messagesEndRef} />
            </div>

            {previewUrl ? (
              <div className="border-t border-white/10 bg-background/40 p-4 backdrop-blur-md">
                <div className="mx-auto aspect-video w-full max-w-4xl overflow-hidden rounded-xl border border-border/60 bg-background">
                  <iframe
                    src={previewUrl}
                    title="Project preview"
                    className="h-full w-full"
                  />
                </div>
              </div>
            ) : null}

            <div className="border-t border-white/10 bg-background/40 p-4 backdrop-blur-md">
              <div className="mx-auto w-full max-w-3xl">
                <ChatBox
                  placeholder="Ask LightX to update your project..."
                  disabled={loading || sending}
                  onSubmit={(content) => {
                    void sendMessage(content);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
