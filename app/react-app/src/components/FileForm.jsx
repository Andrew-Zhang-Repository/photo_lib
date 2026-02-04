import React, { useState } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import './FileForm.css';

function FileForm() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);

  const handleFileChange = (event) => {
    if (event.target.files) {
      setFiles(Array.from(event.target.files));
      setUploadStatus(null); 
    }
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    
    setUploading(true);
    setUploadStatus(null);
    
    const formData = new FormData();
    files.forEach(file => {
        formData.append('file_uploads', file);
    });

    try {
        const endpoint = `${import.meta.env.VITE_SERVER}/api/upload`
        const session = await fetchAuthSession();
        const token = session.tokens.idToken.toString();

        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}` 
            },
            body: formData,
        });

        if (response.ok) {
            setUploadStatus('success');
            setFiles([]);
            const fileInput = document.getElementById('file');
            if (fileInput) fileInput.value = '';
        } else {
            setUploadStatus('error');
        }
    } catch (error) {
        console.error('Upload error:', error);
        setUploadStatus('error');
    } finally {
        setUploading(false);
    }
  };

  return (
    <div className="file-form">
      <div className="input-group">
        <input 
          id="file" 
          type="file" 
          onChange={handleFileChange} 
          multiple
          disabled={uploading}
        />
      </div>

      {uploadStatus === 'success' && (
        <div className="upload-success">
          Upload successful! Your photos are being processed.
        </div>
      )}
      
      {uploadStatus === 'error' && (
        <div className="upload-error">
          Upload failed. Please try again.
        </div>
      )}

      {files.length > 0 && (
        <section className="file-details">
          <p>Selected files:</p>
          {files.map((file, index) => (
            <ul key={index}>
              <li><strong>File {index + 1}:</strong> {file.name}</li>
              <li>Type: {file.type} | Size: {(file.size / 1024).toFixed(1)} KB</li>
            </ul>
          ))}
        </section>
      )}

      {files.length > 0 && (
        <button 
          onClick={handleUpload}
          className="upload-btn"
          disabled={uploading}
        >
          {uploading ? (
            <>
              <span className="upload-spinner"></span>
              Uploading...
            </>
          ) : (
            `Upload ${files.length} ${files.length === 1 ? 'file' : 'files'}`
          )}
        </button>
      )}
    </div>
  );
}

export default FileForm;