import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { FileManagerPage } from '@/components/file-manager/FileManagerPage';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <FileManagerPage />
    </ProtectedRoute>
  );
}
