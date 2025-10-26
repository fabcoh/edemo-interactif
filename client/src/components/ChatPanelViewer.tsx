import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Paperclip, Send, FileText, Image as ImageIcon, Video } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ChatPanelViewerProps {
  sessionId: number;
  senderType: "presenter" | "viewer";
  senderName: string;
  onLoadDocument?: (url: string, fileName: string, fileType: string) => void;
}

export default function ChatPanelViewer({
  sessionId,
  senderType,
  senderName,
  onLoadDocument,
}: ChatPanelViewerProps) {
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

  // Extraire les fichiers des messages
  const files = messages
    .filter(msg => msg.videoUrl && msg.fileType)
    .map(msg => ({
      id: msg.id,
      url: msg.videoUrl!,
      name: msg.message,
      type: msg.fileType!,
    }));

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

  // Handle document click
  const handleDocumentClick = (url: string, fileName: string, fileType: string) => {
    if (onLoadDocument) {
      onLoadDocument(url, fileName, fileType);
    }
  };

  // Get icon for file type
  const getFileIcon = (type: string) => {
    if (type.startsWith('image')) return <ImageIcon className="w-4 h-4" />;
    if (type.startsWith('video')) return <Video className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Input Bar - Top */}
      <div className="bg-gray-800 border-b border-gray-700 p-3">
        <div className="flex items-center gap-2">
          {/* File Upload Button (Trombone) */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            className="text-gray-400 hover:text-white hover:bg-gray-700 h-9 w-9 p-0"
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
            className="flex-1 bg-gray-700 border-gray-600 text-white text-sm h-9"
            autoComplete="off"
          />

          {/* Send Button */}
          <Button
            size="sm"
            onClick={handleSendMessage}
            disabled={!messageText.trim()}
            className="bg-green-600 hover:bg-green-700 h-9 px-4"
          >
            <Send className="w-4 h-4 mr-1" />
            Envoyer
          </Button>
        </div>
      </div>

      {/* Main Content - 2 Columns */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column - Files (30%) */}
        <div className="w-[30%] border-r border-gray-700 overflow-y-auto bg-gray-800 p-2">
          <h3 className="text-xs font-semibold text-gray-400 mb-2 px-2">Fichiers partagés</h3>
          {files.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-4">Aucun fichier</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {files.map((file) => (
                <button
                  key={file.id}
                  onClick={() => handleDocumentClick(file.url, file.name, file.type)}
                  className="relative aspect-square rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all group bg-gray-700"
                  title={file.name}
                >
                  {/* Vignette */}
                  {file.type.startsWith('image') ? (
                    <img
                      src={file.url}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-2">
                      <div className="text-blue-400 mb-1">
                        {getFileIcon(file.type)}
                      </div>
                      <span className="text-[9px] text-white text-center line-clamp-2">{file.name}</span>
                    </div>
                  )}
                  
                  {/* Overlay au hover */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity flex items-center justify-center">
                    <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      Cliquer pour afficher
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column - Messages (70%) */}
        <div className="w-[70%] overflow-y-auto p-3 space-y-2">
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
                      <div className="flex items-center gap-1">
                        {getFileIcon(msg.fileType!)}
                        <span className="text-xs italic text-gray-300">a partagé un fichier</span>
                      </div>
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
      </div>
    </div>
  );
}

