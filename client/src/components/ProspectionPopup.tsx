import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";

interface ProspectionPopupProps {
  onClose: () => void;
}

/**
 * ProspectionPopup - Popup déplaçable et redimensionnable avec iframe WhatsApp CRM
 */
export default function ProspectionPopup({ onClose }: ProspectionPopupProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const popupRef = useRef<HTMLDivElement>(null);

  // Initialize popup size and position (centered)
  useEffect(() => {
    const width = window.innerWidth * 0.4; // 40% de largeur
    const height = window.innerHeight * 0.8; // 80% de hauteur
    const x = (window.innerWidth - width) / 2;
    const y = (window.innerHeight - height) / 2;
    
    setSize({ width, height });
    setPosition({ x, y });
  }, []);

  // Handle dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.resize-handle')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
    if (isResizing) {
      const newWidth = Math.max(300, e.clientX - resizeStart.x + resizeStart.width);
      const newHeight = Math.max(200, e.clientY - resizeStart.y + resizeStart.height);
      setSize({ width: newWidth, height: newHeight });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragStart, resizeStart]);

  // Handle resizing
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: position.x,
      y: position.y,
      width: size.width,
      height: size.height,
    });
  };

  return (
    <div
      ref={popupRef}
      className="fixed bg-white rounded-lg shadow-2xl border border-gray-300 overflow-hidden z-50"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div className="bg-blue-600 text-white px-4 py-2 flex items-center justify-between cursor-grab">
        <h3 className="text-sm font-semibold">📋 Prospection WhatsApp</h3>
        <button
          onClick={onClose}
          className="text-white hover:bg-blue-700 rounded p-1 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Iframe Content */}
      <div className="w-full h-[calc(100%-40px)]">
        <iframe
          src="https://whatsappcrm-rbwfcz3k.manus.space/"
          className="w-full h-full border-0"
          title="WhatsApp CRM"
        />
      </div>

      {/* Resize Handle */}
      <div
        className="resize-handle absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
        onMouseDown={handleResizeMouseDown}
        style={{
          background: 'linear-gradient(135deg, transparent 50%, #3b82f6 50%)',
        }}
      />
    </div>
  );
}

