import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Paperclip, Link as LinkIcon } from "lucide-react";

interface ChatNotificationProps {
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

export function ChatNotification({ sessionId }: ChatNotificationProps) {
  const [lastMessageId, setLastMessageId] = useState<number | null>(null);
  const [notification, setNotification] = useState<Message | null>(null);

  // Query messages
  const messagesQuery = trpc.chat.getMessages.useQuery(
    { sessionId },
    { refetchInterval: 2000 }
  );

  const messages = messagesQuery.data || [];

  // Detect new messages and show notification
  useEffect(() => {
    if (messages.length === 0) return;

    const latestMessage = messages[messages.length - 1];

    // If this is a new message (different from last seen)
    if (lastMessageId !== null && latestMessage.id !== lastMessageId) {
      setNotification(latestMessage);

      // Hide notification after 5 seconds
      setTimeout(() => {
        setNotification(null);
      }, 5000);
    }

    // Update last message ID
    setLastMessageId(latestMessage.id);
  }, [messages, lastMessageId]);

  if (!notification) return null;

  return (
    <div className="fixed top-[20%] left-1/2 transform -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="bg-gray-100 rounded-xl shadow-lg p-4 max-w-sm mx-4">
        {notification.messageType === "text" && (
          <p className="text-gray-900 text-lg font-medium break-words">
            {notification.content}
          </p>
        )}
        {notification.messageType === "video_link" && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-900 text-base font-semibold">
              <LinkIcon className="w-4 h-4" />
              <span>Lien vidéo</span>
            </div>
            <a
              href={notification.content || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 text-sm underline break-all hover:text-blue-800"
            >
              {notification.content}
            </a>
          </div>
        )}
        {notification.messageType === "document" && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-900 text-base font-semibold">
              <Paperclip className="w-4 h-4" />
              <span>Document</span>
            </div>
            <a
              href={notification.fileUrl || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 text-sm underline break-all hover:text-blue-800"
            >
              {notification.fileName}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

