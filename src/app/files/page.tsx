'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Item, ItemType } from '@/types/items';
import { itemsApi } from '@/lib/items-api';
import { FileList } from '@/components/file-manager/FileList';
import { Breadcrumbs } from '@/components/file-manager/Breadcrumbs';
import { FileUpload } from '@/components/file-manager/FileUpload';
import { CreateFolderDialog } from '@/components/file-manager/CreateFolderDialog';
import { UploadManager } from '@/components/file-manager/UploadManager';
import { UploadProvider, useUpload } from '@/contexts/UploadContext';

function FileManagerContent() {
  const { data: session } = useSession();
  const [items, setItems] = useState<Item[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { setOnUploadComplete } = useUpload();

  // Load user preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const response = await fetch('/api/users/preferences');
        if (response.ok) {
          const prefs = await response.json();
          setViewMode(prefs.viewMode || 'grid');
        } else {
          // If preferences fail to load, default to grid
          setViewMode('grid');
        }
      } catch (error) {
        console.error('Failed to load preferences:', error);
        setViewMode('grid');
      }
    };

    if (session) {
      loadPreferences();
    }
  }, [session]);

  // Save view mode preference when it changes (but not on initial load)
  useEffect(() => {
    // Only save if viewMode has been loaded (not null) and this isn't the first load
    if (viewMode === null) return;
    
    const saveViewMode = async () => {
      try {
        await fetch('/api/users/preferences', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ viewMode }),
        });
      } catch (error) {
        console.error('Failed to save view mode:', error);
      }
    };

    // Use a timeout to debounce the save and avoid race conditions
    const timeoutId = setTimeout(() => {
      saveViewMode();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [viewMode]);

  // Load items when folder changes
  useEffect(() => {
    loadItems();
    if (currentFolderId) {
      loadBreadcrumbs();
    } else {
      setBreadcrumbs([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFolderId]);

  // Set up upload completion callback
  useEffect(() => {
    setOnUploadComplete((item: Item) => {
      // Add item to list if upload is in current folder
      // Handle both null and undefined for root folder
      const itemParentId = item?.parentId || null;
      if (itemParentId === currentFolderId) {
        setItems(prevItems => [...prevItems, item]);
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

  const handleFolderClick = (folderId: string) => {
    setCurrentFolderId(folderId);
  };

  const handleBreadcrumbClick = (folderId: string | null) => {
    setCurrentFolderId(folderId);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await itemsApi.delete(id);
      loadItems();
    } catch (error) {
      console.error('Failed to delete item:', error);
      alert('Failed to delete item');
    }
  };

  const handleRename = async (id: string, newName: string) => {
    try {
      await itemsApi.update(id, { name: newName });
      loadItems();
    } catch (error) {
      console.error('Failed to rename item:', error);
      alert('Failed to rename item');
    }
  };

  const handleCreateFolder = async (name: string) => {
    try {
      await itemsApi.create({
        name,
        type: ItemType.FOLDER,
        parentId: currentFolderId,
      });
      setShowCreateFolder(false);
      loadItems();
    } catch (error) {
      console.error('Failed to create folder:', error);
      alert('Failed to create folder');
    }
  };

  const handleUploadComplete = () => {
    setShowUpload(false);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Content Management
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                    {session?.user?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {session?.user?.name || session?.user?.email}
                  </span>
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {session?.user?.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {session?.user?.email}
                      </p>
                    </div>
                    <button
                      onClick={() => signOut({ callbackUrl: '/login' })}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => setShowCreateFolder(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Folder
              </button>
              <button
                onClick={() => setShowUpload(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col py-6">
          {/* Toolbar */}
          <div className="flex-shrink-0 mb-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 px-4 py-3">
              <div className="flex items-center justify-between">
                <Breadcrumbs
                  items={breadcrumbs}
                  onNavigate={setCurrentFolderId}
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-colors ${
                      viewMode === 'grid'
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    title="Grid view"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-colors ${
                      viewMode === 'list'
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    title="List view"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* File List Container with scroll */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-y-auto">
              {loading || viewMode === null ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
                  </div>
                </div>
              ) : (
                <FileList
                  items={items}
                  viewMode={viewMode}
                  onFolderClick={setCurrentFolderId}
                  onDelete={handleDelete}
                  onRename={handleRename}
                />
              )}
            </div>
          </div>
        </div>
      </main>

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

      {/* Upload Manager - always visible when there are uploads */}
      <UploadManager />
    </div>
  );
}

export default function FilesPage() {
  return (
    <UploadProvider>
      <FileManagerContent />
    </UploadProvider>
  );
}
