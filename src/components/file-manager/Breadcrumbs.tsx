'use client';

import { Item } from '@/types/items';

interface BreadcrumbsProps {
  items: Item[];
  onNavigate: (folderId: string | null) => void;
}

export function Breadcrumbs({ items, onNavigate }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center space-x-2 text-sm">
      <button
        onClick={() => onNavigate(null)}
        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
      >
        Home
      </button>
      {items.map((item, index) => (
        <div key={item.id} className="flex items-center space-x-2">
          <span className="text-gray-400">/</span>
          <button
            onClick={() => onNavigate(item.id)}
            className={`${
              index === items.length - 1
                ? 'text-gray-900 dark:text-white font-medium'
                : 'text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300'
            }`}
          >
            {item.name}
          </button>
        </div>
      ))}
    </nav>
  );
}
