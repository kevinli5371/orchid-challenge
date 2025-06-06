"use client";
import React, { useState } from 'react';

export default function Clone() {
    const [url, setUrl] = useState('');
    const [htmlContent, setHtmlContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleClone = async () => {
        if (!url.trim()) {
            setError('Please enter a valid URL');
            return;
        }

        setLoading(true);
        setError('');
        
        try {
            console.log('Sending request with URL:', url);
            const response = await fetch('http://127.0.0.1:8000/clone', {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url }),
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Received data:', data);
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            const htmlString = data.html || data;
            setHtmlContent(htmlString);
            setShowPreview(true);
            
        } catch (error) {
            console.error('Error:', error);
            setError('Failed to clone the webpage. Please check the URL and try again.');
        } finally {
            setLoading(false);
        }
    };

    const closePreview = () => {
        setShowPreview(false);
        setHtmlContent('');
        setUrl('');
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(htmlContent);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            alert('HTML copied to clipboard!');
        }
    };

    return (
        <div className="flex flex-col items-center gap-4 p-4 min-h-screen">
            <div className="flex flex-col items-center justify-center gap-6 bg-black p-8 rounded-lg shadow-2xl border border-gray-800">
                <label htmlFor="url-input" className="text-lg font-medium text-white">
                    Enter a URL to clone:
                </label>
                <input 
                    id="url-input"
                    type="text" 
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="border-2 border-gray-600 bg-gray-900 text-white rounded-md p-3 w-80 shadow-lg focus:border-gray-400 focus:outline-none focus:shadow-xl transition-all duration-200 placeholder-gray-400" 
                    disabled={loading}
                    onKeyDown={(e) => e.key === 'Enter' && handleClone()}
                />
                <button 
                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white p-3 px-6 rounded-md transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none font-medium"
                    onClick={handleClone}
                    disabled={loading}
                >
                    {loading ? (
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Cloning...
                        </div>
                    ) : (
                        'Clone'
                    )}
                </button>
            </div>
            
            {error && (
                <div className="text-red-400 text-center p-4 bg-red-900/20 border border-red-800 rounded-md shadow-lg backdrop-blur-sm animate-slide-down">
                    {error}
                </div>
            )}
            
            {showPreview && htmlContent && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-gray-900 border border-gray-700 rounded-lg w-11/12 h-5/6 flex flex-col shadow-3xl animate-scale-in">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-800/50">
                            <h2 className="text-xl font-bold text-white">Cloned Webpage Preview</h2>
                            <button 
                                onClick={closePreview}
                                className="text-gray-400 hover:text-white text-2xl font-bold transition-all duration-200 hover:bg-gray-700 rounded-full w-8 h-8 flex items-center justify-center"
                            >
                                ×
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-hidden">
                            <iframe
                                srcDoc={htmlContent}
                                className="w-full h-full border-0"
                                title="Cloned webpage preview"
                                sandbox="allow-same-origin allow-scripts"
                            />
                        </div>
                        
                        <div className="p-4 border-t border-gray-700 bg-gray-800/50 flex justify-end gap-3">
                            <button 
                                onClick={handleCopy}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2"
                            >
                                {copied ? (
                                    <>
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        Copied!
                                    </>
                                ) : (
                                    'Copy HTML'
                                )}
                            </button>
                            <button 
                                onClick={closePreview}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}