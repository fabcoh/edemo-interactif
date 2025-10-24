import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Send, Paperclip, Link as LinkIcon, X } from "lucide-react";

interface ChatPanelProps {
  sessionId: number;
}

export function ChatPanel({ sessionId }: ChatPanelProps) {
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Query messages
  const messagesQuery = trpc.chat.getMessages.useQuery(
    { sessionId },
    { refetchInterval: 2000 }
  );

  // Mutation to send message
  const sendMessageMutation = trpc.chat.sendMessage.useMutation({
    onSuccess: () => {
      messagesQuery.refetch();
      setMessage("");
    },
  });

  // Removed auto-scroll to prevent page jumping

  const handleSendTextMessage = async () => {
    if (!message.trim()) return;

    // Check if it's a video link
    const isVideoLink = message.match(/^https?:\/\/(www\.)?(youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com)/i);

    await sendMessageMutation.mutateAsync({
      sessionId,
      messageType: isVideoLink ? "video_link" : "text",
      content: message.trim(),
    });
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      alert("Le fichier est trop volumineux. Maximum 100MB.");
      return;
    }

    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;

      await sendMessageMutation.mutateAsync({
        sessionId,
        messageType: "document",
        fileData: base64,
        fileName: file.name,
        mimeType: file.type,
      });

      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsDataURL(file);
  };

  const messages = messagesQuery.data || [];

  return (
    <Card className="bg-gray-800 border-gray-700 flex flex-col h-[400px]">
      <CardHeader className="pb-2 border-b border-gray-700">
        <CardTitle className="text-xs flex items-center gap-2">
          💬 Chat de Présentation
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-2 overflow-hidden">
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto space-y-2 mb-2">
          {messages.length === 0 ? (
            <div className="text-center text-gray-400 text-xs py-4">
              Aucun message. Commencez la conversation !
            </div>
          ) : (
            messages.map((msg) => (
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
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="flex gap-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="*/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 bg-gray-700 border-gray-600 hover:bg-gray-600"
            disabled={isUploading}
          >
            <Paperclip className="w-4 h-4" />
          </Button>
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendTextMessage();
              }
            }}
            placeholder="Message ou lien vidéo..."
            className="flex-1 h-8 text-xs bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
            disabled={isUploading}
          />
          <Button
            onClick={handleSendTextMessage}
            size="sm"
            className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700"
            disabled={!message.trim() || isUploading}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {isUploading && (
          <div className="text-xs text-gray-400 text-center mt-1">
            Envoi du fichier...
          </div>
        )}
      </CardContent>
    </Card>
  );
}

