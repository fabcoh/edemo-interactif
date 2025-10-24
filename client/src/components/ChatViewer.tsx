import { useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Paperclip, Link as LinkIcon } from "lucide-react";

interface ChatViewerProps {
  sessionId: number;
}

export function ChatViewer({ sessionId }: ChatViewerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Query messages
  const messagesQuery = trpc.chat.getMessages.useQuery(
    { sessionId },
    { refetchInterval: 2000 }
  );

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesQuery.data]);

  const messages = messagesQuery.data || [];

  if (messages.length === 0) {
    return null; // Don't show chat if no messages
  }

  return (
    <Card className="bg-gray-800 border-gray-700 flex flex-col max-h-[300px]">
      <CardHeader className="pb-2 border-b border-gray-700">
        <CardTitle className="text-xs flex items-center gap-2">
          💬 Messages du Présentateur
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-2 overflow-y-auto space-y-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className="bg-green-600 rounded-lg p-2 max-w-[85%] ml-auto"
          >
            {msg.messageType === "text" && (
              <p className="text-xs text-white break-words">{msg.content}</p>
            )}
            {msg.messageType === "video_link" && (
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-white">
                  <LinkIcon className="w-3 h-3" />
                  <span className="font-semibold">Lien vidéo</span>
                </div>
                <a
                  href={msg.content || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-200 underline break-all"
                >
                  {msg.content}
                </a>
              </div>
            )}
            {msg.messageType === "document" && (
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-white">
                  <Paperclip className="w-3 h-3" />
                  <span className="font-semibold">Document</span>
                </div>
                <a
                  href={msg.fileUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-200 underline break-all"
                >
                  {msg.fileName}
                </a>
              </div>
            )}
            <div className="text-[10px] text-gray-200 mt-1 text-right">
              {new Date(msg.createdAt).toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </CardContent>
    </Card>
  );
}

