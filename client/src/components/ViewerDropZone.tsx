import { useState, useRef } from "react";
import { Upload, X, FileText, Image as ImageIcon, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

interface ViewerDropZoneProps {
  sessionCode: string;
}

export function ViewerDropZone({ sessionCode }: ViewerDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{
    id: string;
    name: string;
    type: string;
    url: string;
  }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // TODO: Implement uploadViewerDocument procedure in server/routers.ts
  // const uploadDocumentMutation = trpc.documents.uploadViewerDocument.useMutation({
  //   onSuccess: (data) => {
  //     setUploadedFiles(prev => [...prev, {
  //       id: data.id.toString(),
  //       name: data.name,
  //       type: data.type,
  //       url: data.url,
  //     }]);
  //   },
  // });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      await handleFileUpload(file);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFileUpload(file);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (file.size > 100 * 1024 * 1024) {
      alert('Le fichier est trop volumineux. Maximum 100MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      const fileType = file.type.startsWith('image/') ? 'image' : file.type === 'application/pdf' ? 'pdf' : 'video';

      // TODO: Uncomment when uploadViewerDocument is implemented
      // uploadDocumentMutation.mutate({
      //   sessionCode,
      //   name: file.name,
      //   type: fileType,
      //   data: base64,
      // });
      console.log('File upload not yet implemented:', file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const getFileIcon = (type: string) => {
    if (type === 'image') return <ImageIcon className="w-4 h-4" />;
    if (type === 'video') return <Video className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Uploaded Files Display */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {uploadedFiles.length === 0 ? (
          <p className="text-xs text-gray-400 text-center mt-4">Aucun document déposé</p>
        ) : (
          uploadedFiles.map(file => (
            <div
              key={file.id}
              className="bg-gray-700 rounded p-2 flex items-center gap-2 group relative"
            >
              {getFileIcon(file.type)}
              <span className="text-xs flex-1 truncate">{file.name}</span>
              <button
                onClick={() => handleRemoveFile(file.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3 text-red-400" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-4 cursor-pointer transition-colors ${
          isDragging
            ? "border-blue-500 bg-blue-500/10"
            : "border-gray-600 hover:border-gray-500 bg-gray-800/50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="*/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-2 text-gray-400">
          <Upload className="w-6 h-6" />
          <p className="text-xs text-center">
            Glissez un fichier ici<br />ou cliquez pour sélectionner
          </p>
        </div>
      </div>
    </div>
  );
}

