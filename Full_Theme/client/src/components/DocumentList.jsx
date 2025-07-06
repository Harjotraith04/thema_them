import React from 'react';
import {
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  IconButton,
  useTheme,
  alpha,
  styled,
  Typography,
  Box
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { getFileIcon } from '../utils/fileUtils';

const DocumentCard = styled(ListItemButton)(({ theme, selected }) => ({
    marginBottom: theme.spacing(1),
    borderRadius: theme.shape.borderRadius,
    transition: 'all 0.2s ease-in-out',
    borderLeft: `3px solid ${selected ? theme.palette.primary.main : 'transparent'}`,
    backgroundColor: selected ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
    '&:hover': {
      backgroundColor: alpha(theme.palette.primary.main, 0.2),
      borderLeft: `3px solid ${theme.palette.primary.main}`
    },
  }));

const DocumentList = ({ documents, activeDocument, onDocumentSelect, onDocumentDelete }) => {
  const theme = useTheme();

  if (documents.length === 0) {
    return (
        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{mt: 4}}>
            No documents uploaded yet.
        </Typography>
    )
  }

  return (
    <List disablePadding>
      {documents.map((doc) => (
        <DocumentCard
          key={doc.id}
          selected={activeDocument?.id === doc.id}
          onClick={() => onDocumentSelect(doc)}
        >
          <ListItemIcon sx={{minWidth: 40}}>
            {getFileIcon(doc.document_type, { sx: { color: theme.palette.primary.main } })}
          </ListItemIcon>
          <ListItemText 
            primary={doc.name} 
            primaryTypographyProps={{ 
                noWrap: true, 
                style: { fontWeight: 500 }
            }} 
          />
          <IconButton 
            edge="end" 
            aria-label="delete" 
            onClick={(e) => { 
                e.stopPropagation(); 
                onDocumentDelete(doc.id); 
            }}
            size="small"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </DocumentCard>
      ))}
    </List>
  );
};

export default DocumentList;