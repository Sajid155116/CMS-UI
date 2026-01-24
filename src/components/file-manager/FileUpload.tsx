'use client';

import { useState } from 'react';
import { useUpload } from '@/contexts/UploadContext';

interface FileUploadProps {
  parentId: string | null;
  onClose: () => void;
  onComplete: () => void;
}

export function FileUpload({ parentId, onClose, onComplete }: FileUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const { addMultipleUploads } = useUpload();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(e.target.files);
    }
  };

  const handleUpload = () => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    // Add all files to upload queue
    addMultipleUploads(selectedFiles, parentId);
    
    // Close dialog and refresh
    onComplete();
    onClose();
  };

  const totalSize = selectedFiles 
    ? Array.from(selectedFiles).reduce((sum, file) => sum + file.size, 0)
    : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
          Upload Files
        </h2>

        <div className="mb-4">
          <label className="block w-full">
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors">
              {selectedFiles && selectedFiles.length > 0 ? (
                <div>
                  <svg className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-900 dark:text-white font-medium">
                    {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Total: {(totalSize / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {selectedFiles.length <= 5 && (
                    <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      {Array.from(selectedFiles).map((file, idx) => (
                        <div key={idx} className="truncate">
                          {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Click to select files
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    You can select multiple files
                  </p>
                </div>
              )}
            </div>
            <input
              type="file"
              onChange={handleFileChange}
              className="hidden"
              multiple
            />
          </label>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFiles || selectedFiles.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Upload {selectedFiles && selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
