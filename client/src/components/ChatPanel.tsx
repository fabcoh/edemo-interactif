import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Paperclip, Send, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
  const messagesContainerRef = useRef<HTMLDivElement>(null);
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

  // Auto-scroll to top when new messages arrive (derniers messages en haut)
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = 0;
    }
  }, [messages]);

  // Handle send message
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
      uploadFileMutation.mutate({
        sessionId,
        fileName: file.name,
        fileData: base64,
        mimeType: file.type,
      });
    };
    reader.readAsDataURL(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
    <div className="flex flex-col h-full bg-gray-800 rounded-lg overflow-hidden" style={{border: '1px solid rgb(55, 65, 81)'}}>
      {/* Input Area - EN HAUT */}
      <div className="flex items-center gap-2 p-2" style={{borderBottom: '1px solid rgb(55, 65, 81)'}}>
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
          className="flex-1 bg-gray-700 border-gray-600 text-white h-10"
          autoComplete="off"
        />

        {/* Send Button */}
        <Button
          size="sm"
          onClick={handleSendMessage}
          disabled={!messageText.trim()}
          className="bg-green-600 hover:bg-green-700 h-10 px-4 flex-shrink-0"
        >
          <Send className="w-5 h-5" />
        </Button>

        {/* Delete All Button */}
        {showDeleteButton && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDeleteAll}
            className="text-red-400 hover:text-red-300 hover:bg-red-900/20 h-10 px-3 flex-shrink-0"
            title="Tout supprimer"
          >
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Messages Area - EN BAS */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto space-y-2 p-3 bg-gray-900"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const files = e.dataTransfer.files;
          if (files.length > 0) {
            const file = files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64 = reader.result as string;
              uploadFileMutation.mutate({
                sessionId,
                fileName: file.name,
                fileData: base64,
                mimeType: file.type,
              });
            };
            reader.readAsDataURL(file);
          }
        }}
      >
        {messages.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Glisser un fichier ici</p>
        ) : (
          [...messages].reverse().map((msg) => {
            const isPresenter = msg.senderType === "presenter";
            const isDocument = msg.videoUrl && msg.fileType;

            return (
              <div
                key={msg.id}
                className="flex flex-col w-full"
              >
                {isDocument ? (
                  // Documents sans bulle
                  <div className={`flex ${isPresenter ? "justify-end" : "justify-start"}`}>
                    <button
                      onClick={() => handleDocumentClick(msg.videoUrl!, msg.message, msg.fileType || 'image')}
                      className="text-left"
                    >
                      {/* Aperçu vignette pour images */}
                      {msg.fileType === 'image' && (
                        <div>
                          <img 
                            src={msg.videoUrl} 
                            alt={msg.message}
                            className="w-full max-w-[200px] hover:opacity-80 transition-opacity"
                          />
                        </div>
                      )}
                      {/* Icône pour PDF */}
                      {msg.fileType === 'pdf' && (
                        <div className="flex items-center justify-center p-3 hover:opacity-80 transition-opacity">
                          <div className="text-4xl">📄</div>
                        </div>
                      )}
                      {/* Icône pour vidéo */}
                      {msg.fileType === 'video' && (
                        <div className="flex items-center justify-center p-3 hover:opacity-80 transition-opacity">
                          <div className="text-4xl">🎬</div>
                        </div>
                      )}
                    </button>
                  </div>
                ) : (
                  // Messages texte avec bulle
                  <div className={`flex ${isPresenter ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`rounded-lg px-3 py-1.5 ${
                        isPresenter
                          ? "bg-green-600 text-white"
                          : "bg-blue-600 text-white"
                      }`}
                    >
                      <p className="text-xs break-words">{msg.message}</p>
                    </div>
                  </div>
                )}
                {/* Heure en dessous, alignée selon l'expéditeur */}
                <p className={`text-[8px] text-gray-400 mt-0.5 ${isPresenter ? "text-right" : "text-left"}`}>
                  {new Date(msg.createdAt).toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

