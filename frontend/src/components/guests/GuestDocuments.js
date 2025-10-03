import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { guestAPI } from '../../services/api';
import GuestDocumentUpload from './GuestDocumentUpload';
import { FaArrowLeft } from 'react-icons/fa';

const GuestDocuments = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDocuments = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await guestAPI.getDocuments(id);
      setDocuments(response.data);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to fetch documents');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return (
    <div className="glass-bg min-vh-100 p-4">
      <div className="container-fluid">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="d-flex align-items-center">
            <button 
              className="btn btn-outline-secondary glass-btn me-3"
              onClick={() => navigate(`/guests/${id}`)}
            >
              <FaArrowLeft />
            </button>
            <div>
              <h2 className="text-dark fw-bold mb-0">Guest Documents</h2>
              <p className="text-muted">Manage guest documents</p>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-md-8">
            <div className="card glass-card">
              <div className="card-body">
                <h5 className="card-title">Uploaded Documents</h5>
                {isLoading ? (
                  <p>Loading documents...</p>
                ) : documents.length === 0 ? (
                  <p>No documents uploaded yet.</p>
                ) : (
                  <ul className="list-group">
                    {documents.map(doc => (
                      <li key={doc.document_id} className="list-group-item">
                        {doc.document_type}: {doc.document_identifier_value}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <GuestDocumentUpload />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestDocuments;
