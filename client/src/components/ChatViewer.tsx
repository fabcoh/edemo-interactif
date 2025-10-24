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

  // Removed auto-scroll to prevent page jumping

  const messages = messagesQuery.data || [];

  if (messages.length === 0) {
    return null; // Don't show chat if no messages
  }

  return (
    <Card className="bg-transparent border-none flex flex-col max-h-[400px] shadow-none">
      <CardHeader className="pb-1 pt-2 px-2 border-b border-gray-600 bg-gray-800 bg-opacity-80 rounded-t-lg">
        <CardTitle className="text-[11px] flex items-center gap-1">
          💬 Messages du Présentateur
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-1 overflow-y-auto space-y-1 bg-transparent flex-col-reverse">
        {[...messages].reverse().map((msg) => (
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

