import { useState, useEffect, useCallback } from 'react';
import { documentsApi, projectsApi } from '../utils/api';

export const useDocuments = (projectId, initialDocuments, setParentDocuments, onDocumentsUpdated) => {
  const [documents, setDocuments] = useState(initialDocuments || []);
  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [activeDocument, setActiveDocument] = useState(null);
  const [documentContent, setDocumentContent] = useState([]);
  const [loadingDocument, setLoadingDocument] = useState(false);

  const fetchProjectDocuments = useCallback(async () => {
    if (!projectId) return;
    
    setIsLoading(true);
    try {
      const projectData = await projectsApi.getProjectWithContent(projectId);
      if (projectData && projectData.documents && Array.isArray(projectData.documents)) {
        setDocuments(projectData.documents);
        if (setParentDocuments) {
          setParentDocuments(projectData.documents);
        }
        if (typeof onDocumentsUpdated === 'function') {
            onDocumentsUpdated(projectData.documents);
        }
      } else {
        setDocuments([]);
      }
    } catch (error) {
      console.error("Error fetching project data:", error);
      setUploadError("Failed to fetch project data");
    } finally {
      setIsLoading(false);
    }
  }, [projectId, setParentDocuments, onDocumentsUpdated]);

  useEffect(() => {
    if (projectId && (!initialDocuments || initialDocuments.length === 0)) {
      fetchProjectDocuments();
    } else if (initialDocuments) {
        setDocuments(initialDocuments)
    }
  }, [projectId, initialDocuments, fetchProjectDocuments]);

  const handleDocumentSelect = useCallback((doc) => {
    setActiveDocument(doc);
    setLoadingDocument(true);
    if (doc.content && typeof doc.content === 'string') {
      setDocumentContent(doc.content.split('\n'));
      setLoadingDocument(false);
    } else {
      setDocumentContent([]);
      setLoadingDocument(false);
      fetchProjectDocuments();
    }
  }, [fetchProjectDocuments]);

  const handleUpload = async (files) => {
    if (!projectId || files.length === 0) return;

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      if (files.length === 1) {
        await documentsApi.uploadDocument(projectId, files[0]);
      } else {
        await documentsApi.bulkUploadDocuments(projectId, files);
      }
      setUploadSuccess(true);
      await fetchProjectDocuments();
    } catch (error) {
      setUploadError(error.message || "Failed to upload files");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId) => {
    if (!projectId || !documentId) return;

    if (!window.confirm("Are you sure you want to delete this document? This action cannot be undone.")) {
      return;
    }

    try {
      await documentsApi.deleteDocument(documentId);
      if (activeDocument?.id === documentId) {
        setActiveDocument(null);
        setDocumentContent([]);
      }
      await fetchProjectDocuments();
    } catch (error) {
      console.error("Error deleting document:", error);
    }
  };

  return {
    documents,
    isLoading,
    uploading,
    uploadError,
    uploadSuccess,
    activeDocument,
    documentContent,
    loadingDocument,
    handleDocumentSelect,
    handleUpload,
    handleDeleteDocument,
    fetchProjectDocuments,
    setActiveDocument
  };
};