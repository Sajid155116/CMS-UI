export enum ItemType {
  FILE = 'file',
  FOLDER = 'folder',
}

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  parentId: string | null;
  userId: string;
  size?: number;
  mimeType?: string;
  storageKey?: string;
  path: string;
  createdAt: string;
  updatedAt: string;
}

export interface ItemWithChildren extends Item {
  children?: Item[];
}

export interface CreateItemDto {
  name: string;
  type: ItemType;
  parentId?: string | null;
  size?: number;
  mimeType?: string;
  storageKey?: string;
}

export interface UpdateItemDto {
  name?: string;
  parentId?: string | null;
}

export interface QueryItemsDto {
  parentId?: string | null;
  type?: ItemType;
  search?: string;
}

export interface UploadUrlResponse {
  url: string;
  storageKey: string;
  expiresIn: number;
}

export interface DownloadUrlResponse {
  url: string;
  expiresIn: number;
}

export interface StorageUsage {
  total: number;
  count: number;
}
