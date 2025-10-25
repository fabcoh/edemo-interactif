import { useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Paperclip, Link as LinkIcon, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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

  const messages = messagesQuery.data || [];

  return (
    <div className="bg-gray-800 bg-opacity-70 border-t border-gray-700 flex flex-col h-[180px]">
      {/* Input Bar - At the top */}
      <div className="flex gap-2 p-1.5 border-b border-gray-700">
        <Input
          type="text"
          placeholder="Écrire un message..."
          className="flex-1 bg-gray-700 border-gray-600 text-white text-sm h-8"
        />
        <Button size="sm" className="bg-green-600 hover:bg-green-700 h-8 px-3">
          <Send className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Messages Display */}
      <div className="flex-1 overflow-y-auto space-y-1 flex flex-col-reverse justify-end p-1.5">
        {messages.length === 0 ? (
          <p className="text-xs text-gray-400 text-center">Aucun message</p>
        ) : (
          [...messages].reverse().map((msg) => (
            <div
              key={msg.id}
              className="bg-green-700 bg-opacity-80 rounded-lg p-2 max-w-[85%] ml-auto"
            >
              {msg.messageType === "text" && (
                <p className="text-sm text-white break-words">{msg.content}</p>
              )}
              {msg.messageType === "video_link" && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-sm text-white">
                    <LinkIcon className="w-3 h-3" />
                    <span className="font-semibold">Lien vidéo</span>
                  </div>
                  <a
                    href={msg.content || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-300 underline break-all hover:text-blue-200"
                  >
                    {msg.content}
                  </a>
                </div>
              )}
              {msg.messageType === "document" && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-sm text-white">
                    <Paperclip className="w-3 h-3" />
                    <span className="font-semibold">Document</span>
                  </div>
                  <a
                    href={msg.fileUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-300 underline break-all hover:text-blue-200"
                  >
                    {msg.fileName}
                  </a>
                </div>
              )}
              <div className="text-[10px] text-gray-300 mt-1 text-right">
                {new Date(msg.createdAt).toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

