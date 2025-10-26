import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Paperclip, Link as LinkIcon } from "lucide-react";

interface ChatNotificationProps {
  sessionId: number;
}

interface Message {
  id: number;
  senderType: string;
  senderName: string;
  message: string;
  videoUrl: string | null;
  fileType: string | null;
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
      <div className="bg-white rounded-xl shadow-2xl p-4 max-w-md mx-4 border border-gray-200">
        {notification.videoUrl ? (
          <a
            href={notification.videoUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 text-base underline break-all hover:text-blue-800"
          >
            {notification.videoUrl}
          </a>
        ) : (
          <p className="text-gray-900 text-base break-words">
            <span className="font-semibold">{notification.senderName}:</span> {notification.message}
          </p>
        )}
      </div>
    </div>
  );
}

