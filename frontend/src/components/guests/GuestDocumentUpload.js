import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { guestAPI } from '../../services/api';

const GuestDocumentUpload = () => {
  const { id } = useParams();
  const [file, setFile] = useState(null);
  const [documentType, setDocumentType] = useState('');
  const [documentIdentifier, setDocumentIdentifier] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    setIsUploading(true);

    const formData = new FormData();
    formData.append('document', file);
    formData.append('document_type', documentType);
    formData.append('document_identifier_value', documentIdentifier);

    try {
      await guestAPI.uploadDocument(id, formData);
      toast.success('Document uploaded successfully');
      // Optionally, you can refresh the document list here
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="card glass-card">
      <div className="card-body">
        <h5 className="card-title">Upload Document</h5>
        <div className="mb-3">
          <label className="form-label">Document Type</label>
          <select 
            className="form-select"
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
          >
            <option value="">Select Type</option>
            <option value="PAN">PAN</option>
            <option value="AADHAR">AADHAR</option>
            <option value="Voter ID">Voter ID</option>
            <option value="Driving License">Driving License</option>
            <option value="Passport">Passport</option>
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">Document Identifier</label>
          <input 
            type="text"
            className="form-control"
            value={documentIdentifier}
            onChange={(e) => setDocumentIdentifier(e.target.value)}
            placeholder="e.g., Passport Number"
          />
        </div>
        <div className="mb-3">
          <label className="form-label">File</label>
          <input 
            type="file"
            className="form-control"
            onChange={handleFileChange}
          />
        </div>
        <button 
          className="btn btn-primary"
          onClick={handleUpload}
          disabled={isUploading}
        >
          {isUploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>
    </div>
  );
};

export default GuestDocumentUpload;
