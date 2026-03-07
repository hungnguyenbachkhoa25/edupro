import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useSocket } from "@/hooks/use-socket";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Send, 
  MessageSquare, 
  MoreVertical,
  Check,
  CheckCheck,
  User
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ChatPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChatPanel({ open, onOpenChange }: ChatPanelProps) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [], isLoading: isLoadingConversations } = useQuery<any[]>({
    queryKey: [api.conversations.list.path],
    enabled: open,
  });

  const { data: messages = [], isLoading: isLoadingMessages } = useQuery<any[]>({
    queryKey: [api.conversations.messages.path.replace(":id", selectedConversationId || "")],
    enabled: open && !!selectedConversationId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: string; content: string }) => {
      await apiRequest(
        "POST",
        api.conversations.sendMessage.path.replace(":id", conversationId),
        { content }
      );
    },
    onSuccess: () => {
      setMessageInput("");
      if (selectedConversationId) {
        queryClient.invalidateQueries({ queryKey: [api.conversations.messages.path.replace(":id", selectedConversationId)] });
      }
      queryClient.invalidateQueries({ queryKey: [api.conversations.list.path] });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      await apiRequest("PATCH", api.conversations.read.path.replace(":id", conversationId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.conversations.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.messages.unreadCount.path] });
    },
  });

  useEffect(() => {
    if (selectedConversationId && open) {
      markReadMutation.mutate(selectedConversationId);
      socket?.emit("join:conversation", selectedConversationId);
      return () => {
        socket?.emit("leave:conversation", selectedConversationId);
      };
    }
  }, [selectedConversationId, open, socket]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: any) => {
      if (selectedConversationId && message.conversationId === selectedConversationId) {
        queryClient.setQueryData(
          [api.conversations.messages.path.replace(":id", selectedConversationId)],
          (old: any[] = []) => [...old, message]
        );
        markReadMutation.mutate(selectedConversationId);
      }
      queryClient.invalidateQueries({ queryKey: [api.conversations.list.path] });
    };

    const handleTyping = ({ conversationId, userName, userId: typingUserId }: any) => {
      if (typingUserId === user?.id) return;
      
      setTypingUsers(prev => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] || []).filter(u => u !== userName), userName]
      }));

      setTimeout(() => {
        setTypingUsers(prev => ({
          ...prev,
          [conversationId]: (prev[conversationId] || []).filter(u => u !== userName)
        }));
      }, 3000);
    };

    socket.on("message:new", handleNewMessage);
    socket.on("message:typing", handleTyping);

    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("message:typing", handleTyping);
    };
  }, [socket, selectedConversationId, user?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, typingUsers]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedConversationId) return;
    sendMessageMutation.mutate({ conversationId: selectedConversationId, content: messageInput });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    if (selectedConversationId && socket) {
      socket.emit("message:typing", {
        conversationId: selectedConversationId,
        userId: user?.id,
        userName: user?.firstName || "User",
      });
    }
  };

  const formatMessageTime = (date: string | Date) => {
    const d = new Date(date);
    if (isToday(d)) return format(d, "HH:mm");
    if (isYesterday(d)) return "Hôm qua " + format(d, "HH:mm");
    return format(d, "dd/MM/yyyy HH:mm");
  };

  const selectedConversation = conversations.find((c: any) => c.id === selectedConversationId);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="p-0 sm:max-w-[800px] w-full flex flex-row">
        {/* Conversation List Sidebar */}
        <div className="w-[300px] border-r border-border flex flex-col bg-muted/30">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Tin nhắn
            </SheetTitle>
            <SheetDescription>Hỗ trợ & Học tập</SheetDescription>
          </SheetHeader>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {isLoadingConversations ? (
                Array(5).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-24 bg-muted rounded" />
                      <div className="h-3 w-full bg-muted rounded" />
                    </div>
                  </div>
                ))
              ) : conversations.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  <p>Không có hội thoại nào</p>
                </div>
              ) : (
                conversations.map((conv: any) => (
                  <button
                    key={conv.id}
                    data-testid={`button-conversation-${conv.id}`}
                    onClick={() => setSelectedConversationId(conv.id)}
                    className={cn(
                      "w-full flex items-start gap-3 p-3 rounded-lg transition-all text-left hover:bg-accent",
                      selectedConversationId === conv.id && "bg-accent shadow-sm"
                    )}
                  >
                    <Avatar className="w-10 h-10 border border-border">
                      <AvatarImage src="" />
                      <AvatarFallback>
                        <User className="w-5 h-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-medium truncate">EduPro Support</span>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {conv.lastMessage && formatMessageTime(conv.lastMessage.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        <p className={cn(
                          "text-xs truncate text-muted-foreground",
                          conv.unreadCount > 0 && "text-foreground font-semibold"
                        )}>
                          {conv.lastMessage?.content || "Chưa có tin nhắn"}
                        </p>
                        {conv.unreadCount > 0 && (
                          <Badge variant="default" className="h-4 px-1 min-w-[16px] flex items-center justify-center text-[10px]">
                            {conv.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Message Area */}
        <div className="flex-1 flex flex-col bg-background">
          {selectedConversationId ? (
            <>
              <div className="p-4 border-b flex items-center justify-between bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src="" />
                    <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-sm font-semibold">EduPro Support</h3>
                    <div className="text-[10px] text-green-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      Trực tuyến
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>

              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((msg: any, index: number) => {
                    const isMe = msg.senderId === user?.id;
                    const showTime = index === 0 || 
                      new Date(msg.createdAt).getTime() - new Date(messages[index-1].createdAt).getTime() > 1000 * 60 * 5;

                    return (
                      <div key={msg.id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                        {showTime && (
                          <span className="text-[10px] text-muted-foreground my-2 w-full text-center">
                            {formatMessageTime(msg.createdAt)}
                          </span>
                        )}
                        <div className={cn(
                          "max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                          isMe 
                            ? "bg-primary text-primary-foreground rounded-tr-none" 
                            : "bg-muted text-foreground rounded-tl-none border border-border/50"
                        )}>
                          {msg.content}
                        </div>
                        {isMe && index === messages.length - 1 && (
                          <div className="flex items-center gap-1 mt-1">
                            {msg.isRead ? (
                              <CheckCheck className="w-3 h-3 text-primary" />
                            ) : (
                              <Check className="w-3 h-3 text-muted-foreground" />
                            )}
                            <span className="text-[9px] text-muted-foreground">
                              {msg.isRead ? "Đã xem" : "Đã gửi"}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {typingUsers[selectedConversationId]?.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse italic">
                      <Avatar className="w-5 h-5">
                        <AvatarFallback><User className="w-3 h-3" /></AvatarFallback>
                      </Avatar>
                      {typingUsers[selectedConversationId].join(", ")} đang gõ...
                    </div>
                  )}
                  <div ref={scrollRef} />
                </div>
              </ScrollArea>

              <div className="p-4 border-t bg-card/50">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <Input
                    data-testid="input-chat-message"
                    value={messageInput}
                    onChange={handleInputChange}
                    placeholder="Nhập tin nhắn..."
                    className="flex-1"
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    disabled={!messageInput.trim() || sendMessageMutation.isPending}
                    data-testid="button-send-message"
                    className="hover-elevate"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Hộp thư hỗ trợ</h3>
              <p className="text-sm">Chọn một hội thoại để bắt đầu nhắn tin hoặc liên hệ với đội ngũ hỗ trợ EduPro.</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
