import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { ChatPanel } from "./chat-panel";
import { useSocket } from "@/hooks/use-socket";
import { queryClient } from "@/lib/queryClient";

export function MessageBadge() {
  const [open, setOpen] = useState(false);
  const { socket } = useSocket();

  const { data, isLoading } = useQuery<{ count: number }>({
    queryKey: [api.messages.unreadCount.path],
  });

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = () => {
      queryClient.invalidateQueries({ queryKey: [api.messages.unreadCount.path] });
    };

    socket.on("message:received", handleNewMessage);
    socket.on("message:new", handleNewMessage);

    return () => {
      socket.off("message:received", handleNewMessage);
      socket.off("message:new", handleNewMessage);
    };
  }, [socket]);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        data-testid="button-open-chat"
        className="relative hover-elevate"
        onClick={() => setOpen(true)}
      >
        <MessageSquare className="w-5 h-5" />
        {data && data.count > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px] border-2 border-background"
          >
            {data.count > 9 ? "9+" : data.count}
          </Badge>
        )}
      </Button>

      <ChatPanel open={open} onOpenChange={setOpen} />
    </>
  );
}
