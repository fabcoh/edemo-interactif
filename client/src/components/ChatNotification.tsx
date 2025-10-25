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
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[100] animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md mx-4 border border-green-500 border-opacity-30">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">💬</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-gray-900 font-bold text-lg mb-2">
              Nouveau message du présentateur
            </div>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              {notification.messageType === "text" && (
                <p className="text-gray-900 text-base break-words font-medium">
                  {notification.content}
                </p>
              )}
              {notification.messageType === "video_link" && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-900 text-sm font-semibold">
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
                  <div className="flex items-center gap-2 text-gray-900 text-sm font-semibold">
                    <Paperclip className="w-4 h-4" />
                    <span>Document partagé</span>
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
            <div className="text-gray-600 text-sm mt-2">
              Ce message restera visible dans le chat ci-dessous
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

