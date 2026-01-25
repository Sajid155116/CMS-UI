export default function HomePage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
  const apiDocsUrl = apiUrl.replace('/api', '/api/docs');

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          CMS Frontend
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          Built with Next.js, TypeScript, and Tailwind CSS
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/files"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Content Management
          </a>
          <a
            href={apiDocsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            API Docs
          </a>
          <a
            href="https://nextjs.org/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
          >
            Next.js Docs
          </a>
        </div>
      </div>
    </main>
  );
}
