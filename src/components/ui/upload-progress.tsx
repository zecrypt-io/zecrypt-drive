"use client";

import { useMemo } from "react";
import { X, Minimize2, Maximize2, CheckCircle2, AlertCircle, Loader2, File as FileIcon } from "lucide-react";
import { useState } from "react";

export type UploadItem = {
  id: string;
  file: File;
  relativePath?: string;
  status: "pending" | "uploading" | "completed" | "error";
  progress: number;
  error?: string;
};

interface UploadProgressProps {
  uploads: UploadItem[];
  onClose: () => void;
  onRetry?: (id: string) => void;
  onCancel?: (id: string) => void;
}

export function UploadProgress({ uploads, onClose, onRetry, onCancel }: UploadProgressProps) {
  const [isMinimized, setIsMinimized] = useState(false);

  const summary = useMemo(() => {
    const total = uploads.length;
    const completed = uploads.filter((u) => u.status === "completed").length;
    const errors = uploads.filter((u) => u.status === "error").length;
    const inProgress = uploads.filter((u) => u.status === "uploading").length;
    
    // Calculate overall progress
    const totalProgress = uploads.reduce((acc, curr) => acc + curr.progress, 0);
    const overallPercentage = total > 0 ? Math.round(totalProgress / total) : 0;

    return { total, completed, errors, inProgress, overallPercentage };
  }, [uploads]);

  if (uploads.length === 0) return null;

  const isComplete = summary.completed + summary.errors === summary.total;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-md rounded-xl border border-zinc-200 bg-white shadow-2xl transition-all duration-300 ease-in-out">
      {/* Header */}
      <div 
        className="flex items-center justify-between rounded-t-xl bg-zinc-900 px-4 py-3 text-white cursor-pointer"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center gap-3">
          {summary.inProgress > 0 ? (
             <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800">
               <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
             </div>
          ) : isComplete ? (
             <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500">
               <CheckCircle2 className="h-5 w-5 text-white" />
             </div>
          ) : (
             <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800">
               <FileIcon className="h-4 w-4 text-zinc-400" />
             </div>
          )}
          
          <div>
            <p className="text-sm font-medium">
              {isComplete 
                ? `${summary.completed} uploads complete` 
                : `Uploading ${summary.total - summary.completed} items`}
            </p>
            {!isComplete && (
              <div className="mt-1 h-1 w-32 overflow-hidden rounded-full bg-zinc-700">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${summary.overallPercentage}%` }}
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(!isMinimized);
            }}
            className="rounded p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="rounded p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* List */}
      {!isMinimized && (
        <div className="max-h-80 overflow-y-auto bg-white px-2 py-2">
          <div className="space-y-1">
            {uploads.map((item) => (
              <div 
                key={item.id} 
                className="group flex items-center gap-3 rounded-lg p-2 hover:bg-zinc-50 transition-colors"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-zinc-100">
                  <FileIcon className="h-4 w-4 text-zinc-500" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="truncate text-xs font-medium text-zinc-900" title={item.relativePath || item.file.name}>
                       {item.relativePath || item.file.name}
                    </p>
                    <span className="text-[10px] text-zinc-500 font-medium">
                      {item.status === "error" ? "Failed" : `${Math.round(item.progress)}%`}
                    </span>
                  </div>
                  
                  {item.status === "error" ? (
                    <p className="text-[10px] text-red-600 truncate">{item.error || "Upload failed"}</p>
                  ) : (
                    <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-100">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          item.status === "completed" ? "bg-emerald-500" : "bg-emerald-500/70"
                        }`}
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  )}
                </div>

                <div className="shrink-0 w-6 flex justify-center">
                   {item.status === "completed" && (
                     <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                   )}
                   {item.status === "error" && onRetry && (
                     <button 
                       onClick={() => onRetry(item.id)}
                       className="text-zinc-400 hover:text-zinc-600"
                       title="Retry"
                     >
                       <span className="text-xs font-medium">↻</span>
                     </button>
                   )}
                   {item.status === "uploading" && onCancel && (
                      <button 
                        onClick={() => onCancel(item.id)}
                        className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 transition-opacity"
                        title="Cancel"
                      >
                        <X className="h-3 w-3" />
                      </button>
                   )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

