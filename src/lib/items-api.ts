import { apiClient } from './api-client';
import {
  Item,
  ItemWithChildren,
  CreateItemDto,
  UpdateItemDto,
  QueryItemsDto,
  UploadUrlResponse,
  DownloadUrlResponse,
  StorageUsage,
} from '@/types/items';

class ItemsApi {
  private baseUrl = '/items';

  async getAll(query?: QueryItemsDto): Promise<Item[]> {
    const params = new URLSearchParams();
    if (query?.parentId !== undefined) {
      params.append('parentId', query.parentId === null ? '' : query.parentId);
    }
    if (query?.type) params.append('type', query.type);
    if (query?.search) params.append('search', query.search);

    const url = params.toString() ? `${this.baseUrl}?${params}` : this.baseUrl;
    return apiClient.get<Item[]>(url);
  }

  async getTree(): Promise<ItemWithChildren[]> {
    return apiClient.get<ItemWithChildren[]>(`${this.baseUrl}/tree`);
  }

  async getById(id: string): Promise<Item> {
    return apiClient.get<Item>(`${this.baseUrl}/${id}`);
  }

  async getWithChildren(id: string): Promise<ItemWithChildren> {
    return apiClient.get<ItemWithChildren>(`${this.baseUrl}/${id}/children`);
  }

  async getBreadcrumbs(id: string): Promise<Item[]> {
    return apiClient.get<Item[]>(`${this.baseUrl}/${id}/breadcrumbs`);
  }

  async create(data: CreateItemDto): Promise<Item> {
    return apiClient.post<Item>(this.baseUrl, data);
  }

  async update(id: string, data: UpdateItemDto): Promise<Item> {
    return apiClient.patch<Item>(`${this.baseUrl}/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    return apiClient.delete(`${this.baseUrl}/${id}`);
  }

  async getUploadUrl(
    filename: string,
    contentType: string,
    size: number,
    parentId?: string
  ): Promise<{ uploadUrl: string; storageKey: string; expiresIn: number }> {
    return apiClient.post<{ uploadUrl: string; storageKey: string; expiresIn: number }>(
      `${this.baseUrl}/upload-url`,
      { filename, contentType, size, parentId }
    );
  }

  async uploadToR2(
    url: string,
    file: File,
    onProgress?: (progress: number) => void,
    isCancelled?: () => boolean
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = (e.loaded / e.total) * 100;
            onProgress(progress);
          }
        });
      }

      xhr.addEventListener('load', () => {
        if (isCancelled?.()) {
          xhr.abort();
          reject(new Error('Upload cancelled'));
          return;
        }

        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload cancelled'));
      });

      xhr.open('PUT', url);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);

      // Check for cancellation periodically
      const checkCancellation = setInterval(() => {
        if (isCancelled?.()) {
          clearInterval(checkCancellation);
          xhr.abort();
        }
      }, 100);

      xhr.addEventListener('loadend', () => clearInterval(checkCancellation));
    });
  }

  async completeUpload(
    filename: string,
    storageKey: string,
    size: number,
    mimeType: string,
    parentId?: string
  ): Promise<Item> {
    return apiClient.post<Item>(`${this.baseUrl}/upload-complete`, {
      filename,
      storageKey,
      size,
      mimeType,
      parentId,
    });
  }

  async uploadFile(
    file: File,
    parentId?: string,
    onProgress?: (progress: number) => void,
    isCancelled?: () => boolean
  ): Promise<Item> {
    const CHUNK_SIZE = 100 * 1024 * 1024; // 100MB chunks
    const USE_MULTIPART_THRESHOLD = 100 * 1024 * 1024; // Use multipart for files > 100MB

    // Use multipart upload for large files
    if (file.size > USE_MULTIPART_THRESHOLD) {
      return this.uploadFileMultipart(file, parentId, onProgress, isCancelled);
    }

    // Standard upload for smaller files
    const { uploadUrl, storageKey } = await this.getUploadUrl(
      file.name,
      file.type,
      file.size,
      parentId
    );

    await this.uploadToR2(uploadUrl, file, onProgress, isCancelled);

    return await this.completeUpload(
      file.name,
      storageKey,
      file.size,
      file.type,
      parentId
    );
  }

  private async uploadFileMultipart(
    file: File,
    parentId?: string,
    onProgress?: (progress: number) => void,
    isCancelled?: () => boolean
  ): Promise<Item> {
    const CHUNK_SIZE = 100 * 1024 * 1024; // 100MB chunks
    
    // Step 1: Initiate multipart upload
    const { uploadId, storageKey } = await apiClient.post<{ uploadId: string; storageKey: string }>(
      `${this.baseUrl}/multipart/initiate`,
      {
        filename: file.name,
        contentType: file.type,
        size: file.size,
        parentId,
      }
    );

    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const parts: { PartNumber: number; ETag: string }[] = [];
    let uploadedBytes = 0;

    try {
      // Step 2: Upload each part
      for (let partNumber = 1; partNumber <= totalChunks; partNumber++) {
        if (isCancelled?.()) {
          await apiClient.post(`${this.baseUrl}/multipart/abort`, { storageKey, uploadId });
          throw new Error('Upload cancelled');
        }

        const start = (partNumber - 1) * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        // Get presigned URL for this part
        const { url } = await apiClient.post<{ url: string }>(
          `${this.baseUrl}/multipart/part-url`,
          { storageKey, uploadId, partNumber }
        );

        // Upload the part
        const etag = await this.uploadPartToR2(url, chunk, (chunkProgress) => {
          const totalProgress = ((uploadedBytes + (chunk.size * chunkProgress / 100)) / file.size) * 100;
          onProgress?.(totalProgress);
        }, isCancelled);

        parts.push({ PartNumber: partNumber, ETag: etag });
        uploadedBytes += chunk.size;
        onProgress?.((uploadedBytes / file.size) * 100);
      }

      // Step 3: Complete multipart upload
      const item = await apiClient.post<Item>(`${this.baseUrl}/multipart/complete`, {
        filename: file.name,
        storageKey,
        uploadId,
        parts,
        size: file.size,
        mimeType: file.type,
        parentId,
      });

      return item;
    } catch (error) {
      // Abort multipart upload on error
      try {
        await apiClient.post(`${this.baseUrl}/multipart/abort`, { storageKey, uploadId });
      } catch (abortError) {
        console.error('Failed to abort multipart upload:', abortError);
      }
      throw error;
    }
  }

  private async uploadPartToR2(
    url: string,
    chunk: Blob,
    onProgress?: (progress: number) => void,
    isCancelled?: () => boolean
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            onProgress((e.loaded / e.total) * 100);
          }
        });
      }

      xhr.addEventListener('load', () => {
        if (isCancelled?.()) {
          xhr.abort();
          reject(new Error('Upload cancelled'));
          return;
        }

        if (xhr.status >= 200 && xhr.status < 300) {
          const etag = xhr.getResponseHeader('ETag');
          if (!etag) {
            reject(new Error('No ETag in response'));
            return;
          }
          resolve(etag.replace(/"/g, ''));
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => reject(new Error('Network error')));
      xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));

      xhr.open('PUT', url);
      xhr.send(chunk);

      // Check for cancellation periodically
      const checkCancellation = setInterval(() => {
        if (isCancelled?.()) {
          clearInterval(checkCancellation);
          xhr.abort();
        }
      }, 100);

      xhr.addEventListener('loadend', () => clearInterval(checkCancellation));
    });
  }

  async getDownloadUrl(id: string): Promise<DownloadUrlResponse> {
    return apiClient.get<DownloadUrlResponse>(`${this.baseUrl}/${id}/download-url`);
  }

  async getStorageUsage(): Promise<StorageUsage> {
    return apiClient.get<StorageUsage>(`${this.baseUrl}/storage-usage`);
  }
}

export const itemsApi = new ItemsApi();
