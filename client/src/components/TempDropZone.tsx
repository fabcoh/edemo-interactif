import { useState } from "react";
import { Upload, X, ArrowUp } from "lucide-react";

interface TempDropZoneProps {
  onFileSelect: (file: File) => void;
}

export function TempDropZone({ onFileSelect }: TempDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [tempFile, setTempFile] = useState<File | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      setTempFile(file);
      onFileSelect(file);
    }
  };

  const handleClear = () => {
    setTempFile(null);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative border-2 border-dashed rounded-lg p-2 transition-all ${
        isDragging
          ? "border-blue-500 bg-blue-900 bg-opacity-20"
          : "border-gray-600 bg-gray-800 bg-opacity-50"
      } ${tempFile ? "h-16" : "h-12"}`}
    >
      {tempFile ? (
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Upload className="w-3 h-3 text-green-500 flex-shrink-0" />
            <span className="text-xs text-white truncate">{tempFile.name}</span>
          </div>
          <button
            onClick={handleClear}
            className="flex-shrink-0 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 transition-colors"
            title="Supprimer"
          >
            <X className="w-2 h-2" />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between h-full px-2">
          <p className="text-[10px] text-gray-400 flex-1">
            Glisser un fichier ici
          </p>
          <ArrowUp className="w-4 h-4 text-gray-500 flex-shrink-0" />
        </div>
      )}
    </div>
  );
}

