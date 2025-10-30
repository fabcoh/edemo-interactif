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
      if (onLoadDocument) {
        const fileType = data.name.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image';
        onLoadDocument(data.url, data.name, fileType);
      }
      messagesQuery.refetch();
    },
  });

  // Ouvrir automatiquement quand un nouveau message arrive
  useEffect(() => {
    if (messages.length > 0) {
      setShowMessages(true);
      
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
    const formData = new FormData();
    formData.append("file", file);
    formData.append("sessionCode", sessionCode);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        uploadFileMutation.mutate({
          sessionCode,
          fileUrl: data.url,
          fileName: file.name,
        });
      }
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

  return (
    <div
      ref={chatContainerRef}
      className="fixed left-0 right-0 z-50 transition-all duration-300"
      style={{
        bottom: "60px",
        height: showMessages ? "40vh" : "auto",
        minHeight: "60px",
      }}
    >
      {/* Zone messages (visible uniquement si showMessages) */}
      {showMessages && (
        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-black/90 backdrop-blur" style={{ maxHeight: "calc(40vh - 60px)" }}>
          {[...messages].reverse().map((msg) => (
            <div 
              key={msg.id} 
              className={`inline-block px-4 py-2 rounded-full shadow-lg backdrop-blur-sm text-white text-sm ${
                msg.senderType === 'presenter' ? 'bg-blue-500/60' : 'bg-green-500/60'
              }`}
              style={{
                maxWidth: '85%',
                wordWrap: 'break-word'
              }}
            >
              {msg.message}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Ligne de saisie (toujours visible) */}
      <div className="flex items-center gap-2 p-2 bg-black/70 backdrop-blur">
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
          className="flex-[0.05] p-2 rounded hover:bg-gray-700 transition-colors"
        >
          <MessageCircle className={`w-5 h-5 ${showMessages ? "text-blue-500" : "text-gray-400"}`} />
        </button>
      </div>
    </div>
  );
}
