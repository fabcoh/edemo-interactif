import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Paperclip, Send, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ChatPanelProps {
  sessionId: number;
  senderType: "presenter" | "viewer";
  senderName: string;
  showDeleteButton?: boolean;
  onLoadDocument?: (url: string, fileName: string, fileType: string) => void;
}

export default function ChatPanel({
  sessionId,
  senderType,
  senderName,
  showDeleteButton = true,
  onLoadDocument,
}: ChatPanelProps) {
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  // Query messages
  const messagesQuery = trpc.chat.getMessages.useQuery(
    { sessionId },
    { refetchInterval: 2000 }
  );

  const messages = messagesQuery.data || [];

  // Mutations
  const sendMessageMutation = trpc.chat.sendMessage.useMutation({
    onSuccess: () => {
      utils.chat.getMessages.invalidate({ sessionId });
      setMessageText("");
    },
  });

  const uploadFileMutation = trpc.chat.uploadFile.useMutation({
    onSuccess: (data) => {
      // Envoyer automatiquement le fichier dans le chat après upload
      const fileName = fileInputRef.current?.files?.[0]?.name || "Fichier";
      const fileType = fileInputRef.current?.files?.[0]?.type || "";
      
      sendMessageMutation.mutate({
        sessionId,
        senderType,
        senderName,
        message: fileName,
        videoUrl: data.url,
        fileType,
      });
    },
  });

  const deleteAllMessagesMutation = trpc.chat.deleteAllMessages.useMutation({
    onSuccess: () => {
      utils.chat.getMessages.invalidate({ sessionId });
    },
  });

  // Auto-scroll to bottom (désactivé pour éviter le scroll de toute la page)
  useEffect(() => {
    // Scroll uniquement le conteneur parent au lieu de scrollIntoView
    const messagesContainer = messagesEndRef.current?.parentElement;
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }, [messages]);

  // Handle send text message
  const handleSendMessage = () => {
    if (!messageText.trim()) return;

    sendMessageMutation.mutate({
      sessionId,
      senderType,
      senderName,
      message: messageText,
    });
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      const base64Data = base64.split(",")[1];

      uploadFileMutation.mutate({
        sessionId,
        fileName: file.name,
        fileData: base64Data,
        mimeType: file.type,
      });
    };
    reader.readAsDataURL(file);

    // Reset input
    e.target.value = "";
  };

  // Handle delete all messages
  const handleDeleteAll = () => {
    if (confirm("Supprimer tous les messages ?")) {
      deleteAllMessagesMutation.mutate({ sessionId });
    }
  };

  // Handle document click
  const handleDocumentClick = (url: string, fileName: string, fileType: string) => {
    if (onLoadDocument) {
      onLoadDocument(url, fileName, fileType);
    }
  };

  return (
    <Card className="bg-gray-800 border-gray-700 flex flex-col h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-sm">Chat</CardTitle>
          {showDeleteButton && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDeleteAll}
              className="text-red-400 hover:text-red-300 hover:bg-red-900/20 h-6 px-2"
            >
              <X className="w-3 h-3 mr-1" />
              <span className="text-xs">Tout supprimer</span>
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-2 space-y-2 overflow-hidden">
        {/* Messages Area (3/4 height) */}
        <div className="flex-[3] overflow-y-auto space-y-2 p-2 bg-gray-900 rounded">
          {messages.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">Aucun message</p>
          ) : (
            messages.map((msg) => {
              const isPresenter = msg.senderType === "presenter";
              const isDocument = msg.videoUrl && msg.fileType;

              return (
                <div
                  key={msg.id}
                  className={`flex ${isPresenter ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-2 ${
                      isPresenter
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-white"
                    }`}
                  >
                    <p className="text-[10px] font-semibold mb-1">{msg.senderName}</p>
                    
                    {isDocument ? (
                      <button
                        onClick={() => handleDocumentClick(msg.videoUrl!, msg.message, msg.fileType || 'image')}
                        className="text-left w-full hover:underline"
                      >
                        <div className="flex items-center gap-1">
                          <Paperclip className="w-3 h-3" />
                          <span className="text-sm break-all">{msg.message}</span>
                        </div>
                      </button>
                    ) : (
                      <p className="text-sm break-words">{msg.message}</p>
                    )}

                    <p className="text-[9px] text-gray-300 mt-1 text-right">
                      {new Date(msg.createdAt).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area (1/4 height) */}
        <div className="flex-[1] flex items-center gap-2">
          {/* File Upload Button (Trombone) */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            className="text-gray-400 hover:text-white hover:bg-gray-700 h-8 w-8 p-0"
            title="Joindre un fichier"
          >
            <Paperclip className="w-4 h-4" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,video/*,application/pdf"
            onChange={handleFileUpload}
          />

          {/* Text Input */}
          <Input
            type="text"
            placeholder="Écrire un message..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            className="flex-1 bg-gray-700 border-gray-600 text-white text-sm h-8"
            autoComplete="off"
          />

          {/* Send Button */}
          <Button
            size="sm"
            onClick={handleSendMessage}
            disabled={!messageText.trim()}
            className="bg-green-600 hover:bg-green-700 h-8 w-8 p-0"
            title="Envoyer"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

