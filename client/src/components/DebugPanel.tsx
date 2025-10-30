import { useState } from "react";
import { ChevronDown, ChevronUp, Bug } from "lucide-react";

interface DebugPanelProps {
  title: string;
  data: Record<string, any>;
  actions?: Array<{
    label: string;
    onClick: () => void;
  }>;
}

export function DebugPanel({ title, data, actions }: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 10));
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 bg-black/90 text-white rounded-lg shadow-2xl border border-gray-700">
      {/* Header */}
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-800 rounded-t-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <Bug className="w-4 h-4 text-green-400" />
          <span className="font-bold text-sm">{title}</span>
        </div>
        {isOpen ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronUp className="w-4 h-4" />
        )}
      </div>

      {/* Content */}
      {isOpen && (
        <div className="p-3 space-y-3 max-h-96 overflow-y-auto">
          {/* Data Display */}
          <div className="space-y-1">
            <div className="text-xs font-bold text-green-400 mb-2">ÉTAT ACTUEL</div>
            {Object.entries(data).map(([key, value]) => (
              <div key={key} className="flex justify-between text-xs">
                <span className="text-gray-400">{key}:</span>
                <span className="font-mono text-yellow-300">
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </span>
              </div>
            ))}
          </div>

          {/* Actions */}
          {actions && actions.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-green-400 mb-2">ACTIONS</div>
              {actions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    action.onClick();
                    addLog(action.label);
                  }}
                  className="w-full px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}

          {/* Logs */}
          {logs.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs font-bold text-green-400 mb-2">LOGS</div>
              <div className="space-y-0.5 max-h-32 overflow-y-auto">
                {logs.map((log, idx) => (
                  <div key={idx} className="text-[10px] text-gray-300 font-mono">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

