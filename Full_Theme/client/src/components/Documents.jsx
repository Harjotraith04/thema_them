import React, { useState, useEffect, useCallback, useMemo, useContext } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Link,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Stack,
  Modal,
  TextField,
  Popover,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Divider,
  CircularProgress,
  Chip,
  useTheme,
  Tooltip,
  Alert,
  Menu,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  alpha,
  Fade,
  Zoom,
  Toolbar,
} from '@mui/material';
import { AnimatedCard, GlassPanel, GlowButton } from './StyledComponents';
import ThemeToggle from './ThemeToggle';
import { ThemeModeContext } from '../App';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloseIcon from '@mui/icons-material/Close';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DeleteIcon from '@mui/icons-material/Delete';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ArticleIcon from '@mui/icons-material/Article';
import TableChartIcon from '@mui/icons-material/TableChart';
import CommentOutlinedIcon from '@mui/icons-material/CommentOutlined';
import BookOutlinedIcon from '@mui/icons-material/BookOutlined';
import SaveIcon from '@mui/icons-material/Save';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import UploadFileIcon from '@mui/icons-material/UploadFile'; // Added for upload button
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft'; // Added for toggle collapse
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'; // Added for toggle expand
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'; // Added for comment button
import LocalOfferIcon from '@mui/icons-material/LocalOffer'; // Added for assign code button
import { styled } from '@mui/system';
import { documentsApi, projectsApi } from '../utils/api'; // Import both the documents API and projects API

// Custom theme augmentation
const getCustomTheme = (theme) => {
  const isDark = theme.palette.mode === 'dark';
  return {
    primary: {
      lighter: isDark ? alpha(theme.palette.primary.main, 0.2) : '#E3F2FD',
      light: isDark ? alpha(theme.palette.primary.main, 0.4) : '#90CAF9',
      main: theme.palette.primary.main,
      dark: theme.palette.primary.dark,
    },
    transitions: {
      buttonHover: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      cardHover: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }
  };
};

const DropzoneArea = styled(Box)(({ theme, isdragging }) => {
  const isDarkMode = theme.palette.mode === 'dark';
  const customColors = getCustomTheme(theme);
  
  return {
    border: '2px dashed',
    borderColor: isdragging === 'true' 
      ? theme.palette.primary.main 
      : isDarkMode ? alpha(theme.palette.primary.main, 0.4) : alpha(theme.palette.primary.main, 0.3),
    borderRadius: theme.shape.borderRadius * 3,
    padding: theme.spacing(4),
    textAlign: 'center',
    cursor: 'pointer',
    backgroundColor: isdragging === 'true' 
      ? (isDarkMode ? alpha(theme.palette.primary.main, 0.15) : alpha(theme.palette.primary.main, 0.05))
      : (isDarkMode ? alpha(theme.palette.background.paper, 0.4) : alpha(theme.palette.primary.main, 0.02)),
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    background: isDarkMode 
      ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)}, ${alpha(theme.palette.primary.main, 0.1)})`
      : `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.primary.main, 0.05)})`,
    backdropFilter: 'blur(10px)',
    boxShadow: isDarkMode 
      ? `inset 0 1px 0 ${alpha('#fff', 0.1)}, 0 4px 20px ${alpha(theme.palette.primary.main, 0.1)}`
      : `inset 0 1px 0 ${alpha('#fff', 0.8)}, 0 4px 20px ${alpha(theme.palette.primary.main, 0.08)}`,
    width: '100%',
    minHeight: 100, // Reduced from 120 for mobile
    maxHeight: 140, // Added max height
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    position: 'relative',
    overflow: 'hidden',
    [theme.breakpoints.down('lg')]: {
      minHeight: 80,
      padding: theme.spacing(2),
      gap: theme.spacing(1),
    },
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: '-100%',
      width: '100%',
      height: '100%',
      background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.primary.main, 0.1)}, transparent)`,
      transition: 'left 0.6s ease',
    },
    '&:hover': {
      borderColor: theme.palette.primary.main,
      backgroundColor: isDarkMode 
        ? alpha(theme.palette.primary.main, 0.2) 
        : alpha(theme.palette.primary.main, 0.08),
      boxShadow: isDarkMode 
        ? `0 8px 32px ${alpha(theme.palette.primary.main, 0.3)}` 
        : `0 8px 24px ${alpha(theme.palette.primary.main, 0.15)}`,
      transform: 'translateY(-2px)',
      '&::before': {
        left: '100%',
      },
    },
  };
});

// Enhanced styled components for better aesthetics
const StyledPaper = styled(Paper)(({ theme }) => ({
  background: theme.palette.mode === 'dark'
    ? `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.default, 0.8)})`
    : `linear-gradient(145deg, ${theme.palette.background.paper}, ${alpha(theme.palette.primary.main, 0.02)})`,
  backdropFilter: 'blur(10px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
}));

const EnhancedButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 1.5,
  fontWeight: 600,
  textTransform: 'none',
  letterSpacing: '0.5px',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: `linear-gradient(90deg, transparent, ${alpha('#fff', 0.2)}, transparent)`,
    transition: 'left 0.5s ease',
  },
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.palette.mode === 'dark'
      ? `0 8px 25px ${alpha(theme.palette.primary.main, 0.4)}`
      : `0 8px 25px ${alpha(theme.palette.primary.main, 0.3)}`,
    '&::before': {
      left: '100%',
    },
  },
  '&:active': {
    transform: 'translateY(0px)',
  },
}));

const DocumentCard = styled(ListItem)(({ theme, isactive }) => ({
  marginBottom: theme.spacing(1),
  borderRadius: theme.shape.borderRadius * 2,
  backgroundColor: isactive === 'true'
    ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.25 : 0.12)
    : 'transparent',
  border: `2px solid ${isactive === 'true' 
    ? alpha(theme.palette.primary.main, 0.4) 
    : 'transparent'}`,
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  background: isactive === 'true'
    ? (theme.palette.mode === 'dark'
      ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.25)}, ${alpha(theme.palette.primary.main, 0.15)})`
      : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)}, ${alpha(theme.palette.primary.main, 0.08)})`)
    : 'transparent',
  backdropFilter: isactive === 'true' ? 'blur(10px)' : 'none',
  boxShadow: isactive === 'true' 
    ? (theme.palette.mode === 'dark'
      ? `0 8px 32px ${alpha(theme.palette.primary.main, 0.3)}, inset 0 1px 0 ${alpha('#fff', 0.1)}`
      : `0 8px 32px ${alpha(theme.palette.primary.main, 0.15)}, inset 0 1px 0 ${alpha('#fff', 0.6)}`)
    : 'none',
  '&::before': {
    content: '""',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: isactive === 'true' ? '4px' : '0px',
    background: `linear-gradient(180deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
    transition: 'width 0.3s ease',
  },
  '&:hover': {
    backgroundColor: isactive === 'true'
      ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.35 : 0.18)
      : alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.15 : 0.08),
    transform: 'translateX(4px)',
    boxShadow: theme.palette.mode === 'dark'
      ? `0 4px 20px ${alpha(theme.palette.primary.main, 0.2)}`
      : `0 4px 16px ${alpha(theme.palette.primary.main, 0.15)}`,
    '&::before': {
      width: '4px',
    },
  },
}));
const getFileIcon = (fileType, iconProps = {}) => {
  const fileExtension = (typeof fileType === 'string') 
    ? fileType.toLowerCase()
    : '';
  
  // Handle document_type values from API
  switch(fileExtension) {
    case 'pdf':
      return <PictureAsPdfIcon {...iconProps} />;
    case 'csv':
    case 'xlsx':
    case 'xls':
      return <TableChartIcon {...iconProps} />;
    case 'docx':
    case 'doc':
    case 'text':
      return <ArticleIcon {...iconProps} />;
    default:
      return <InsertDriveFileIcon {...iconProps} />;
  }
};

const FileTypeIcon = ({ fileType }) => {
  const theme = useTheme();
  const iconProps = { 
    sx: { 
      fontSize: 40, 
      color: theme.palette.primary.main,
      filter: theme.palette.mode === 'dark' ? 'drop-shadow(0 0 3px rgba(255,255,255,0.2))' : 'none',
      transition: 'all 0.2s ease-in-out',
      '&:hover': {
        transform: 'scale(1.05)'
      }
    } 
  };
  
  switch(fileType) {
    case 'pdf':
      return <PictureAsPdfIcon {...iconProps} />;
    case 'csv':
    case 'xlsx':
    case 'xls':
      return <TableChartIcon {...iconProps} />;
    default:
      return <ArticleIcon {...iconProps} />;
  }
};

function Documents({ 
  projectId, 
  setCodesModalOpen, 
  selection, 
  setSelection, 
  bubbleAnchor, 
  setBubbleAnchor,
  handleBubbleCodesClick,
  setPendingCodeSelection,  
  commentData,
  setCommentData,
  codeAssignments,
  setCodeAssignments,
  documents = [],
  setDocuments, // Parent component's documents state setter
  refreshSidebar, // New prop to trigger sidebar refresh when documents change
  selectedDocumentId, // New prop to handle document selection from navigation
  setSelectedDocumentId, // New prop to clear selection after processing
  onDocumentsUpdated = null, // Callback for when documents are updated
  onCommentsUpdated = null // Callback for when comments are updated
}) {
  const theme = useTheme();
  const { themeMode } = useContext(ThemeModeContext);
  const customTheme = useMemo(() => getCustomTheme(theme), [theme]);
  // State to control panel expansion (true = expanded, false = collapsed)
  const [isPanelExpanded, setIsPanelExpanded] = useState(true);
  
  // Enhanced button style - used throughout component
  const enhancedButtonStyle = {
    borderRadius: theme.shape.borderRadius * 1.5,
    fontWeight: 600,
    textTransform: 'none',
    letterSpacing: '0.5px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: theme.palette.mode === 'dark'
      ? `0 4px 16px ${alpha(theme.palette.common.black, 0.3)}`
      : `0 4px 16px ${alpha(theme.palette.primary.main, 0.15)}`,
    '&:hover': {
      transform: 'translateY(-3px)',
      boxShadow: theme.palette.mode === 'dark'
        ? `0 8px 32px ${alpha(theme.palette.primary.main, 0.4)}`
        : `0 8px 32px ${alpha(theme.palette.primary.main, 0.25)}`,
    },
    '&:active': {
      transform: 'translateY(-1px)',
    }
  };
  
  // State variables
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileData, setFileData] = useState({});
  const [activeFile, setActiveFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState(null);
  const [documentText, setDocumentText] = useState('');
  const [annotations, setAnnotations] = useState([]);
  const [showBubble, setShowBubble] = useState(false);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [tempSelection, setTempSelection] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [processingFile, setProcessingFile] = useState(false);
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  // Added state for fetched documents
  const [projectDocuments, setProjectDocuments] = useState(documents || []);
  const [isLoading, setIsLoading] = useState(false);
  
  // Added state for active document details
  const [activeDocument, setActiveDocument] = useState(null);
  const [documentContent, setDocumentContent] = useState([]);
  const [loadingDocument, setLoadingDocument] = useState(false);
  // Debug - log document props when they change
  useEffect(() => {
    console.log(`Received ${documents ? documents.length : 0} documents from parent component:`, documents);
    
    // Update from parent documents prop if it exists and is an array
    if (documents && Array.isArray(documents)) {
      setProjectDocuments(documents);
    } else {
      console.warn("Documents prop is not valid:", documents);
    }
  }, [documents]);
  
  // Handle selected document ID from navigation
  useEffect(() => {
    if (selectedDocumentId && documents && Array.isArray(documents)) {
      const selectedDoc = documents.find(doc => doc.id === selectedDocumentId);
      if (selectedDoc) {
        console.log("Processing selected document from navigation:", selectedDoc);
        handleDocumentSelect(selectedDoc);
        // Clear the selected document ID after processing
        if (setSelectedDocumentId) {
          setSelectedDocumentId(null);
        }
      } else {
        console.warn(`Document with id ${selectedDocumentId} not found in documents array`);
      }
    }
  }, [selectedDocumentId, documents, setSelectedDocumentId]);
  
  // Fetch documents only if needed (no documents from props)
  useEffect(() => {
    // Only fetch if we have a projectId and no documents are provided from parent
    if (projectId && (!documents || documents.length === 0) && !isLoading) {
      console.log("No documents from props, fetching directly...");
      fetchProjectDocuments();
    }
  }, [projectId]); // Removed documents dependency to prevent circular updates
    // Fetch documents function using the comprehensive project endpoint
  const fetchProjectDocuments = async () => {
    if (!projectId) return;
    
    setIsLoading(true);
    try {
      console.log(`Fetching project ${projectId} with all document data from API`);
      const projectData = await projectsApi.getProjectWithContent(projectId);
      console.log("API returned comprehensive project data:", projectData);
      
      if (projectData && projectData.documents && Array.isArray(projectData.documents)) {
        console.log(`Setting ${projectData.documents.length} documents to state`);
        setProjectDocuments(projectData.documents);
        
        // Update parent component state if provided
        if (setDocuments) {
          setDocuments(projectData.documents);
        }
        
        // Only call onDocumentsUpdated callback if it's NOT from an initial fetch
        // This prevents circular updates when the parent already has the data
        // if (typeof onDocumentsUpdated === 'function') {
        //   onDocumentsUpdated(projectData.documents);
        // }
      } else {
        console.warn("Project data didn't include documents array:", projectData);
        setProjectDocuments([]);
      }
      
      // Don't refresh sidebar automatically to prevent circular calls
      // if (typeof refreshSidebar === 'function') {
      //   refreshSidebar();
      // }
    } catch (error) {
      console.error("Error fetching project data:", error);
      setUploadError("Failed to fetch project data");
    } finally {
      setIsLoading(false);
    }
  };  // Handle document selection
  const handleDocumentSelect = (doc) => {
    console.log("Selected document:", doc);
    setActiveFile(doc.id);
    setActiveDocument(doc);
    setLoadingDocument(true);
    
    // Debug logging to help troubleshoot
    console.log("Complete document object:", doc);
    
    // With comprehensive project API, the document should already have content
    if (doc.content && typeof doc.content === 'string') {
      console.log(`Document has content with length: ${doc.content.length}`);
      setDocumentContent(doc.content.split('\n'));
      setLoadingDocument(false);
    } else {
      console.warn("Document doesn't have content field:", doc);
      setDocumentContent([]);
      setLoadingDocument(false);
      
      // If we somehow ended up with a document without content, refetch the whole project
      // to ensure we have the most up-to-date data with all content
      fetchProjectDocuments();
    }
  };
  
  // Handle file change when using the browse option
  const handleSelectFiles = (event) => {
    const files = Array.from(event.target.files);
    if (files && files.length > 0) {
      setSelectedFiles([...selectedFiles, ...files]);
      if (!activeFile) {
        setActiveFile(files[0].name);
      }
    }
  };

  // File change handler - just for UI
  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    if (files && files.length > 0) {
      setSelectedFiles([...selectedFiles, ...files]);
      if (!activeFile) {
        setActiveFile(files[0].name);
      }
    }
  };

  // Drag and drop handlers - just for UI
  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    const files = Array.from(event.dataTransfer.files);
    if (files && files.length > 0) {
      setSelectedFiles([...selectedFiles, ...files]);
      if (!activeFile) {
        setActiveFile(files[0].name);
      }
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  // File selection
  const handleFileSelect = (fileName) => {
    setActiveFile(fileName);
  };
  
  // File removal
  const handleRemoveFile = (fileName) => {
    setSelectedFiles(selectedFiles.filter(file => file.name !== fileName));
    if (activeFile === fileName) {
      setActiveFile(selectedFiles[0]?.name || null);
    }
  };
  
  // Handle single document upload
  const handleSingleUpload = async (file, name = null, description = null) => {
    if (!projectId) {
      throw new Error("Project ID is required for uploading documents");
    }
    
    try {
      console.log(`Uploading single document: ${file.name} to project ${projectId}`);
      const result = await documentsApi.uploadDocument(projectId, file, name, description);
      console.log('Single upload response:', result);
      return result;
    } catch (error) {
      console.error('Error uploading single document:', error);
      throw error;
    }
  };
  
  // Handle bulk upload
  const handleBulkUpload = async (files) => {
    if (!projectId) {
      throw new Error("Project ID is required for uploading documents");
    }

    try {
      console.log(`Uploading ${files.length} files to project ${projectId}`);
      const result = await documentsApi.bulkUploadDocuments(projectId, files);
      console.log('Bulk upload response:', result);
      return result;
    } catch (error) {
      console.error('Error bulk uploading documents:', error);
      throw error;
    }
  };
    // Handle upload of all selected files
  const handleUpload = async () => {
    if (!projectId) {
      setUploadError("No project selected. Please select a project first.");
      return;
    }

    if (selectedFiles.length === 0) {
      setUploadError("No files selected for upload");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      let result;
      
      if (selectedFiles.length === 1) {
        // Use single upload for one file
        console.log(`Uploading single file: ${selectedFiles[0].name} to project ${projectId}`);
        result = await handleSingleUpload(selectedFiles[0]);
      } else {
        // Use bulk upload for multiple files
        console.log(`Bulk uploading ${selectedFiles.length} files to project ${projectId}`);
        result = await handleBulkUpload(selectedFiles);
      }
      
      // Clear selected files after successful upload
      setSelectedFiles([]);
      setActiveFile(null);
      setUploadSuccess(true);
      
      // Refresh project data to get the updated documents with content
      await fetchProjectDocuments();
      
      // Notify parent that documents were updated due to upload
      if (typeof onDocumentsUpdated === 'function') {
        console.log("Notifying parent of document upload completion");
        // We don't need to pass the documents since fetchProjectDocuments already updated the state
        onDocumentsUpdated([]);
      }
      
    } catch (error) {
      console.error('Error during upload:', error);
      setUploadError(error.message || "Failed to upload files");
    } finally {
      setUploading(false);
    }
  };
    // Handle document deletion
  const handleDeleteDocument = async (documentId) => {
    if (!projectId || !documentId) {
      console.error("Project ID and Document ID are required for deletion");
      return;
    }
    
    if (!window.confirm("Are you sure you want to delete this document? This action cannot be undone.")) {
      return;
    }
    
    try {
      console.log(`Deleting document ${documentId} from project ${projectId}`);
      await documentsApi.deleteDocument(documentId);
      
      // If the deleted document was the active one, clear active document
      if (activeFile === documentId) {
        setActiveFile(null);
        setActiveDocument(null);
        setDocumentContent([]);
      }
      
      // Fetch fresh project data to ensure we have the most up-to-date document list
      // This will update all states via the fetchProjectDocuments function
      await fetchProjectDocuments();
      
      // Notify parent that documents were updated due to deletion
      if (typeof onDocumentsUpdated === 'function') {
        console.log("Notifying parent of document deletion completion");
        onDocumentsUpdated([]);
      }
      
      console.log("Document deleted successfully");
    } catch (error) {
      console.error("Error deleting document:", error);
      setFileError("Failed to delete document: " + (error.message || "Unknown error"));
    }  };
  
  // State for analysis panel visibility
  const [showAnalysisPanel, setShowAnalysisPanel] = useState(true);
  
  // State for text selection toolbar
  const [showSelectionToolbar, setShowSelectionToolbar] = useState(false);
  const [selectionPosition, setSelectionPosition] = useState({ top: 0, left: 0 });
  
  // Get surrounding context for the selection
  const getSelectionContext = useCallback((selection) => {
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    
    // Try to get the containing paragraph or element
    const paragraph = container.parentElement || container;
    return paragraph.textContent || '';
  }, []);
  
  // Handle text selection in document segments
  const handleTextSelection = useCallback((e) => {
    // Don't process text selection if clicking inside the toolbar
    if (e && e.target && e.target.closest('.selection-toolbar')) {
      return;
    }

    const selection = window.getSelection();
    
    if (selection.toString().trim().length > 0) {
      // Get selection range
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      // Get the active document
      if (activeDocument) {
        // Calculate position for the floating toolbar
        setSelectionPosition({
          top: rect.top - 50, // Position above the selection
          left: rect.left + (rect.width / 2) - 75, // Center horizontally
        });
          // Get character positions in the document
        const allText = document.querySelector('.document-content-container').textContent;
        const text = selection.toString();
        
        // Find start and end positions of the selected text
        // Note: This is a simplified approach for demo purposes
        // In a real app, you'd need more sophisticated position tracking
        const startChar = allText.indexOf(text);
        const endChar = startChar + text.length;
        
        // Set selection data
        const selectionData = {
          text: text,
          documentId: activeDocument.id,
          documentName: activeDocument.name,
          context: getSelectionContext(selection),
          timestamp: new Date().toISOString(),
          startChar: startChar,
          endChar: endChar
        };
        
        setSelection(selectionData);
        setShowSelectionToolbar(true);
        
        // Save to parent component's state
        if (setSelection) {
          setSelection(selectionData);
        }
      }
    } else {
      // Don't hide toolbar when clicking on it
      if (e && e.target && !e.target.closest('.selection-toolbar')) {
        setShowSelectionToolbar(false);
      }
    }
  }, [activeDocument, setSelection, getSelectionContext]);
  
  // Handle Add Comment button click
  const handleAddComment = () => {
    if (selection) {
      setCommentModalOpen(true);
      setShowSelectionToolbar(false);
    }
  };
  
  // Handle Assign Code button click
  const handleAssignCode = () => {
    if (selection) {
      setPendingCodeSelection(selection);
      setCodesModalOpen(true);
      setShowSelectionToolbar(false);
    }
  };
  // Enhanced function to highlight text selections in the document
  const highlightTextInLine = (lineText, annotations) => {
    if (!lineText || (!annotations?.length)) return lineText;
    
    // Sort annotations by start position to handle overlapping selections
    const sortedAnnotations = [...annotations].sort((a, b) => (a.start_char || 0) - (b.start_char || 0));
    
    let highlightedText = lineText;
    
    sortedAnnotations.forEach(annotation => {
      const textSnippet = annotation.text_snapshot;
      if (textSnippet && highlightedText.includes(textSnippet)) {
        const startIndex = highlightedText.indexOf(textSnippet);
        if (startIndex !== -1) {
          const beforeText = highlightedText.substring(0, startIndex);
          const afterText = highlightedText.substring(startIndex + textSnippet.length);
          
          // Determine highlight color based on annotation type
          const isCodeAssignment = annotation.code_name || annotation.assignment_type;
          const highlightColor = isCodeAssignment 
            ? theme.palette.secondary.main 
            : theme.palette.info.main;
          
          const highlightBg = isCodeAssignment 
            ? alpha(theme.palette.secondary.main, 0.15)
            : alpha(theme.palette.info.main, 0.15);
          
          const highlightBorder = isCodeAssignment 
            ? alpha(theme.palette.secondary.main, 0.4)
            : alpha(theme.palette.info.main, 0.4);
          
          highlightedText = beforeText + 
            `<span style="
              background: ${highlightBg}; 
              border: 2px solid ${highlightBorder}; 
              border-radius: 6px; 
              padding: 2px 6px; 
              margin: 0 2px; 
              font-weight: 600;
              box-shadow: 0 2px 8px ${alpha(highlightColor, 0.2)};
              position: relative;
              display: inline-block;
              transition: all 0.2s ease;
            ">` + 
            textSnippet + 
            '</span>' + 
            afterText;
        }
      }
    });
    
    return highlightedText;
  };

  // Function to scroll to and highlight a specific annotation
  const scrollToAnnotation = (annotation) => {
    const container = document.querySelector('.document-content-container');
    if (!container || !annotation.text_snapshot) return;
    
    // Find the element containing the annotation text
    const textElements = container.querySelectorAll('[data-annotation-text]');
    let targetElement = null;
    
    // If we can't find by data attribute, search by text content
    if (!targetElement) {
      const allParagraphs = container.querySelectorAll('p, div');
      targetElement = Array.from(allParagraphs).find(el => 
        el.textContent && el.textContent.includes(annotation.text_snapshot)
      );
    }
    
    if (targetElement) {
      // Scroll to the element
      targetElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center'
      });
      
      // Add temporary highlight effect
      const originalStyle = targetElement.style.cssText;
      targetElement.style.cssText += `
        background: ${alpha(theme.palette.primary.main, 0.2)} !important;
        transform: scale(1.02) !important;
        transition: all 0.3s ease !important;
      `;
      
      // Remove highlight after animation
      setTimeout(() => {
        targetElement.style.cssText = originalStyle;
      }, 2000);
    }
  };
  const getCurrentDocumentAnnotations = () => {
    const allAnnotations = [];
    
    // Add comments
    if (commentData && commentData.length > 0) {
      allAnnotations.push(...commentData.filter(comment => 
        comment.document_id === activeDocument?.id
      ));
    }
    
    // Add code assignments
    if (codeAssignments && codeAssignments.length > 0) {
      allAnnotations.push(...codeAssignments.filter(assignment => 
        assignment.document_id === activeDocument?.id
      ));
    }
    
    return allAnnotations;
  };
  const handleSaveComment = async () => {
    if (selection && newComment) {
      try {
        const { default: api } = await import('../utils/api');
        
        // Prepare annotation data
        const annotationData = {
          document_id: parseInt(selection.documentId),
          content: newComment,
          text_snapshot: selection.text,
          start_char: parseInt(selection.startChar),
          end_char: parseInt(selection.endChar),
          annotation_type: 'MEMO',
          project_id: parseInt(projectId)
        };
        
        // Save to the backend
        const result = await api.annotations.createAnnotation(annotationData);
        
        console.log('Annotation created successfully:', result);
        
        // Show success message
        setSnackbarMessage('Comment saved successfully!');
        setSnackbarOpen(true);
        
        // Create the new annotation object with the proper structure
        const newAnnotation = {
          id: result.id || Date.now(), // Use API response ID if available
          document_id: parseInt(selection.documentId),
          document_name: selection.documentName,
          content: newComment,
          text_snapshot: selection.text,
          start_char: parseInt(selection.startChar),
          end_char: parseInt(selection.endChar),
          annotation_type: 'MEMO',
          project_id: parseInt(projectId),
          created_at: new Date().toISOString(),
          created_by_email: 'current_user@example.com' // You might want to get this from auth context
        };

        // Update local comments array immediately for instant UI feedback
        setCommentData(prev => [...prev, newAnnotation]);
        
        // Notify parent about comment update if callback provided
        if (typeof onCommentsUpdated === 'function') {
          console.log('Notifying parent about comment update');
          onCommentsUpdated();
        }
        
        // Trigger refresh of the parent component's data to ensure Comments component gets updated
        if (typeof refreshSidebar === 'function') {
          console.log('Triggering parent data refresh after comment creation');
          refreshSidebar();
        }
        
        // Close modal and reset
        setCommentModalOpen(false);
        setNewComment('');
        setSelection(null);
      } catch (error) {
        console.error('Error saving annotation:', error);
        setSnackbarMessage('Failed to save comment: ' + (error.message || 'Unknown error'));
        setSnackbarOpen(true);
      }
    }
  };// Attach and remove mouse up event handler for text selection
  useEffect(() => {
    if (activeDocument) {
      document.addEventListener('mouseup', handleTextSelection);
      
      return () => {
        document.removeEventListener('mouseup', handleTextSelection);
      };
    }
  }, [activeDocument, handleTextSelection]);
  
  // Click outside to close the selection toolbar
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Only handle if toolbar is visible
      if (showSelectionToolbar) {
        // Clear selection on document click (but not on toolbar itself)
        const toolbar = document.querySelector('.selection-toolbar');
        if (toolbar && !toolbar.contains(event.target)) {
          setShowSelectionToolbar(false);
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };  }, [showSelectionToolbar]);
  
  // Floating toolbar component for text selection actions - Enhanced
  const FloatingSelectionToolbar = () => {
    if (!showSelectionToolbar) return null;
    
    return (
      <Zoom in={showSelectionToolbar}>
        <StyledPaper
          className="selection-toolbar"
          elevation={8}
          sx={{
            position: 'fixed',
            top: `${selectionPosition.top}px`,
            left: `${selectionPosition.left}px`,
            zIndex: 1400, // Increased z-index to be above all content
            borderRadius: theme.shape.borderRadius * 2,
            background: theme.palette.mode === 'dark'
              ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)}, ${alpha(theme.palette.primary.main, 0.1)})`
              : `linear-gradient(135deg, ${theme.palette.background.paper}, ${alpha(theme.palette.primary.main, 0.05)})`,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
            boxShadow: theme.palette.mode === 'dark'
              ? `0 16px 40px ${alpha(theme.palette.common.black, 0.6)}, 0 0 20px ${alpha(theme.palette.primary.main, 0.3)}`
              : `0 16px 40px ${alpha(theme.palette.common.black, 0.15)}, 0 0 0 1px ${alpha(theme.palette.primary.main, 0.1)}`,
            transform: 'translate(-50%, -100%)',
            p: 1.5,
            display: 'flex',
            gap: 1.5,
            '&::before': {
              content: '""',
              position: 'absolute',
              bottom: -8,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderTop: `8px solid ${theme.palette.mode === 'dark' 
                ? alpha(theme.palette.background.paper, 0.95) 
                : theme.palette.background.paper}`,
            },
          }}
        >
          <Tooltip title="Add Comment" placement="top">
            <EnhancedButton
              variant="contained"
              color="primary"
              startIcon={<ChatBubbleOutlineIcon />}
              onClick={handleAddComment}
              size="small"
              sx={{
                borderRadius: theme.shape.borderRadius * 1.5,
                fontWeight: 600,
                fontSize: '0.8rem',
                minWidth: 'auto',
                px: 2,
                py: 1,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              }}
            >
              Comment
            </EnhancedButton>
          </Tooltip>
          <Tooltip title="Assign Code" placement="top">
            <EnhancedButton
              variant="contained"
              color="secondary"
              startIcon={<LocalOfferIcon />}
              onClick={handleAssignCode}
              size="small"
              sx={{
                borderRadius: theme.shape.borderRadius * 1.5,
                fontWeight: 600,
                fontSize: '0.8rem',
                minWidth: 'auto',
                px: 2,
                py: 1,
                background: `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.dark})`,
              }}
            >
              Code
            </EnhancedButton>
          </Tooltip>
        </StyledPaper>
      </Zoom>
    );
  };
  
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: { xs: 'column', lg: 'row' }, 
      height: '100vh',
      overflow: 'hidden',
      background: theme.palette.mode === 'dark' 
        ? `radial-gradient(ellipse at top left, ${alpha(theme.palette.primary.main, 0.15)}, transparent 50%), 
           radial-gradient(ellipse at bottom right, ${alpha(theme.palette.secondary.main, 0.1)}, transparent 50%),
           ${theme.palette.background.default}`
        : `radial-gradient(ellipse at top left, ${alpha(theme.palette.primary.main, 0.06)}, transparent 50%), 
           radial-gradient(ellipse at bottom right, ${alpha(theme.palette.secondary.main, 0.04)}, transparent 50%),
           ${alpha(theme.palette.primary.main, 0.02)}`,
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: theme.palette.mode === 'dark'
          ? `linear-gradient(135deg, transparent 0%, ${alpha(theme.palette.primary.main, 0.05)} 25%, transparent 50%, ${alpha(theme.palette.secondary.main, 0.03)} 75%, transparent 100%)`
          : `linear-gradient(135deg, transparent 0%, ${alpha(theme.palette.primary.main, 0.02)} 25%, transparent 50%, ${alpha(theme.palette.secondary.main, 0.015)} 75%, transparent 100%)`,
        pointerEvents: 'none',
      },
    }}>
      {/* Left panel - file upload and document list - with enhanced animation */}
      <StyledPaper elevation={0} sx={{
        width: { 
          xs: '100%',
          lg: isPanelExpanded ? 340 : 60
        },
        height: { 
          xs: isPanelExpanded ? 'auto' : '56px',
          lg: '100vh' 
        },
        maxHeight: { xs: '50vh', lg: '100vh' },
        borderRight: { lg: `1px solid ${alpha(theme.palette.divider, 0.1)}` },
        borderBottom: { xs: `1px solid ${alpha(theme.palette.divider, 0.1)}`, lg: 'none' },
        borderRadius: 0,
        overflow: isPanelExpanded ? 'hidden' : 'visible',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        zIndex: 3,
        flexShrink: 0,
        background: theme.palette.mode === 'dark'
          ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)}, ${alpha(theme.palette.background.paper, 0.8)})`
          : `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.98)}, ${alpha(theme.palette.background.paper, 0.9)})`,
        backdropFilter: 'blur(20px)',
        boxShadow: theme.palette.mode === 'dark'
          ? `0 8px 32px ${alpha(theme.palette.common.black, 0.4)}, inset 1px 0 0 ${alpha('#fff', 0.1)}`
          : `0 8px 32px ${alpha(theme.palette.common.black, 0.1)}, inset 1px 0 0 ${alpha('#fff', 0.8)}`,
      }}>
        {/* Header with Toggle Button - Enhanced */}
        <Box sx={{
          p: isPanelExpanded ? 2 : 1,
          minHeight: isPanelExpanded ? 56 : 48,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          display: 'flex',
          alignItems: 'center',
          gap: isPanelExpanded ? 2 : 1,
          background: theme.palette.mode === 'dark'
            ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)}, ${alpha(theme.palette.secondary.main, 0.08)})`
            : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)}, ${alpha(theme.palette.secondary.main, 0.04)})`,
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '1px',
            background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.primary.main, 0.5)}, transparent)`,
          },
        }}>
          <IconButton 
            onClick={() => setIsPanelExpanded(prev => !prev)}
            size="small"
            sx={{ 
              color: theme.palette.primary.main,
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              borderRadius: 2,
              width: isPanelExpanded ? 36 : 32,
              height: isPanelExpanded ? 36 : 32,
              flexShrink: 0, // Prevent shrinking
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              overflow: 'hidden',
              zIndex: 10, // Ensure it's always on top
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.primary.main, 0.3)}, transparent)`,
                transition: 'left 0.5s ease',
              },
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.2),
                transform: 'scale(1.1) rotate(180deg)',
                boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.4)}`,
                borderColor: alpha(theme.palette.primary.main, 0.4),
                '&::before': {
                  left: '100%',
                },
              },
              '&:active': {
                transform: 'scale(0.95)',
              },
            }}
            aria-label={isPanelExpanded ? "Collapse panel" : "Expand panel"}
          >
            {isPanelExpanded ? <KeyboardArrowLeftIcon /> : <KeyboardArrowRightIcon />}
          </IconButton>
          <Fade in={isPanelExpanded} timeout={300}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontSize: isPanelExpanded ? '1.3rem' : '1rem', 
                fontWeight: 800,
                background: theme.palette.mode === 'dark'
                  ? `linear-gradient(45deg, ${theme.palette.primary.light}, ${theme.palette.secondary.light})`
                  : `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 0,
                letterSpacing: '-0.5px',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                '&::before': {
                  content: '""',
                  width: '4px',
                  height: '20px',
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  borderRadius: '2px',
                  display: 'block',
                },
              }}
            >
              Documents
            </Typography>
          </Fade>
        </Box>
        
        {/* Only show content when expanded */}
        {isPanelExpanded && (
          <>
            {/* Upload section - Enhanced */}
            <Box sx={{
              p: 3,
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.06)}`,
              flexShrink: 0,
              background: theme.palette.mode === 'dark'
                ? `radial-gradient(ellipse at top, ${alpha(theme.palette.primary.main, 0.08)}, transparent)`
                : `radial-gradient(ellipse at top, ${alpha(theme.palette.primary.main, 0.03)}, transparent)`,
            }}>
              <DropzoneArea 
                isdragging={isDragging ? 'true' : 'false'}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => document.getElementById('file-input').click()}
                sx={{ mb: 2.5 }}
              >
                <Box sx={{ 
                  position: 'relative',
                  mb: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}>
                  <Box sx={{
                    position: 'relative',
                    mb: 2,
                    p: 2,
                    borderRadius: '50%',
                    background: theme.palette.mode === 'dark'
                      ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.2)}, ${alpha(theme.palette.secondary.main, 0.1)})`
                      : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.05)})`,
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: -2,
                      left: -2,
                      right: -2,
                      bottom: -2,
                      borderRadius: '50%',
                      background: `conic-gradient(from 0deg, ${alpha(theme.palette.primary.main, 0.3)}, transparent, ${alpha(theme.palette.primary.main, 0.3)})`,
                      animation: 'spin 8s linear infinite',
                    },
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      borderRadius: '50%',
                      background: theme.palette.mode === 'dark'
                        ? alpha(theme.palette.background.paper, 0.9)
                        : alpha(theme.palette.background.paper, 0.95),
                    },
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' },
                    },
                  }}>
                    <CloudUploadIcon 
                      color="primary" 
                      sx={{ 
                        fontSize: 48, 
                        position: 'relative',
                        zIndex: 1,
                        filter: theme.palette.mode === 'dark' 
                          ? 'drop-shadow(0 0 12px rgba(64,195,255,0.5))' 
                          : 'drop-shadow(0 2px 8px rgba(25,118,210,0.3))',
                        transition: 'all 0.3s ease',
                      }} 
                    />
                  </Box>
                  <Typography variant="h6" component="div" sx={{ 
                    fontWeight: 600, 
                    mb: 0.5,
                    background: theme.palette.mode === 'dark'
                      ? `linear-gradient(45deg, ${theme.palette.primary.light}, ${theme.palette.secondary.light})`
                      : `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>
                    Drag & Drop Files
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ 
                    mb: 2,
                    fontSize: '0.9rem',
                    fontWeight: 500,
                  }}>
                    or click to browse
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                    <Chip 
                      icon={<PictureAsPdfIcon />}
                      label="PDF" 
                      size="small" 
                      variant="outlined"
                      sx={{ 
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        borderColor: alpha(theme.palette.primary.main, 0.4),
                        color: theme.palette.primary.main,
                        borderRadius: 2,
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          transform: 'translateY(-1px)',
                          boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
                        },
                        transition: 'all 0.3s ease',
                      }}
                    />
                    <Chip 
                      icon={<ArticleIcon />}
                      label="DOCX" 
                      size="small" 
                      variant="outlined"
                      sx={{ 
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        borderColor: alpha(theme.palette.secondary.main, 0.4),
                        color: theme.palette.secondary.main,
                        borderRadius: 2,
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                          transform: 'translateY(-1px)',
                          boxShadow: `0 4px 12px ${alpha(theme.palette.secondary.main, 0.2)}`,
                        },
                        transition: 'all 0.3s ease',
                      }}
                    />
                    <Chip 
                      icon={<TableChartIcon />}
                      label="CSV" 
                      size="small" 
                      variant="outlined"
                      sx={{ 
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        borderColor: alpha(theme.palette.info.main, 0.4),
                        color: theme.palette.info.main,
                        borderRadius: 2,
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.info.main, 0.1),
                          transform: 'translateY(-1px)',
                          boxShadow: `0 4px 12px ${alpha(theme.palette.info.main, 0.2)}`,
                        },
                        transition: 'all 0.3s ease',
                      }}
                    />
                  </Box>
                </Box>
                <input
                  id="file-input"
                  type="file"
                  multiple
                  onChange={handleSelectFiles}
                  style={{ display: 'none' }}
                  accept=".pdf,.docx,.doc,.csv,.xlsx,.xls,.txt"
                />
              </DropzoneArea>

              {uploadError && (
                <Zoom in={!!uploadError}>
                  <Alert 
                    severity="error" 
                    sx={{ 
                      mt: 2, 
                      mb: 2,
                      borderRadius: theme.shape.borderRadius * 1.5,
                      '& .MuiAlert-icon': {
                        fontSize: '1.2rem'
                      }
                    }} 
                    onClose={() => setUploadError(null)}
                  >
                    {uploadError}
                  </Alert>
                </Zoom>
              )}

              {fileError && (
                <Zoom in={!!fileError}>
                  <Alert 
                    severity="warning" 
                    sx={{ 
                      mt: 2, 
                      mb: 2,
                      borderRadius: theme.shape.borderRadius * 1.5,
                      '& .MuiAlert-icon': {
                        fontSize: '1.2rem'
                      }
                    }} 
                    onClose={() => setFileError(null)}
                  >
                    {fileError}
                  </Alert>
                </Zoom>
              )}

              {selectedFiles.length > 0 && (
                <Zoom in={selectedFiles.length > 0}>
                  <EnhancedButton
                    variant="contained"
                    fullWidth
                    onClick={handleUpload}
                    disabled={uploading}
                    startIcon={uploading ? <CircularProgress size={18} color="inherit" /> : <UploadFileIcon />}
                    sx={{
                      py: 2,
                      fontSize: '1rem',
                      fontWeight: 700,
                      borderRadius: 3,
                      background: theme.palette.mode === 'dark'
                        ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`
                        : `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                      boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.4)}`,
                      border: `1px solid ${alpha(theme.palette.primary.light, 0.3)}`,
                      position: 'relative',
                      overflow: 'hidden',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: '-100%',
                        width: '100%',
                        height: '100%',
                        background: `linear-gradient(90deg, transparent, ${alpha('#fff', 0.3)}, transparent)`,
                        transition: 'left 0.6s ease',
                      },
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.5)}`,
                        '&::before': {
                          left: '100%',
                        },
                      },
                      '&:disabled': {
                        background: theme.palette.action.disabledBackground,
                        color: theme.palette.action.disabled,
                        transform: 'none',
                        boxShadow: 'none',
                      },
                    }}
                  >
                    {uploading 
                      ? `Uploading ${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''}...` 
                      : `Upload ${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''}`
                    }
                  </EnhancedButton>
                </Zoom>
              )}
            </Box>
          
            {/* File list section - Enhanced */}
            <Box sx={{
              flexGrow: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              px: 1.5,
              py: 2,
              minHeight: 0, // Important for flex child to scroll
              maxHeight: { xs: '40vh', lg: 'auto' },
              '&::-webkit-scrollbar': {
                width: '6px',
              },
              '&::-webkit-scrollbar-track': {
                background: alpha(theme.palette.divider, 0.1),
                borderRadius: '10px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: alpha(theme.palette.primary.main, 0.3),
                borderRadius: '10px',
                '&:hover': {
                  background: alpha(theme.palette.primary.main, 0.5),
                },
              },
            }}>
              {/* Selected files section - Enhanced */}
              {selectedFiles.length > 0 && (
                <Fade in={selectedFiles.length > 0}>
                  <Box>
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        px: 2, 
                        pt: 1, 
                        pb: 2, 
                        color: theme.palette.text.secondary,
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        letterSpacing: 1,
                        textTransform: 'uppercase',
                        position: 'relative',
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          bottom: 8,
                          left: 16,
                          width: '30px',
                          height: '2px',
                          background: `linear-gradient(90deg, ${theme.palette.primary.main}, transparent)`,
                        }
                      }}
                    >
                      Selected Files ({selectedFiles.length})
                    </Typography>
                    
                    {selectedFiles.map((file, index) => {
                      const fileName = file.name;
                      const fileExtension = fileName.split('.').pop().toLowerCase();
                      const isActive = activeFile === fileName;
                      
                      return (
                        <Zoom in={true} timeout={300 + index * 100} key={fileName}>
                          <DocumentCard
                            isactive={isActive ? 'true' : 'false'}
                            disablePadding
                          >
                            <ListItemButton
                              onClick={() => handleFileSelect(fileName)}
                              dense
                              sx={{
                                borderRadius: theme.shape.borderRadius * 1.2,
                                py: 1.5,
                                px: 2,
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              }}
                            >
                              <ListItemIcon sx={{ minWidth: 40 }}>
                                <Box sx={{ 
                                  p: 1, 
                                  borderRadius: '50%', 
                                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                                  transition: 'all 0.3s ease',
                                }}>
                                  {getFileIcon(fileExtension, { 
                                    fontSize: 'medium',
                                    color: isActive ? 'primary' : 'inherit',
                                  })}
                                </Box>
                              </ListItemIcon>
                              <ListItemText 
                                primary={fileName}
                                secondary={`${(file.size / 1024).toFixed(1)} KB`}
                                primaryTypographyProps={{
                                  noWrap: true,
                                  sx: {
                                    fontWeight: isActive ? 600 : 500,
                                    fontSize: '0.9rem',
                                    color: isActive 
                                      ? theme.palette.primary.main
                                      : theme.palette.text.primary
                                  }
                                }}
                                secondaryTypographyProps={{
                                  sx: {
                                    fontSize: '0.75rem',
                                    color: theme.palette.text.secondary
                                  }
                                }}
                              />
                              <IconButton 
                                size="small" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveFile(fileName);
                                }}
                                sx={{
                                  color: theme.palette.mode === 'dark' 
                                    ? theme.palette.grey[400] 
                                    : theme.palette.grey[600],
                                  transition: 'all 0.3s ease',
                                  '&:hover': {
                                    color: theme.palette.error.main,
                                    bgcolor: alpha(theme.palette.error.main, 0.1),
                                    transform: 'scale(1.1)',
                                  }
                                }}
                              >
                                <CloseIcon fontSize="small" />
                              </IconButton>
                            </ListItemButton>
                          </DocumentCard>
                        </Zoom>
                      );
                    })}
                    
                    <Divider sx={{ 
                      my: 3, 
                      background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.divider, 0.8)}, transparent)` 
                    }} />
                  </Box>
                </Fade>
              )}
              
              {/* Uploaded Documents Section - Enhanced */}
              {projectDocuments && projectDocuments.length > 0 && (
                <Fade in={projectDocuments.length > 0}>
                  <Box>
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        px: 2, 
                        pt: 1, 
                        pb: 2, 
                        color: theme.palette.text.secondary,
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        letterSpacing: 1,
                        textTransform: 'uppercase',
                        position: 'relative',
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          bottom: 8,
                          left: 16,
                          width: '30px',
                          height: '2px',
                          background: `linear-gradient(90deg, ${theme.palette.secondary.main}, transparent)`,
                        }
                      }}
                    >
                      Project Documents ({projectDocuments.length})
                    </Typography>
                    
                    {(projectDocuments || []).map((document, index) => {
                      const isActive = activeDocument && activeDocument.id === document.id;
                      return (
                        <Zoom in={true} timeout={400 + index * 100} key={document.id}>
                          <DocumentCard
                            isactive={isActive ? 'true' : 'false'}
                            disablePadding
                          >
                            <ListItemButton
                              onClick={() => handleDocumentSelect(document)}
                              dense
                              sx={{
                                borderRadius: theme.shape.borderRadius * 1.2,
                                py: 1.5,
                                px: 2,
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              }}
                            >
                              <ListItemIcon sx={{ minWidth: 40 }}>
                                <Box sx={{ 
                                  p: 1, 
                                  borderRadius: '50%', 
                                  bgcolor: alpha(theme.palette.secondary.main, 0.1),
                                  transition: 'all 0.3s ease',
                                }}>
                                  {getFileIcon(document.document_type, { 
                                    fontSize: 'medium',
                                    color: isActive ? 'secondary' : 'inherit',
                                  })}
                                </Box>
                              </ListItemIcon>
                              <ListItemText 
                                primary={document.name}
                                secondary={`${document.file_size 
                                  ? `${(document.file_size / 1024).toFixed(1)} KB` 
                                  : ''} ${document.document_type ? ` • ${document.document_type.toUpperCase()}` : ''}`}
                                primaryTypographyProps={{
                                  noWrap: true,
                                  sx: {
                                    fontWeight: isActive ? 600 : 500,
                                    fontSize: '0.9rem',
                                    color: isActive 
                                      ? theme.palette.secondary.main
                                      : theme.palette.text.primary
                                  }
                                }}
                                secondaryTypographyProps={{
                                  sx: {
                                    fontSize: '0.75rem',
                                    color: theme.palette.text.secondary
                                  }
                                }}
                              />
                              <IconButton 
                                size="small" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteDocument(document.id);
                                }}
                                sx={{
                                  color: theme.palette.mode === 'dark' 
                                    ? theme.palette.grey[400] 
                                    : theme.palette.grey[600],
                                  transition: 'all 0.3s ease',
                                  '&:hover': {
                                    color: theme.palette.error.main,
                                    bgcolor: alpha(theme.palette.error.main, 0.1),
                                    transform: 'scale(1.1)',
                                  }
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </ListItemButton>
                          </DocumentCard>
                        </Zoom>
                      );
                    })}
                  </Box>
                </Fade>
              )}
              
              {(!projectDocuments || projectDocuments.length === 0) && !uploading && (
                <Fade in={projectDocuments.length === 0}>
                  <Box sx={{ 
                    p: 3, 
                    textAlign: 'center', 
                    color: theme.palette.text.secondary,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    <Box sx={{
                      p: 3,
                      borderRadius: '50%',
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      mb: 2,
                    }}>
                      <ArticleIcon sx={{ fontSize: 48, opacity: 0.6, color: theme.palette.primary.main }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      No documents yet
                    </Typography>
                    <Typography variant="body2" sx={{ maxWidth: 200, lineHeight: 1.5 }}>
                      Upload your first document to get started with analysis
                    </Typography>
                  </Box>
                </Fade>
              )}
            </Box>
          </>
        )}
        
        {!isPanelExpanded && (
          <Fade in={!isPanelExpanded}>
            <Box sx={{ 
              position: 'relative',
              height: 'calc(100% - 56px)', // Account for header height
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              pt: 2,
              px: 1,
            }}>
              <Box sx={{
                p: 2,
                borderRadius: '50%',
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                mb: 3,
              }}>
                <ArticleIcon sx={{ fontSize: 24, color: theme.palette.primary.main }} />
              </Box>
              <Typography 
                variant="caption" 
                sx={{ 
                  transform: 'rotate(-90deg)', 
                  whiteSpace: 'nowrap', 
                  position: 'absolute', 
                  top: '50%', 
                  left: '50%',
                  transformOrigin: 'center',
                  color: theme.palette.text.secondary,
                  fontWeight: 600,
                  letterSpacing: 2,
                }}
              >
                DOCS
              </Typography>
            </Box>
          </Fade>
        )}
      </StyledPaper>
      
      {/* Right panel - document content - Enhanced */}
      <Box sx={{ 
        flexGrow: 1, 
        height: { xs: 'calc(100vh - 50vh)', lg: '100vh' }, 
        minHeight: { xs: '50vh', lg: '100vh' },
        overflow: 'hidden', 
        display: 'flex', 
        flexDirection: 'column',
        background: theme.palette.mode === 'dark' 
          ? `linear-gradient(135deg, ${alpha(theme.palette.background.default, 0.6)}, ${alpha(theme.palette.background.paper, 0.4)})`
          : `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)}, ${alpha(theme.palette.primary.main, 0.02)})`,
        position: 'relative',
        zIndex: 1,
        backdropFilter: 'blur(10px)',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: theme.palette.mode === 'dark'
            ? `repeating-linear-gradient(
                45deg,
                transparent,
                transparent 100px,
                ${alpha(theme.palette.primary.main, 0.02)} 100px,
                ${alpha(theme.palette.primary.main, 0.02)} 200px
              )`
            : `repeating-linear-gradient(
                45deg,
                transparent,
                transparent 100px,
                ${alpha(theme.palette.primary.main, 0.008)} 100px,
                ${alpha(theme.palette.primary.main, 0.008)} 200px
              )`,
          pointerEvents: 'none',
        },
      }}>
        {/* Empty state - Enhanced */}
        {!activeFile && (
          <Fade in={!activeFile}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              p: 4,
              textAlign: 'center',
              position: 'relative',
            }}>
              {/* Animated background elements */}
              <Box sx={{
                position: 'absolute',
                top: '20%',
                left: '20%',
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                bgcolor: alpha(theme.palette.primary.main, 0.05),
                animation: 'float 6s ease-in-out infinite',
                '@keyframes float': {
                  '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
                  '50%': { transform: 'translateY(-20px) rotate(180deg)' },
                },
              }} />
              <Box sx={{
                position: 'absolute',
                top: '60%',
                right: '15%',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                bgcolor: alpha(theme.palette.secondary.main, 0.05),
                animation: 'float 8s ease-in-out infinite 2s',
              }} />
              
              <Box sx={{
                p: 4,
                borderRadius: '50%',
                background: theme.palette.mode === 'dark'
                  ? `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.2)}, ${alpha(theme.palette.primary.main, 0.05)})`
                  : `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.primary.main, 0.02)})`,
                mb: 3,
                position: 'relative',
                boxShadow: theme.palette.mode === 'dark'
                  ? `0 0 40px ${alpha(theme.palette.primary.main, 0.3)}, inset 0 1px 0 ${alpha('#fff', 0.1)}`
                  : `0 0 40px ${alpha(theme.palette.primary.main, 0.15)}, inset 0 1px 0 ${alpha('#fff', 0.8)}`,
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: -4,
                  left: -4,
                  right: -4,
                  bottom: -4,
                  borderRadius: '50%',
                  background: `conic-gradient(from 0deg, ${alpha(theme.palette.primary.main, 0.4)}, transparent, ${alpha(theme.palette.secondary.main, 0.4)}, transparent, ${alpha(theme.palette.primary.main, 0.4)})`,
                  animation: 'spin 8s linear infinite',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' },
                  },
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  borderRadius: '50%',
                  background: theme.palette.mode === 'dark' 
                    ? `radial-gradient(circle, ${alpha(theme.palette.background.default, 0.95)}, ${alpha(theme.palette.background.default, 0.8)})`
                    : `radial-gradient(circle, ${alpha(theme.palette.background.paper, 0.98)}, ${alpha(theme.palette.background.paper, 0.9)})`,
                },
              }}>
                <BookOutlinedIcon sx={{ 
                  fontSize: 60, 
                  color: theme.palette.primary.main, 
                  position: 'relative',
                  zIndex: 1,
                }} />
              </Box>
              
              <Typography variant="h4" gutterBottom sx={{ 
                fontWeight: 800,
                fontSize: '2.5rem',
                background: theme.palette.mode === 'dark'
                  ? `linear-gradient(45deg, ${theme.palette.primary.light}, ${theme.palette.secondary.light})`
                  : `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2,
                letterSpacing: '-1px',
                textShadow: theme.palette.mode === 'dark' 
                  ? `0 0 30px ${alpha(theme.palette.primary.main, 0.5)}`
                  : 'none',
              }}>
                Ready to Analyze
              </Typography>
              
              <Typography variant="h6" color="textSecondary" sx={{ 
                maxWidth: 500, 
                mb: 4,
                lineHeight: 1.6,
                fontWeight: 400,
                fontSize: '1.1rem',
                opacity: 0.8,
              }}>
                Upload documents or select from your library to begin content analysis
              </Typography>
              
              <Box sx={{ 
                display: 'flex', 
                gap: 2.5, 
                flexWrap: 'wrap', 
                justifyContent: 'center',
                mt: 2,
              }}>
                <Chip 
                  icon={<PictureAsPdfIcon sx={{ fontSize: '1.1rem' }} />} 
                  label="PDF" 
                  variant="outlined" 
                  sx={{ 
                    borderRadius: 3,
                    px: 2,
                    py: 0.5,
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    borderWidth: 2,
                    borderColor: alpha(theme.palette.error.main, 0.4),
                    color: theme.palette.error.main,
                    background: alpha(theme.palette.error.main, 0.05),
                    backdropFilter: 'blur(10px)',
                    '&:hover': {
                      boxShadow: `0 8px 25px ${alpha(theme.palette.error.main, 0.3)}`,
                      transform: 'translateY(-3px) scale(1.05)',
                      borderColor: theme.palette.error.main,
                      background: alpha(theme.palette.error.main, 0.1),
                    },
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                />
                <Chip 
                  icon={<ArticleIcon sx={{ fontSize: '1.1rem' }} />} 
                  label="DOCX" 
                  variant="outlined" 
                  sx={{ 
                    borderRadius: 3,
                    px: 2,
                    py: 0.5,
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    borderWidth: 2,
                    borderColor: alpha(theme.palette.primary.main, 0.4),
                    color: theme.palette.primary.main,
                    background: alpha(theme.palette.primary.main, 0.05),
                    backdropFilter: 'blur(10px)',
                    '&:hover': {
                      boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.3)}`,
                      transform: 'translateY(-3px) scale(1.05)',
                      borderColor: theme.palette.primary.main,
                      background: alpha(theme.palette.primary.main, 0.1),
                    },
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                />
                <Chip 
                  icon={<TableChartIcon sx={{ fontSize: '1.1rem' }} />} 
                  label="CSV" 
                  variant="outlined" 
                  sx={{ 
                    borderRadius: 3,
                    px: 2,
                    py: 0.5,
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    borderWidth: 2,
                    borderColor: alpha(theme.palette.success.main, 0.4),
                    color: theme.palette.success.main,
                    background: alpha(theme.palette.success.main, 0.05),
                    backdropFilter: 'blur(10px)',
                    '&:hover': {
                      boxShadow: `0 8px 25px ${alpha(theme.palette.success.main, 0.3)}`,
                      transform: 'translateY(-3px) scale(1.05)',
                      borderColor: theme.palette.success.main,
                      background: alpha(theme.palette.success.main, 0.1),
                    },
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                />
              </Box>
            </Box>
          </Fade>
        )}
        
        {/* Active file display - Enhanced */}
        {activeFile && (
          <Fade in={!!activeFile}>
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* Header with file name - Enhanced */}
              <StyledPaper elevation={0} sx={{ 
                p: 3, 
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                borderRadius: 0,
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                background: theme.palette.mode === 'dark'
                  ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)}, ${alpha(theme.palette.primary.main, 0.05)})`
                  : `linear-gradient(135deg, ${theme.palette.background.paper}, ${alpha(theme.palette.primary.main, 0.03)})`,
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  {activeDocument ? (
                    <>
                      <Box sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      }}>
                        {getFileIcon(activeDocument.document_type, { 
                          fontSize: 'large',
                          color: 'primary'
                        })}
                      </Box>
                      <Box>
                        <Typography variant="h5" sx={{ 
                          fontWeight: 700,
                          mb: 0.5,
                          color: theme.palette.text.primary,
                        }}>
                          {activeDocument.name}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                          {activeDocument.file_size && (
                            <Chip 
                              label={`${(activeDocument.file_size / 1024).toFixed(1)} KB`}
                              size="small"
                              variant="outlined"
                              sx={{ 
                                borderRadius: 1.5,
                                fontSize: '0.75rem',
                                fontWeight: 500,
                              }}
                            />
                          )}
                          {activeDocument.document_type && (
                            <Chip 
                              label={activeDocument.document_type.toUpperCase()}
                              size="small"
                              color="primary"
                              sx={{ 
                                borderRadius: 1.5,
                                fontSize: '0.75rem',
                                fontWeight: 600,
                              }}
                            />
                          )}
                          <Chip 
                            label="Ready for Analysis"
                            size="small"
                            color="success"
                            variant="outlined"
                            sx={{ 
                              borderRadius: 1.5,
                              fontSize: '0.75rem',
                              fontWeight: 500,
                            }}
                          />
                        </Box>
                      </Box>
                    </>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <CircularProgress size={24} />
                      <Typography variant="h6">Loading document...</Typography>
                    </Box>
                  )}
                </Box>
                
                <Box>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Tooltip title={showAnalysisPanel ? "Hide Analysis Panel" : "Show Analysis Panel"}>
                      <IconButton
                        onClick={() => setShowAnalysisPanel(!showAnalysisPanel)}
                        sx={{
                          color: theme.palette.primary.main,
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.2),
                          },
                        }}
                      >
                        {showAnalysisPanel ? <KeyboardArrowRightIcon /> : <KeyboardArrowLeftIcon />}
                      </IconButton>
                    </Tooltip>
                    
                  </Box>
                </Box>
              </StyledPaper>
              
              {/* Document Content - Split Layout */}
              <Box 
                sx={{ 
                  flexGrow: 1, 
                  display: 'flex',
                  flexDirection: { xs: 'column', md: 'row' },
                  overflow: 'hidden',
                  background: theme.palette.mode === 'dark'
                    ? `radial-gradient(circle at top right, ${alpha(theme.palette.primary.main, 0.05)}, transparent 50%)`
                    : `radial-gradient(circle at top right, ${alpha(theme.palette.primary.main, 0.02)}, transparent 50%)`,
                }}
              >
                {/* Document Content */}
                <Box
                  className="document-content-container"
                  sx={{ 
                    flex: 1,
                    overflow: 'auto',
                    p: 4,
                    position: 'relative',
                    '&::-webkit-scrollbar': {
                      width: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                      background: alpha(theme.palette.divider, 0.1),
                      borderRadius: '10px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      background: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.6)}, ${alpha(theme.palette.primary.main, 0.3)})`,
                      borderRadius: '10px',
                      '&:hover': {
                        background: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.8)}, ${alpha(theme.palette.primary.main, 0.5)})`,
                      },
                    },
                  }}
                >
                  {loadingDocument ? (
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      justifyContent: 'center', 
                      alignItems: 'center', 
                      height: '100%',
                      gap: 3,
                    }}>
                      <CircularProgress size={48} thickness={4} />
                      <Typography variant="h6" sx={{ fontWeight: 500 }}>
                        Processing document content...
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        This may take a few moments for large files
                      </Typography>
                    </Box>
                  ) : activeDocument && documentContent && documentContent.length > 0 ? (
                    <StyledPaper elevation={1} sx={{ 
                      p: 4, 
                      borderRadius: 3,
                      background: theme.palette.mode === 'dark'
                        ? alpha(theme.palette.background.paper, 0.7)
                        : theme.palette.background.paper,
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      minHeight: '100%',
                      lineHeight: 1.8,
                    }}>
                      {(documentContent || []).map((line, index) => {
                        const lineText = line || '';
                        const currentAnnotations = getCurrentDocumentAnnotations();
                        
                        // Find annotations that affect this line
                        const lineAnnotations = currentAnnotations.filter(annotation => 
                          annotation.text_snapshot && lineText.includes(annotation.text_snapshot)
                        );
                        
                        const hasCodeAssignments = lineAnnotations.some(ann => ann.code_name || ann.assignment_type);
                        const hasComments = lineAnnotations.some(ann => ann.content && !ann.code_name);

                        return (
                          <Typography 
                            key={index} 
                            variant="body1" 
                            sx={{ 
                              mb: 2,
                              fontSize: '1rem',
                              lineHeight: 1.8,
                              color: theme.palette.text.primary,
                              position: 'relative',
                              // Enhanced highlighting for lines with annotations
                              ...(hasCodeAssignments && {
                                bgcolor: alpha(theme.palette.secondary.main, 0.06),
                                borderLeft: `4px solid ${theme.palette.secondary.main}`,
                                pl: 2,
                                borderRadius: 1,
                                boxShadow: `0 2px 8px ${alpha(theme.palette.secondary.main, 0.1)}`,
                              }),
                              ...(hasComments && !hasCodeAssignments && {
                                bgcolor: alpha(theme.palette.info.main, 0.06),
                                borderLeft: `4px solid ${theme.palette.info.main}`,
                                pl: 2,
                                borderRadius: 1,
                                boxShadow: `0 2px 8px ${alpha(theme.palette.info.main, 0.1)}`,
                              }),
                              '&:hover': {
                                bgcolor: hasCodeAssignments || hasComments 
                                  ? alpha(theme.palette.primary.main, 0.12)
                                  : alpha(theme.palette.primary.main, 0.05),
                                borderRadius: 1,
                                px: 1,
                                mx: -1,
                                transition: 'all 0.2s ease',
                                transform: hasCodeAssignments || hasComments ? 'translateX(2px)' : 'none',
                              },
                              cursor: 'text',
                              // Add annotation indicators
                              '&::after': (hasCodeAssignments || hasComments) ? {
                                content: hasCodeAssignments ? '"🏷️"' : '"💬"',
                                position: 'absolute',
                                right: 8,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                fontSize: '0.8rem',
                                opacity: 0.6,
                              } : {},
                            }}
                            dangerouslySetInnerHTML={{
                              __html: lineAnnotations.length > 0 
                                ? highlightTextInLine(lineText, lineAnnotations)
                                : lineText || '\u00A0'
                            }}
                          />
                        );
                      })}
                    </StyledPaper>
                  ) : (
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      justifyContent: 'center', 
                      alignItems: 'center', 
                      height: '100%',
                      textAlign: 'center',
                    }}>
                      <Box sx={{
                        p: 3,
                        borderRadius: '50%',
                        bgcolor: alpha(theme.palette.warning.main, 0.1),
                        mb: 3,
                      }}>
                        <ArticleIcon sx={{ fontSize: 48, color: theme.palette.warning.main }} />
                      </Box>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                        No content available
                      </Typography>
                      <Typography variant="body1" color="textSecondary">
                        This document appears to be empty or the content couldn't be processed.
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Comments and Code Assignments Panel */}
                {activeDocument && showAnalysisPanel && (
                  <Fade in={showAnalysisPanel}>
                    <Box
                      sx={{
                        width: { xs: '100%', md: showAnalysisPanel ? 400 : 0 },
                        borderLeft: { md: `1px solid ${alpha(theme.palette.divider, 0.1)}` },
                        borderTop: { xs: `1px solid ${alpha(theme.palette.divider, 0.1)}`, md: 'none' },
                        background: theme.palette.mode === 'dark'
                          ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)}, ${alpha(theme.palette.background.default, 0.6)})`
                          : `linear-gradient(135deg, ${theme.palette.background.paper}, ${alpha(theme.palette.primary.main, 0.01)})`,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        height: { xs: showAnalysisPanel ? '50vh' : 0, md: '100%' },
                        transition: 'all 0.3s ease',
                      }}
                    >
                    {/* Panel Header */}
                    <Box sx={{
                      p: 3,
                      borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      background: theme.palette.mode === 'dark'
                        ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.05)})`
                        : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.secondary.main, 0.02)})`,
                    }}>
                      <Typography variant="h6" sx={{ 
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mb: 1,
                      }}>
                        <Box sx={{
                          width: 4,
                          height: 24,
                          borderRadius: 2,
                          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                        }} />
                        Analysis Panel
                        <Box sx={{ 
                          ml: 'auto',
                          display: 'flex',
                          gap: 1,
                        }}>
                          <Chip 
                            label={`${(commentData || []).length} Comments`}
                            size="small"
                            color="info"
                            sx={{ fontSize: '0.7rem' }}
                          />
                          <Chip 
                            label={`${(codeAssignments || []).length} Codes`}
                            size="small"
                            color="secondary"
                            sx={{ fontSize: '0.7rem' }}
                          />
                        </Box>
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Comments and code assignments for this document
                      </Typography>
                    </Box>

                    {/* Panel Content */}
                    <Box sx={{
                      flex: 1,
                      overflow: 'auto',
                      p: 2,
                      '&::-webkit-scrollbar': {
                        width: '6px',
                      },
                      '&::-webkit-scrollbar-track': {
                        background: alpha(theme.palette.divider, 0.1),
                        borderRadius: '10px',
                      },
                      '&::-webkit-scrollbar-thumb': {
                        background: alpha(theme.palette.primary.main, 0.3),
                        borderRadius: '10px',
                        '&:hover': {
                          background: alpha(theme.palette.primary.main, 0.5),
                        },
                      },
                    }}>
                      {/* Comments Section */}
                      {commentData && commentData.length > 0 && (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="subtitle1" sx={{ 
                            fontWeight: 600,
                            mb: 2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            color: theme.palette.info.main,
                          }}>
                            <ChatBubbleOutlineIcon sx={{ fontSize: 18 }} />
                            Comments ({commentData.length})
                          </Typography>
                          
                          {commentData.map((comment, index) => (
                            <StyledPaper 
                              key={comment.id || index} 
                              elevation={1} 
                              sx={{ 
                                p: 2.5,
                                mb: 2,
                                borderRadius: 2,
                                border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                                background: theme.palette.mode === 'dark'
                                  ? `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)}, ${alpha(theme.palette.info.main, 0.05)})`
                                  : `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.05)}, ${alpha(theme.palette.info.main, 0.02)})`,
                                position: 'relative',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                  transform: 'translateY(-2px)',
                                  boxShadow: `0 8px 24px ${alpha(theme.palette.info.main, 0.2)}`,
                                  borderColor: theme.palette.info.main,
                                },
                                '&::before': {
                                  content: '""',
                                  position: 'absolute',
                                  left: 0,
                                  top: 0,
                                  bottom: 0,
                                  width: 3,
                                  background: theme.palette.info.main,
                                  borderTopLeftRadius: 2,
                                  borderBottomLeftRadius: 2,
                                },
                              }}
                              onClick={() => scrollToAnnotation(comment)}
                            >
                              {/* Selected Text */}
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  fontStyle: 'italic',
                                  color: theme.palette.info.dark,
                                  mb: 1.5,
                                  p: 1,
                                  borderRadius: 1,
                                  bgcolor: alpha(theme.palette.info.main, 0.08),
                                  fontSize: '0.85rem',
                                  lineHeight: 1.4,
                                  border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                                }}
                              >
                                "{comment.text_snapshot}"
                              </Typography>
                              
                              {/* Comment Content */}
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  mb: 1,
                                  fontSize: '0.9rem',
                                  lineHeight: 1.5,
                                  color: theme.palette.text.primary,
                                }}
                              >
                                {comment.content}
                              </Typography>
                              
                              {/* Metadata */}
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  color: theme.palette.text.secondary,
                                  fontSize: '0.75rem',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  mt: 1,
                                }}
                              >
                                <span>{comment.created_by_email || 'Unknown'}</span>
                                <span>{comment.created_at ? new Date(comment.created_at).toLocaleDateString() : ''}</span>
                              </Typography>
                            </StyledPaper>
                          ))}
                        </Box>
                      )}

                      {/* Code Assignments Section */}
                      {codeAssignments && codeAssignments.length > 0 && (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="subtitle1" sx={{ 
                            fontWeight: 600,
                            mb: 2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            color: theme.palette.secondary.main,
                          }}>
                            <LocalOfferIcon sx={{ fontSize: 18 }} />
                            Code Assignments ({codeAssignments.length})
                          </Typography>
                          
                          {codeAssignments.map((assignment, index) => (
                            <StyledPaper 
                              key={assignment.id || index} 
                              elevation={1} 
                              sx={{ 
                                p: 2.5,
                                mb: 2,
                                borderRadius: 2,
                                border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                                background: theme.palette.mode === 'dark'
                                  ? `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.05)})`
                                  : `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.05)}, ${alpha(theme.palette.secondary.main, 0.02)})`,
                                position: 'relative',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                  transform: 'translateY(-2px)',
                                  boxShadow: `0 8px 24px ${alpha(theme.palette.secondary.main, 0.2)}`,
                                  borderColor: theme.palette.secondary.main,
                                },
                                '&::before': {
                                  content: '""',
                                  position: 'absolute',
                                  left: 0,
                                  top: 0,
                                  bottom: 0,
                                  width: 3,
                                  background: theme.palette.secondary.main,
                                  borderTopLeftRadius: 2,
                                  borderBottomLeftRadius: 2,
                                },
                              }}
                              onClick={() => scrollToAnnotation(assignment)}
                            >
                              {/* Code Name */}
                              <Box sx={{ mb: 1.5 }}>
                                <Chip 
                                  label={assignment.code_name || 'Unknown Code'}
                                  size="small"
                                  sx={{
                                    bgcolor: theme.palette.secondary.main,
                                    color: theme.palette.secondary.contrastText,
                                    fontWeight: 600,
                                    fontSize: '0.75rem',
                                  }}
                                />
                              </Box>
                              
                              {/* Selected Text */}
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  fontStyle: 'italic',
                                  color: theme.palette.secondary.dark,
                                  mb: 1.5,
                                  p: 1,
                                  borderRadius: 1,
                                  bgcolor: alpha(theme.palette.secondary.main, 0.08),
                                  fontSize: '0.85rem',
                                  lineHeight: 1.4,
                                  border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                                }}
                              >
                                "{assignment.text_snapshot}"
                              </Typography>
                              
                              {/* Confidence */}
                              {assignment.confidence && (
                                <Box sx={{ mb: 1 }}>
                                  <Typography 
                                    variant="caption" 
                                    sx={{ 
                                      color: theme.palette.text.secondary,
                                      fontSize: '0.75rem',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 1,
                                    }}
                                  >
                                    Confidence: {Math.round(assignment.confidence * 100)}%
                                  </Typography>
                                </Box>
                              )}
                              
                              {/* Metadata */}
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  color: theme.palette.text.secondary,
                                  fontSize: '0.75rem',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  mt: 1,
                                }}
                              >
                                <span>{assignment.created_by_email || 'System'}</span>
                                <span>{assignment.created_at ? new Date(assignment.created_at).toLocaleDateString() : ''}</span>
                              </Typography>
                            </StyledPaper>
                          ))}
                        </Box>
                      )}

                      {/* Empty State */}
                      {(!commentData || commentData.length === 0) && (!codeAssignments || codeAssignments.length === 0) && (
                        <Box sx={{ 
                          display: 'flex', 
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: '100%',
                          textAlign: 'center',
                          p: 4,
                        }}>
                          <Box sx={{
                            p: 3,
                            borderRadius: '50%',
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            mb: 3,
                          }}>
                            <CommentOutlinedIcon sx={{ fontSize: 48, color: theme.palette.primary.main }} />
                          </Box>
                          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                            No Analysis Yet
                          </Typography>
                          <Typography variant="body2" color="textSecondary" sx={{ maxWidth: 250 }}>
                            Select text in the document to add comments or assign codes
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                  </Fade>
                )}
              </Box>
            </Box>
          </Fade>
        )}
      </Box>
      
      {/* Floating toolbar for text selection */}
      <FloatingSelectionToolbar />
      
      {/* Comment Modal - Enhanced */}
      <Dialog 
        open={commentModalOpen} 
        onClose={() => setCommentModalOpen(false)} 
        maxWidth="md" 
        fullWidth
        PaperComponent={StyledPaper}
        PaperProps={{
          sx: {
            borderRadius: theme.shape.borderRadius * 2,
            background: theme.palette.mode === 'dark'
              ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)}, ${alpha(theme.palette.primary.main, 0.05)})`
              : `linear-gradient(135deg, ${theme.palette.background.paper}, ${alpha(theme.palette.primary.main, 0.02)})`,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 2,
          background: theme.palette.mode === 'dark'
            ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, transparent)`
            : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)}, transparent)`,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            }}>
              <CommentOutlinedIcon color="primary" />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Add Comment
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ py: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            Selected Text:
          </Typography>
          <StyledPaper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              background: theme.palette.mode === 'dark'
                ? `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)}, ${alpha(theme.palette.warning.main, 0.05)})`
                : `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.08)}, ${alpha(theme.palette.warning.main, 0.03)})`,
              border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
              borderRadius: theme.shape.borderRadius * 1.5,
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: '4px',
                borderTopLeftRadius: theme.shape.borderRadius * 1.5,
                borderBottomLeftRadius: theme.shape.borderRadius * 1.5,
                background: `linear-gradient(180deg, ${theme.palette.warning.main}, ${theme.palette.warning.light})`,
              }
            }}
          >
            <Typography 
              sx={{ 
                fontStyle: 'italic',
                fontSize: '1rem',
                lineHeight: 1.6,
                color: theme.palette.mode === 'dark' 
                  ? theme.palette.warning.light 
                  : theme.palette.warning.dark,
                pl: 2,
              }}
            >
              "{selection?.text}"
            </Typography>
          </StyledPaper>
          
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            Your Comment:
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            id="comment"
            fullWidth
            multiline
            rows={5}
            variant="outlined"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts, insights, or analysis about this text selection..."
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: theme.shape.borderRadius * 1.5,
                transition: 'all 0.3s ease',
                backgroundColor: alpha(theme.palette.background.default, 0.5),
                '&:hover': {
                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
                },
                '&.Mui-focused': {
                  boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.25)}`,
                  backgroundColor: alpha(theme.palette.background.paper, 0.8),
                },
              },
              '& .MuiOutlinedInput-input': {
                fontSize: '1rem',
                lineHeight: 1.6,
              },
            }}
          />
        </DialogContent>
        
        <DialogActions sx={{ 
          p: 3, 
          pt: 1,
          gap: 2,
          background: theme.palette.mode === 'dark'
            ? `linear-gradient(135deg, transparent, ${alpha(theme.palette.background.default, 0.3)})`
            : `linear-gradient(135deg, transparent, ${alpha(theme.palette.primary.main, 0.02)})`,
        }}>
          <Button 
            onClick={() => setCommentModalOpen(false)}
            variant="outlined"
            sx={{
              borderRadius: theme.shape.borderRadius * 1.5,
              px: 3,
              py: 1,
              fontWeight: 600,
              textTransform: 'none',
            }}
          >
            Cancel
          </Button>
          <EnhancedButton 
            onClick={handleSaveComment} 
            variant="contained" 
            color="primary"
            disabled={!newComment.trim()}
            startIcon={<SaveIcon />}
            sx={{
              px: 3,
              py: 1,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
            }}
          >
            Save Comment
          </EnhancedButton>
        </DialogActions>
      </Dialog>
      
      {/* Enhanced Snackbars */}
      <Snackbar 
        open={fileError ? true : false}
        autoHideDuration={6000} 
        onClose={() => setFileError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        TransitionComponent={Zoom}
      >
        <Alert 
          onClose={() => setFileError(null)} 
          severity="error" 
          variant="filled"
          sx={{ 
            width: '100%',
            borderRadius: theme.shape.borderRadius * 1.5,
            fontWeight: 600,
            '& .MuiAlert-icon': {
              fontSize: '1.5rem'
            },
            boxShadow: `0 8px 32px ${alpha(theme.palette.error.main, 0.3)}`,
          }}
        >
          {fileError}
        </Alert>
      </Snackbar>
      
      <Snackbar 
        open={uploadSuccess}
        autoHideDuration={4000} 
        onClose={() => setUploadSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        TransitionComponent={Zoom}
      >
        <Alert 
          onClose={() => setUploadSuccess(false)} 
          severity="success" 
          variant="filled"
          sx={{ 
            width: '100%',
            borderRadius: theme.shape.borderRadius * 1.5,
            fontWeight: 600,
            '& .MuiAlert-icon': {
              fontSize: '1.5rem'
            },
            boxShadow: `0 8px 32px ${alpha(theme.palette.success.main, 0.3)}`,
          }}
        >
          🎉 Files uploaded successfully!
        </Alert>
      </Snackbar>
      
      <Snackbar 
        open={snackbarOpen}
        autoHideDuration={5000} 
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        TransitionComponent={Zoom}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarMessage.includes('Failed') ? 'error' : 'success'} 
          variant="filled"
          sx={{ 
            width: '100%',
            borderRadius: theme.shape.borderRadius * 1.5,
            fontWeight: 600,
            '& .MuiAlert-icon': {
              fontSize: '1.5rem'
            },
            boxShadow: snackbarMessage.includes('Failed')
              ? `0 8px 32px ${alpha(theme.palette.error.main, 0.3)}`
              : `0 8px 32px ${alpha(theme.palette.success.main, 0.3)}`,
          }}
        >
          {snackbarMessage.includes('Failed') ? snackbarMessage : `✅ ${snackbarMessage}`}
        </Alert>
      </Snackbar>
      
    </Box>
  );
}

export default Documents;