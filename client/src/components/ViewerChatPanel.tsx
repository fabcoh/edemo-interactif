import { useState, useEffect, useRef } from "react";
import { trpc } from "../lib/trpc";
import { MessageCircle, Upload } from "lucide-react";

interface ViewerChatPanelProps {
  sessionCode: string;
  onLoadDocument?: (url: string, name: string, type: string) => void;
}

export default function ViewerChatPanel({ sessionCode, onLoadDocument }: ViewerChatPanelProps) {
  const [message, setMessage] = useState("");
  const [showMessages, setShowMessages] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const autoCloseTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Récupérer la session pour avoir le sessionId
  const sessionQuery = trpc.presentation.getSessionByCode.useQuery(
    { sessionCode },
    { enabled: !!sessionCode }
  );

  const sessionId = sessionQuery.data?.id;

  // Récupérer les messages
  const messagesQuery = trpc.chat.getMessages.useQuery(
    { sessionId: sessionId! },
    {
      enabled: !!sessionId,
      refetchInterval: 2000,
    }
  );

  const messages = messagesQuery.data || [];

  // Mutations
  const sendMessageMutation = trpc.chat.sendMessage.useMutation({
    onSuccess: () => {
      setMessage("");
      messagesQuery.refetch();
    },
  });

  const uploadFileMutation = trpc.chat.uploadFile.useMutation({
    onSuccess: (data) => {
      // data only contains { url, key }, no 'name' property
      // Extract filename from key or URL
      const fileName = data.key.split('/').pop() || 'document';
      if (onLoadDocument) {
        const fileType = fileName.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image';
        onLoadDocument(data.url, fileName, fileType);
      }
      messagesQuery.refetch();
    },
  });

  // Ouvrir automatiquement quand un nouveau message arrive
  useEffect(() => {
    if (messages.length > 0) {
      setShowMessages(true);
      
      // Scroll vers le haut (car les nouveaux messages sont en haut)
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      
      // Démarrer le timer de fermeture automatique (7 secondes)
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
      }
      autoCloseTimerRef.current = setTimeout(() => {
        setShowMessages(false);
      }, 7000);
    }

    return () => {
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
      }
    };
  }, [messages.length]);

  // Fermer en cliquant ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chatContainerRef.current && !chatContainerRef.current.contains(event.target as Node)) {
        setShowMessages(false);
      }
    };

    if (showMessages) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMessages]);

  // Scroll automatique vers le bas
  useEffect(() => {
    if (showMessages && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, showMessages]);

  const handleSendMessage = () => {
    if (message.trim() && sessionId) {
      sendMessageMutation.mutate({
        sessionId,
        senderType: "viewer" as const,
        senderName: "Spectateur",
        message: message,
      });
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!sessionId) {
      console.error("No session ID available");
      return;
    }

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        
        // Upload via tRPC
        uploadFileMutation.mutate({
          sessionId: sessionId,
          fileName: file.name,
          fileData: base64,
          mimeType: file.type,
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Upload error:", error);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // ========================================
  // BARRE LECTEUR AVEC BULLE - Configuration finale
  // ========================================
  return (
    <>
      {/* Bulles messages (à droite, transparent) */}
      {showMessages && (
        <div
          className="fixed right-0 z-50 transition-all duration-300"
          style={{
            bottom: "80px",
            width: "33.33%",
            height: "40vh",
          }}
        >
          <div className="h-full overflow-y-auto p-3 space-y-2 flex flex-col items-end">
          {[...messages].reverse().map((msg, index) => (
            <div 
              key={msg.id} 
              className={`flex items-center justify-center px-4 py-2 rounded-full shadow-lg backdrop-blur-sm text-white text-sm whitespace-nowrap ${
                msg.senderType === 'presenter' 
                  ? (index === 0 ? 'bg-blue-500' : 'bg-blue-500/60')
                  : (index === 0 ? 'bg-green-500' : 'bg-green-500/60')
              }`}
              style={{
                maxWidth: '95%',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {msg.fileUrl ? (
                <a href={msg.fileUrl} download className="flex items-center gap-2">
                  {msg.fileType === 'image' ? (
                    <img src={msg.fileUrl} alt={msg.message} className="w-8 h-8 rounded object-cover" />
                  ) : msg.fileType === 'pdf' ? (
                    <span className="text-2xl">📄</span>
                  ) : msg.fileType === 'video' ? (
                    <span className="text-2xl">🎬</span>
                  ) : (
                    <span className="text-2xl">📎</span>
                  )}
                  <span className="text-xs truncate">{msg.message}</span>
                </a>
              ) : (
                msg.message
              )}
            </div>
          ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      {/* Barre de saisie (pleine largeur, au-dessus du message Manus) */}
      <div
        ref={chatContainerRef}
        className="fixed left-0 right-0 z-50 flex items-center gap-2 p-2 bg-black/70 backdrop-blur"
        style={{ bottom: "40px" }}
      >
        {/* Zone d'écriture (60%) */}
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          placeholder="Écrire un message..."
          className="flex-[0.6] bg-gray-800 text-white px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Bouton Envoyer (10%) */}
        <button
          onClick={handleSendMessage}
          className="flex-[0.1] bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
        >
          ➤
        </button>

        {/* Zone de dépôt (20%) */}
        <div
          className={`flex-[0.2] border-2 border-dashed rounded px-3 py-2 text-center cursor-pointer transition-colors ${
            isDragging ? "border-blue-500 bg-blue-500/10" : "border-gray-600 hover:border-gray-500"
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = ".pdf,image/*";
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) handleFileUpload(file);
            };
            input.click();
          }}
        >
          <Upload className="w-4 h-4 mx-auto text-gray-400" />
          <span className="text-xs text-gray-400">Glisser</span>
        </div>

        {/* Icône messages (5%) */}
        <button
          onClick={() => setShowMessages(!showMessages)}
          className="flex-[0.05] p-2 rounded bg-blue-500 hover:bg-blue-600 transition-colors"
        >
          <MessageCircle className="w-6 h-6 text-white" />
        </button>
      </div>
    </>
  );
}
