'use client';

import { useState, useEffect } from 'react';
import { itemsApi } from '@/lib/items-api';
import { StorageUsage } from '@/types/items';

export function StorageInfo() {
  const [usage, setUsage] = useState<StorageUsage | null>(null);

  useEffect(() => {
    loadUsage();
  }, []);

  const loadUsage = async () => {
    try {
      const data = await itemsApi.getStorageUsage();
      setUsage(data);
    } catch (error) {
      console.error('Failed to load storage usage:', error);
    }
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (!usage) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Storage Used</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatBytes(usage.total)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600 dark:text-gray-400">Files</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {usage.count}
          </p>
        </div>
      </div>
    </div>
  );
}
