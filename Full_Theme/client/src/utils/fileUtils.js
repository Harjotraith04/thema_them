import React from 'react';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableChartIcon from '@mui/icons-material/TableChart';
import ArticleIcon from '@mui/icons-material/Article';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

export const getFileIcon = (fileType, iconProps = {}) => {
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