import { useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ChatBoxProps = {
  placeholder?: string;
  onSubmit?: (message: string) => void;
  className?: string;
  disabled?: boolean;
};

export function ChatBox({
  placeholder = "Ask LightX to create a dashboard to...",
  onSubmit,
  className,
  disabled = false,
}: ChatBoxProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (disabled) return;
    const trimmed = message.trim();
    if (!trimmed) return;
    onSubmit?.(trimmed);
    setMessage("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  };

  const canSubmit = message.trim().length > 0;

  return (
    <div
      className={cn(
        "w-full rounded-3xl border border-border/60 bg-card/95 p-4 shadow-2xl backdrop-blur-xl",
        "dark:border-white/10 dark:bg-zinc-900/95",
        className,
      )}
    >
      <textarea
        ref={textareaRef}
        value={message}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={1}
        disabled={disabled}
        className={cn(
          "min-h-14 w-full resize-none bg-transparent text-base text-foreground outline-none",
          "placeholder:text-muted-foreground",
          "font-[family-name:var(--primary-font)]",
        )}
      />

      <div className="flex items-center justify-end pt-2">
          <Button
            type="button"
            size="icon"
            disabled={!canSubmit || disabled}
            onClick={handleSubmit}
            className={cn(
              "size-9 rounded-full transition-all",
              canSubmit
                ? "bg-foreground text-background hover:bg-foreground/90"
                : "bg-muted text-muted-foreground",
            )}
            aria-label="Send message"
          >
            <ArrowUp className="size-4" />
          </Button>
       
      </div>
    </div>
  );
}
