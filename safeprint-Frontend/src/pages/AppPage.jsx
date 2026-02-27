import React, { useState } from 'react';
import axios from 'axios';
import { QRCodeCanvas } from 'qrcode.react';
import { QrReader } from 'react-qr-reader';
import { Upload, Download, Copy, Check } from 'lucide-react';

const AppPage = () => {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' or 'download'

  // --- Upload State ---
  const [file, setFile] = useState(null);
  const [uploadCode, setUploadCode] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [copied, setCopied] = useState(false);

  // --- Download State ---
  const [downloadCode, setDownloadCode] = useState('');
  const [downloadStatus, setDownloadStatus] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  const handleUpload = async () => {
    if (!file) {
      setUploadStatus('Please select a file first.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsUploading(true);
      setUploadStatus('Uploading...');
      const res = await axios.post('http://localhost:5000/api/files/upload', formData);
      setUploadCode(res.data.code);
      setDownloadUrl(`http://localhost:5000/api/files/download/${res.data.code}`);
      setUploadStatus('✅ File uploaded successfully.');
    } catch (err) {
      console.error(err);
      setUploadStatus('❌ Something went wrong during upload.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async () => {
    if (!downloadCode.trim()) {
      setDownloadStatus('Please enter a code.');
      return;
    }

    try {
      setDownloadStatus('Fetching file...');
      const response = await axios.get(`http://localhost:5000/api/files/download/${downloadCode}`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');

      const contentDisposition = response.headers['content-disposition'];
      let filename = 'safeprint-file';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch && filenameMatch.length === 2) filename = filenameMatch[1];
      }

      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();

      setDownloadStatus('✅ File downloaded. It has been deleted from the server.');
      setDownloadCode('');
    } catch (error) {
      console.error(error);
      setDownloadStatus('❌ Invalid code or file has been deleted.');
    }
  };

  const handleScan = (result, error) => {
    if (!!result) {
      const scannedText = result?.text || '';
      const extractedCode = scannedText.split('/').pop();
      setDownloadCode(extractedCode);
      setDownloadStatus('✅ QR Code scanned!');
      setShowScanner(false);
    }
    if (!!error) {
      console.warn(error);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(uploadCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetUpload = () => {
    setFile(null);
    setUploadCode('');
    setUploadStatus('');
    setDownloadUrl('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 font-sans">
      <div className="bg-slate-800 shadow-2xl shadow-emerald-500/10 rounded-2xl w-full max-w-md text-slate-200 border border-slate-700">
        <div className="flex bg-slate-900/50 rounded-t-xl p-1">
          <button onClick={() => setActiveTab('upload')} className={`flex-1 py-3 text-center font-semibold transition rounded-lg text-sm ${activeTab === 'upload' ? 'bg-emerald-500 text-slate-900' : 'text-slate-300 hover:bg-slate-700/50'}`}>Send File</button>
          <button onClick={() => setActiveTab('download')} className={`flex-1 py-3 text-center font-semibold transition rounded-lg text-sm ${activeTab === 'download' ? 'bg-emerald-500 text-slate-900' : 'text-slate-300 hover:bg-slate-700/50'}`}>Receive File</button>
        </div>

        <div className="p-6">
          {activeTab === 'upload' ? (
            <div className="space-y-6">
              {!uploadCode ? (
                <>
                  <label htmlFor="fileInput" className="cursor-pointer border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:bg-slate-700/50 hover:border-emerald-500 transition-colors block">
                    <input type="file" id="fileInput" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
                    <div className="flex flex-col items-center"><Upload className="w-10 h-10 text-slate-400 mb-3" /><span className="text-slate-300 font-medium">{file ? file.name : "Click or drag to select a file"}</span><span className="text-xs text-slate-500 mt-1">Max size: 100MB</span></div>
                  </label>
                  <button onClick={handleUpload} disabled={!file || isUploading} className="w-full py-3 rounded-lg text-slate-900 font-bold bg-emerald-500 hover:bg-emerald-400 transition disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center gap-2">{isUploading ? 'Uploading...' : 'Generate Secure Code'}</button>
                </>
              ) : (
                <div className="text-center space-y-4">
                  <p className="font-medium text-emerald-400">{uploadStatus}</p>
                  <div className="bg-slate-900 p-4 rounded-lg flex items-center justify-between border border-slate-700">
                    <span className="text-2xl font-mono font-bold tracking-widest text-white">{uploadCode}</span>
                    <button onClick={copyToClipboard} className="p-2 hover:bg-slate-700 rounded-full transition" title="Copy Code">{copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5 text-slate-400" />}</button>
                  </div>
                  <div className="p-4 bg-white rounded-lg inline-block"><QRCodeCanvas value={downloadUrl} size={160} /></div>
                  <p className="text-xs text-slate-500">Scan QR or share the code.</p>
                  <button onClick={resetUpload} className="text-emerald-500 text-sm hover:underline">Upload another file</button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Enter File Code</label>
                <input type="text" value={downloadCode} onChange={(e) => setDownloadCode(e.target.value)} placeholder="e.g. a1b2c3d4" className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-mono text-center text-lg uppercase text-white" />
              </div>
              {downloadStatus && (<div className={`flex items-center justify-center gap-2 text-sm p-3 rounded-lg ${downloadStatus.includes('❌') ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>{downloadStatus}</div>)}
              <div className="flex flex-col gap-3">
                <button onClick={handleDownload} disabled={!downloadCode} className="w-full py-3 rounded-lg text-slate-900 font-bold bg-emerald-500 hover:bg-emerald-400 transition disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"><Download className="w-5 h-5" /> Download File</button>
                <button onClick={() => setShowScanner(!showScanner)} className="w-full py-2.5 rounded-lg text-slate-300 font-semibold bg-slate-700 hover:bg-slate-600 transition">{showScanner ? 'Close Scanner' : 'Scan QR Code'}</button>
              </div>
              {showScanner && (<div className="mt-4 p-2 bg-white rounded-lg"><QrReader constraints={{ facingMode: 'environment' }} onResult={handleScan} style={{ width: '100%' }} /></div>)}
              <p className="text-xs text-center text-slate-500 pt-2">Note: Files are deleted from the server immediately after a successful download.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppPage;