import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { X, Paperclip } from "lucide-react";

interface FileAttachmentViewerProps {
  sessionId: number;
}

interface Message {
  id: number;
  messageType: string;
  content: string | null;
  fileName: string | null;
  fileUrl: string | null;
  createdAt: Date;
}

export function FileAttachmentViewer({ sessionId }: FileAttachmentViewerProps) {
  const [lastMessageId, setLastMessageId] = useState<number | null>(null);
  const [attachedFile, setAttachedFile] = useState<Message | null>(null);

  // Query messages
  const messagesQuery = trpc.chat.getMessages.useQuery(
    { sessionId },
    { refetchInterval: 2000 }
  );

  const messages = messagesQuery.data || [];

  // Detect new document messages and show attachment
  useEffect(() => {
    if (messages.length === 0) return;

    // Find the latest document message
    const latestDocumentMessage = [...messages]
      .reverse()
      .find((msg) => msg.messageType === "document");

    if (!latestDocumentMessage) return;

    // If this is a new document message (different from last seen)
    if (lastMessageId === null || latestDocumentMessage.id !== lastMessageId) {
      setAttachedFile(latestDocumentMessage);
      setLastMessageId(latestDocumentMessage.id);
    }
  }, [messages, lastMessageId]);

  if (!attachedFile) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white rounded-lg shadow-2xl p-3 max-w-xs border border-gray-200 relative">
        {/* Close button */}
        <button
          onClick={() => setAttachedFile(null)}
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg"
          title="Fermer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* File info */}
        <div className="flex items-start gap-2">
          <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Paperclip className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 mb-1">Fichier joint</p>
            <a
              href={attachedFile.fileUrl || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 underline break-all font-medium"
            >
              {attachedFile.fileName}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

