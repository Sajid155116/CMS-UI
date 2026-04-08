'use client';

import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useUser } from '@/contexts/UserContext';
import { Item, ItemType } from '@/types/items';
import { itemsApi } from '@/lib/items-api';
import { DashboardShell } from '@/components/common/DashboardShell';
import { EmptyState } from '@/components/common/EmptyState';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FileList } from '@/components/file-manager/FileList';
import { FileListSkeleton } from '@/components/file-manager/FileListSkeleton';
import { Breadcrumbs } from '@/components/file-manager/Breadcrumbs';
import { FileUpload } from '@/components/file-manager/FileUpload';
import { CreateFolderDialog } from '@/components/file-manager/CreateFolderDialog';
import { UploadManager } from '@/components/file-manager/UploadManager';
import { UploadProvider, useUpload } from '@/contexts/UploadContext';

function FileManagerContent() {
  const { user, logout } = useUser();
  const [items, setItems] = useState<Item[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { setOnUploadComplete } = useUpload();

  useEffect(() => {
    void loadItems();
    if (currentFolderId) {
      void loadBreadcrumbs();
    } else {
      setBreadcrumbs([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFolderId]);

  useEffect(() => {
    setOnUploadComplete((item: Item) => {
      const itemParentId = item?.parentId || null;
      if (itemParentId === currentFolderId) {
        setItems(prevItems => [item, ...prevItems]);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFolderId]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await itemsApi.getAll({ parentId: currentFolderId });
      setItems(data);
    } catch (error) {
      console.error('Failed to load items:', error);
      toast.error('Could not load your files.');
    } finally {
      setLoading(false);
    }
  };

  const loadBreadcrumbs = async () => {
    if (!currentFolderId) return;
    try {
      const data = await itemsApi.getBreadcrumbs(currentFolderId);
      setBreadcrumbs(data);
    } catch (error) {
      console.error('Failed to load breadcrumbs:', error);
    }
  };

  const filteredItems = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return items;
    return items.filter(item => item.name.toLowerCase().includes(query));
  }, [items, searchTerm]);

  const folderCount = items.filter(item => item.type === ItemType.FOLDER).length;
  const fileCount = items.filter(item => item.type === ItemType.FILE).length;

  const handleDelete = async (id: string) => {
    await toast.promise(
      itemsApi.delete(id).then(() => loadItems()),
      {
        loading: 'Deleting item...',
        success: 'Item deleted',
        error: 'Failed to delete item',
      }
    );
  };

  const handleRename = async (id: string, newName: string) => {
    await toast.promise(
      itemsApi.update(id, { name: newName }).then(() => loadItems()),
      {
        loading: 'Renaming item...',
        success: 'Item renamed',
        error: 'Failed to rename item',
      }
    );
  };

  const handleCreateFolder = async (name: string) => {
    await toast.promise(
      itemsApi.create({
        name,
        type: ItemType.FOLDER,
        parentId: currentFolderId,
      }).then(() => loadItems()),
      {
        loading: 'Creating folder...',
        success: 'Folder created',
        error: 'Failed to create folder',
      }
    );
    setShowCreateFolder(false);
  };

  const handleUploadComplete = () => {
    setShowUpload(false);
    toast.success('Upload queued successfully');
  };

  return (
    <DashboardShell>
      <div id="library" className="flex h-full min-h-0 flex-col">
        <header className="mb-3 border-b border-slate-200 pb-3 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-sm font-semibold text-white dark:bg-white dark:text-slate-950">
                CM
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-950 dark:text-white">Library</h1>
                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                  {folderCount} folders • {fileCount} files
                </p>
              </div>
            </div>

            <div className="flex flex-1 items-center justify-center">
              <div className="flex w-full max-w-[520px] flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search files and folders"
                  className="h-9 sm:w-72"
                />
                <Button size="sm" onClick={() => setShowCreateFolder(true)}>
                  New folder
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setShowUpload(true)}>
                  Upload
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900 dark:text-white">{user?.name || user?.email}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => logout()}>
                Sign out
              </Button>
            </div>
          </div>
        </header>

        <div className="mb-3 shrink-0">
          <Breadcrumbs items={breadcrumbs} onNavigate={setCurrentFolderId} />
        </div>

        <div className="min-h-0 flex-1 overflow-hidden">
          {loading ? (
            <div className="h-full overflow-auto">
              <FileListSkeleton viewMode="list" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="h-full overflow-auto">
              <EmptyState
                title={searchTerm ? 'No matches found' : 'This folder is empty'}
                description={
                  searchTerm
                    ? 'Try a different search term or clear the search input.'
                    : 'Create a folder or upload files to get started.'
                }
                actionLabel={searchTerm ? 'Clear search' : 'New folder'}
                onAction={() => {
                  if (searchTerm) {
                    setSearchTerm('');
                  } else {
                    setShowCreateFolder(true);
                  }
                }}
              />
            </div>
          ) : (
            <div className="h-full overflow-auto">
              <FileList
                items={filteredItems}
                viewMode="list"
                onFolderClick={setCurrentFolderId}
                onDelete={handleDelete}
                onRename={handleRename}
              />
            </div>
          )}
        </div>
      </div>

        {showCreateFolder && (
          <CreateFolderDialog
            onClose={() => setShowCreateFolder(false)}
            onCreate={handleCreateFolder}
          />
        )}

        {showUpload && (
          <FileUpload
            parentId={currentFolderId}
            onClose={() => setShowUpload(false)}
            onComplete={handleUploadComplete}
          />
        )}

      <UploadManager />
    </DashboardShell>
  );
}

export function FileManagerPage() {
  return (
    <UploadProvider>
      <FileManagerContent />
    </UploadProvider>
  );
}
