'use client';

import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import { itemsApi } from '@/lib/items-api';
import { Item } from '@/types/items';

export interface UploadTask {
  id: string;
  file: File;
  parentId: string | null;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error' | 'cancelled';
  error?: string;
  result?: Item;
  cancelFn?: () => void;
}

interface UploadContextType {
  uploads: UploadTask[];
  addUpload: (file: File, parentId: string | null) => void;
  addMultipleUploads: (files: FileList | File[], parentId: string | null) => void;
  removeUpload: (id: string) => void;
  cancelUpload: (id: string) => void;
  clearCompleted: () => void;
  setOnUploadComplete: (callback: (item: Item) => void) => void;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export function UploadProvider({ children }: { children: ReactNode }) {
  const [uploads, setUploads] = useState<UploadTask[]>([]);
  const onUploadCompleteRef = useRef<((item: Item) => void) | undefined>();

  const setOnUploadComplete = useCallback((callback: (item: Item) => void) => {
    onUploadCompleteRef.current = callback;
  }, []);

  const processUpload = useCallback(async (task: UploadTask) => {
    let isCancelled = false;
    let cancelFn: (() => void) | undefined;

    try {
      // Update status to uploading and set cancel function
      setUploads(prev => prev.map(u => {
        if (u.id === task.id) {
          cancelFn = () => { isCancelled = true; };
          return { ...u, status: 'uploading' as const, cancelFn };
        }
        return u;
      }));

      // Upload file with progress tracking and cancellation support
      const result = await itemsApi.uploadFile(
        task.file,
        task.parentId || undefined,
        (progress) => {
          if (!isCancelled) {
            setUploads(prev => prev.map(u => 
              u.id === task.id ? { ...u, progress } : u
            ));
          }
        },
        () => isCancelled // Pass cancellation check function
      );

      if (isCancelled) {
        setUploads(prev => prev.map(u => 
          u.id === task.id ? { ...u, status: 'cancelled' as const } : u
        ));
      } else {
        // Mark as completed
        setUploads(prev => prev.map(u => 
          u.id === task.id ? { ...u, status: 'completed' as const, progress: 100, result, cancelFn: undefined } : u
        ));
        // Trigger completion callback
        if (onUploadCompleteRef.current) {
          onUploadCompleteRef.current(result);
        }
      }
    } catch (error) {
      if (!isCancelled) {
        console.error('Upload failed:', error);
        setUploads(prev => prev.map(u => 
          u.id === task.id ? { 
            ...u, 
            status: 'error' as const, 
            error: error instanceof Error ? error.message : 'Upload failed',
            cancelFn: undefined
          } : u
        ));
      }
    }
  }, []);

  const addUpload = useCallback((file: File, parentId: string | null) => {
    const task: UploadTask = {
      id: `${Date.now()}-${Math.random()}`,
      file,
      parentId,
      progress: 0,
      status: 'pending',
    };

    setUploads(prev => [...prev, task]);
    processUpload(task);
  }, [processUpload]);

  const addMultipleUploads = useCallback((files: FileList | File[], parentId: string | null) => {
    const fileArray = Array.from(files);
    fileArray.forEach(file => addUpload(file, parentId));
  }, [addUpload]);

  const removeUpload = useCallback((id: string) => {
    setUploads(prev => prev.filter(u => u.id !== id));
  }, []);

  const cancelUpload = useCallback((id: string) => {
    setUploads(prev => prev.map(u => {
      if (u.id === id && u.cancelFn) {
        u.cancelFn();
        return { ...u, status: 'cancelled' as const, cancelFn: undefined };
      }
      return u;
    }));
  }, []);

  const clearCompleted = useCallback(() => {
    setUploads(prev => prev.filter(u => u.status !== 'completed' && u.status !== 'cancelled'));
  }, []);

  return (
    <UploadContext.Provider value={{ uploads, addUpload, addMultipleUploads, removeUpload, cancelUpload, clearCompleted, setOnUploadComplete }}>
      {children}
    </UploadContext.Provider>
  );
}

export function useUpload() {
  const context = useContext(UploadContext);
  if (!context) {
    throw new Error('useUpload must be used within UploadProvider');
  }
  return context;
}
