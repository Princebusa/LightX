import Layout from "@/src/layout/index";
import { ChatBox } from "@/components/chat-box";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { createProject } from "@/lib/projects";
import { ApiError } from "@/lib/api";

export default function Dashboard() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (message: string) => {
    setSubmitting(true);
    setError(null);

    try {
      const project = await createProject({
        name: message.slice(0, 60) || "New project",
        description: message,
      });

      navigate(`/chat/${project.id}`, {
        state: { pendingMessage: message },
      });
    } catch (err) {
      const errorMessage =
        err instanceof ApiError
          ? err.message
          : "Failed to start a new chat";
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="h-[100vh] bg-[var(--sidebar))] p-3 pb-0">
        <div className="relative flex h-full flex-1 flex-col items-center justify-center overflow-hidden rounded-t-[20px] bg-[url('chat-bg.webp')] bg-cover bg-center">
          <div className="pointer-events-none absolute inset-0 h-full w-full bg-black/10" />

          <div className="relative z-10 flex w-full max-w-3xl flex-col items-center gap-8 px-6 py-12">
            <h1 className="text-center text-3xl font-semibold tracking-tight text-foreground sm:text-4xl font-[family-name:var(--primary-font)]">
              Ready to build, Prince?
            </h1>

            <ChatBox
              disabled={submitting}
              onSubmit={(message) => {
                void handleSubmit(message);
              }}
            />

            {error ? (
              <p className="text-center text-sm text-destructive">{error}</p>
            ) : null}
          </div>
        </div>
      </div>
    </Layout>
  );
}
