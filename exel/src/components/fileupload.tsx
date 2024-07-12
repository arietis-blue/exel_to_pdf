"use client"
import { useState } from 'react';

const FileUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    setFile(selectedFile || null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      // ファイルのアップロード
      const uploadResponse = await fetch('/api/proxy', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      const uploadResult = await uploadResponse.json();
      console.log(uploadResult);

      // FastAPIでファイルを処理
      const processResponse = await fetch('http://localhost:8000/process/', {
        method: 'POST',
        body: formData,
      });

      if (!processResponse.ok) {
        throw new Error('Failed to process file');
      }

      // PDFをBlobとして取得
      const pdfBlob = await processResponse.blob();

      // BlobからURLを生成
      const pdfDownloadUrl = URL.createObjectURL(pdfBlob);

      // PDFのダウンロードURLを状態に保存
      setPdfUrl(pdfDownloadUrl);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-purple-600 text-white py-4 fixed w-full top-0 z-10">
        <div className="container mx-auto text-center text-2xl font-semibold">
          Excel to PDF
        </div>
      </header>
      <main className="flex-grow flex flex-col items-center justify-center mt-16 mb-16 overflow-y-auto">
        <div className="max-w-md w-full m-2 p-4 bg-white rounded-lg shadow-md">
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="file"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <button type="submit" className="w-full bg-purple-500 text-white py-2 rounded-md hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50">
              {loading ? 'Uploading...' : 'Upload'}
            </button>
          </form>
          {pdfUrl && (
            <div className="mt-4 flex justify-center">
              <a
                href={pdfUrl}
                download="output.pdf"
                className="inline-block bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
              >
                Download PDF
              </a>
            </div>
          )}
          {loading && (
            <div className="mt-4 text-center text-gray-500">
              Processing...
            </div>
          )}
        </div>
        {pdfUrl && (
          <div className="w-full mt-6 flex justify-center">
            <iframe src={pdfUrl} width="80%" height="1000px" className="border border-gray-300 rounded-md"></iframe>
          </div>
        )}
      </main>
      <footer className="bg-gray-800 text-white py-4 fixed w-full bottom-0">
        <div className="container mx-auto text-center">
          &copy; {new Date().getFullYear()} File Upload Sample App.
        </div>
      </footer>
    </div>
  );
};

export default FileUpload;
