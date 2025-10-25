import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { X, FileText, Image as ImageIcon } from "lucide-react";

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

  // Determine file type from extension
  const fileName = attachedFile.fileName || "";
  const fileExtension = fileName.split(".").pop()?.toLowerCase() || "";
  const isPDF = fileExtension === "pdf";
  const isImage = ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(fileExtension);

  return (
    <div className="fixed bottom-4 right-4 z-[100] animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 relative max-w-sm">
        {/* Close button */}
        <button
          onClick={() => setAttachedFile(null)}
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg z-10"
          title="Fermer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* File preview - Clickable */}
        <a
          href={attachedFile.fileUrl || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="block cursor-pointer hover:opacity-90 transition-opacity"
        >
          {/* Preview area */}
          <div className="w-full h-48 bg-gray-100 rounded-t-lg flex items-center justify-center overflow-hidden">
            {isImage ? (
              // Image preview
              <img
                src={attachedFile.fileUrl || ""}
                alt={fileName}
                className="w-full h-full object-contain"
                onError={(e) => {
                  // Fallback to icon if image fails to load
                  e.currentTarget.style.display = "none";
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    parent.innerHTML = '<div class="flex flex-col items-center gap-2"><svg class="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><p class="text-xs text-gray-500">Aperçu non disponible</p></div>';
                  }
                }}
              />
            ) : isPDF ? (
              // PDF preview (first page)
              <div className="flex flex-col items-center gap-2">
                <FileText className="w-16 h-16 text-red-600" />
                <p className="text-sm font-medium text-gray-700">Document PDF</p>
                <p className="text-xs text-gray-500">Cliquer pour ouvrir</p>
              </div>
            ) : (
              // Generic file icon
              <div className="flex flex-col items-center gap-2">
                <FileText className="w-16 h-16 text-blue-600" />
                <p className="text-sm font-medium text-gray-700">Document</p>
                <p className="text-xs text-gray-500">Cliquer pour ouvrir</p>
              </div>
            )}
          </div>

          {/* File info */}
          <div className="p-3 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Fichier joint</p>
            <p className="text-sm text-blue-600 font-medium break-all hover:underline">
              {fileName}
            </p>
          </div>
        </a>
      </div>
    </div>
  );
}

