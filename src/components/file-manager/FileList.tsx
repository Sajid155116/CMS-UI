'use client';

import { useState } from 'react';
import {
  Download,
  Ellipsis,
  Eye,
  File,
  FileArchive,
  FileAudio,
  FileCode,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Folder,
  Loader2,
  Pencil,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { Item, ItemType } from '@/types/items';
import { itemsApi } from '@/lib/items-api';
import { formatDate } from '@/lib/utils';
import { VideoPreviewModal } from './VideoPreviewModal';

type SummaryResult = {
  filename: string;
  summary: string;
  sources: string[];
};

interface FileListProps {
  items: Item[];
  viewMode: 'grid' | 'list';
  onFolderClick: (folderId: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newName: string) => void;
}

export function FileList({ items, viewMode, onFolderClick, onDelete, onRename }: FileListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<{ url: string; name: string } | null>(null);
  const [summarizingId, setSummarizingId] = useState<string | null>(null);
  const [summaryResult, setSummaryResult] = useState<SummaryResult | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const handleDownload = async (item: Item) => {
    if (item.type === ItemType.FOLDER) return;

    try {
      setDownloadingId(item.id);
      const { url } = await itemsApi.getDownloadUrl(item.id);
      const link = document.createElement('a');
      link.href = url;
      link.download = item.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to download file:', error);
      alert('Failed to download file');
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePreview = async (item: Item) => {
    if (item.type === ItemType.FOLDER) return;

    try {
      const { url } = await itemsApi.getDownloadUrl(item.id);
      const mimeType = item.mimeType || '';
      const extension = item.name.split('.').pop()?.toLowerCase() || '';

      if (mimeType.startsWith('video/') || ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'].includes(extension)) {
        setVideoPreview({ url, name: item.name });
        return;
      }

      const canPreviewDirectly = ['image/', 'application/pdf', 'text/', 'audio/'].some((type) =>
        mimeType.startsWith(type)
      );
      const isOfficeFile = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(extension);

      if (canPreviewDirectly) {
        window.open(url, '_blank');
      } else if (isOfficeFile) {
        const viewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
        window.open(viewerUrl, '_blank');
      } else {
        handleDownload(item);
      }
    } catch (error) {
      console.error('Failed to preview file:', error);
      alert('Failed to preview file');
    }
  };

  const canSummarize = (item: Item) => {
    if (item.type !== ItemType.FILE) return false;

    const extension = item.name.split('.').pop()?.toLowerCase() || '';
    const mimeType = item.mimeType || '';

    if (mimeType === 'application/pdf' || extension === 'pdf') return true;
    if (mimeType.startsWith('text/')) return true;

    return ['txt', 'md', 'markdown', 'rst', 'readme', 'log'].includes(extension);
  };

  const handleSummarize = async (item: Item) => {
    if (!canSummarize(item)) {
      setSummaryError('Summarization supports PDF and text-based files only.');
      return;
    }

    try {
      setSummaryError(null);
      setSummarizingId(item.id);
      const response = await itemsApi.summarizeFile(item.id);
      setSummaryResult({
        filename: response.filename,
        summary: response.summary,
        sources: response.sources,
      });
    } catch (error: any) {
      console.error('Failed to summarize file:', error);
      const backendMessage =
        error?.response?.data?.message || error?.response?.data?.detail || error?.message;
      setSummaryError(backendMessage || 'Failed to summarize file');
      setSummaryResult(null);
    } finally {
      setSummarizingId(null);
    }
  };

  const startRename = (item: Item) => {
    setEditingId(item.id);
    setEditName(item.name);
  };

  const handleRenameSubmit = (id: string) => {
    if (editName.trim()) {
      onRename(id, editName.trim());
    }
    setEditingId(null);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round((bytes / Math.pow(1024, i)) * 100) / 100} ${sizes[i]}`;
  };

  const getItemIcon = (item: Item) => {
    if (item.type === ItemType.FOLDER) return <Folder className="h-4 w-4 text-slate-500" />;

    const mimeType = item.mimeType || '';
    const extension = item.name.split('.').pop()?.toLowerCase() || '';

    if (mimeType.startsWith('image/')) return <FileImage className="h-4 w-4 text-slate-500" />;
    if (mimeType.startsWith('video/')) return <FileVideo className="h-4 w-4 text-slate-500" />;
    if (mimeType.startsWith('audio/')) return <FileAudio className="h-4 w-4 text-slate-500" />;
    if (mimeType === 'application/pdf' || extension === 'pdf') return <FileText className="h-4 w-4 text-slate-500" />;
    if (mimeType.includes('sheet') || mimeType.includes('excel') || ['xls', 'xlsx', 'csv'].includes(extension)) {
      return <FileSpreadsheet className="h-4 w-4 text-slate-500" />;
    }
    if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(extension)) {
      return <FileArchive className="h-4 w-4 text-slate-500" />;
    }
    if (['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'cs', 'php', 'rb', 'go', 'rs', 'swift', 'kt', 'html', 'css', 'json', 'xml', 'yaml', 'yml'].includes(extension)) {
      return <FileCode className="h-4 w-4 text-slate-500" />;
    }
    if (mimeType.startsWith('text/')) return <FileText className="h-4 w-4 text-slate-500" />;

    return <File className="h-4 w-4 text-slate-500" />;
  };

  const actionButtonClass =
    'inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-700';
  const rowPaddingClass = viewMode === 'grid' ? 'py-2' : 'py-3';

  if (items.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center">
        <div className="text-center">
          <Folder className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="mt-3 text-sm font-medium text-slate-900 dark:text-white">No files or folders</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Create a folder or upload a file to start.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {summaryError && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
          <div className="flex items-start justify-between gap-3">
            <p>{summaryError}</p>
            <button
              type="button"
              onClick={() => setSummaryError(null)}
              className="text-rose-700 transition-colors hover:text-rose-900 dark:text-rose-200 dark:hover:text-white"
              aria-label="Dismiss summary error"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {summaryResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Summary</h3>
              <button
                onClick={() => setSummaryResult(null)}
                className="text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                aria-label="Close summary"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
              <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">{summaryResult.filename}</p>
              <div className="whitespace-pre-wrap text-sm leading-6 text-slate-800 dark:text-slate-200">
                {summaryResult.summary}
              </div>
            </div>
          </div>
        </div>
      )}

      {videoPreview && (
        <VideoPreviewModal
          videoUrl={videoPreview.url}
          fileName={videoPreview.name}
          onClose={() => setVideoPreview(null)}
        />
      )}

      <div className="overflow-x-auto">
        <div className="min-w-[740px]">
          <div className="grid grid-cols-[minmax(300px,1.2fr)_110px_100px_160px_120px] border-b border-slate-200 px-3 py-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <div>Name</div>
            <div>Type</div>
            <div>Size</div>
            <div>Modified</div>
            <div className="pr-2 text-right">Actions</div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {items.map((item) => (
              <div
                key={item.id}
                className={`group grid cursor-pointer grid-cols-[minmax(300px,1.2fr)_110px_100px_160px_120px] items-center px-3 ${rowPaddingClass} transition-colors duration-150 hover:bg-slate-50 dark:hover:bg-slate-900/60`}
                onDoubleClick={() => item.type === ItemType.FOLDER && onFolderClick(item.id)}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  {getItemIcon(item)}
                  {editingId === item.id ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={() => handleRenameSubmit(item.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameSubmit(item.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="h-8 w-full max-w-[360px] rounded-md border border-slate-300 px-2.5 text-sm text-slate-900 outline-none ring-0 focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      autoFocus
                    />
                  ) : (
                    <span className="truncate text-sm font-medium text-slate-900 dark:text-white" title={item.name}>
                      {item.name}
                    </span>
                  )}
                </div>

                <div className="text-sm text-slate-500 dark:text-slate-400">{item.type}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">{item.type === ItemType.FILE ? formatFileSize(item.size) : '-'}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">{formatDate(item.updatedAt)}</div>

                <div className="relative pr-2">
                  <div className="flex items-center justify-end gap-2 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startRename(item);
                    }}
                    className={actionButtonClass}
                    title="Rename"
                    type="button"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(item.id);
                    }}
                    className={actionButtonClass}
                    title="Delete"
                    type="button"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  {item.type === ItemType.FILE && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId((prev) => (prev === item.id ? null : item.id));
                      }}
                      className={actionButtonClass}
                      title="More"
                      type="button"
                    >
                      <Ellipsis className="h-4 w-4" />
                    </button>
                  )}
                  </div>

                  {item.type === ItemType.FILE && openMenuId === item.id && (
                    <div className="absolute right-2 top-8 z-20 min-w-[132px] rounded-md border border-slate-200 bg-white py-1 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(null);
                          handlePreview(item);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                        type="button"
                      >
                        <Eye className="h-4 w-4" /> Preview
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(null);
                          handleDownload(item);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                        type="button"
                        disabled={downloadingId === item.id}
                      >
                        {downloadingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Download
                      </button>
                      {canSummarize(item) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(null);
                            handleSummarize(item);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                          type="button"
                          disabled={summarizingId === item.id}
                        >
                          {summarizingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Summarize
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
