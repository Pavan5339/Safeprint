import React, { useState } from 'react';
import axios from 'axios';
import { QrReader } from 'react-qr-reader'; // ✅ FIXED IMPORT

const PrintPage = () => {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  const handleFetch = async () => {
    if (!code.trim()) {
      setStatus('Please enter a code.');
      return;
    }

    try {
      setStatus('Fetching and decrypting file...');
      const response = await axios.get(`http://localhost:5000/download/${code}`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');

      // Extract filename from Content-Disposition header
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'safeprint-file'; // default filename
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch.length === 2) filename = filenameMatch[1];
      }

      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();

      setStatus('✅ File downloaded successfully.');
    } catch (error) {
      console.error(error);
      setStatus('❌ Invalid code or unable to fetch file.');
    }
  };

  const handleScan = (result, error) => {
    if (!!result) {
      const scannedText = result?.text || '';
      const extractedCode = scannedText.split('/').pop(); // Get only the code from the URL
      setCode(extractedCode);
      setStatus('✅ QR Code scanned!');
      setShowScanner(false);
    }
    if (!!error) {
      console.warn(error);
    }
  };
  

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-200 to-indigo-300 p-4">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-4 text-indigo-700">Print Section</h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          Enter or scan the unique code to download and print the file.
        </p>

        <input
          type="text"
          placeholder="Enter unique code"
          className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />

        <div className="flex flex-col gap-3">
          <button
            onClick={handleFetch}
            className="w-full bg-indigo-600 text-white font-semibold py-2 rounded-lg hover:bg-indigo-700 transition duration-200"
          >
            Fetch & Download
          </button>
          <button
            onClick={() => setShowScanner(!showScanner)}
            className="w-full bg-gray-200 text-indigo-700 font-semibold py-2 rounded-lg hover:bg-gray-300 transition duration-200"
          >
            {showScanner ? 'Close QR Scanner' : 'Scan QR Code'}
          </button>
        </div>

        {showScanner && (
          <div className="mt-4">
            <QrReader
              constraints={{ facingMode: 'environment' }}
              onResult={handleScan}
              style={{ width: '100%' }}
            />
          </div>
        )}

        {status && (
          <div className="mt-4 text-sm text-center text-gray-600">
            {status}
          </div>
        )}
      </div>
    </div>
  );
};

export default PrintPage;
