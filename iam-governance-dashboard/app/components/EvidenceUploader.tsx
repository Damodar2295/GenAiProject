'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Modal, 
  Box, 
  Typography, 
  Button, 
  IconButton,
  Paper,
  Divider,
  CircularProgress,
  Alert,
  TextField,
  alpha
} from '@mui/material';
import { 
  Upload, 
  X, 
  FileText, 
  Image as ImageIcon, 
  File, 
  CheckCircle, 
  AlertCircle,
  MessageSquareText,
  PieChart,
  Info
} from 'lucide-react';
import { useServiceAccountStore } from '../store/useServiceAccountStore';

interface EvidenceUploaderProps {
  open: boolean;
  onClose: () => void;
  violationType: 'Password Construction' | 'Password Rotation' | string;
  violationSeverity: 'critical' | 'high' | 'medium' | 'low';
  accountName: string;
  accountId: string;
}

// Mock demo image data
const DEMO_IMAGE_DATA = {
  name: 'password_compliance_evidence.png',
  size: 245000,
  type: 'image/png',
  lastModified: Date.now()
};

export default function EvidenceUploader({
  open,
  onClose,
  violationType,
  violationSeverity,
  accountName,
  accountId
}: EvidenceUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [validationStatus, setValidationStatus] = useState<null | 'validating' | 'success' | 'failed'>(null);
  const [validationMessage, setValidationMessage] = useState('');
  const [feedback, setFeedback] = useState('');
  const [useDemoImage, setUseDemoImage] = useState(false);
  
  const { markViolationResolved, isViolationResolved } = useServiceAccountStore();
  
  // Clear state when dialog closes
  useEffect(() => {
    if (!open) {
      // Reset state when modal is closed
      setFiles([]);
      setDragActive(false);
      setUploading(false);
      setValidationStatus(null);
      setValidationMessage('');
      setFeedback('');
      setUseDemoImage(false);
    }
  }, [open]);
  
  // Check if this violation is already resolved in the store when dialog opens
  useEffect(() => {
    if (open) {
      const alreadyResolved = isViolationResolved(
        accountId,
        violationType as 'Password Construction' | 'Password Rotation'
      );
      
      if (alreadyResolved) {
        // If already resolved, show success state with metrics
        setValidationStatus('success');
        setValidationMessage(
          violationType === 'Password Construction' 
            ? 'Previously validated evidence confirms password meets all complexity requirements.'
            : 'Previously validated evidence confirms password was rotated within compliance window.'
        );
      }
    }
  }, [open, accountId, violationType, isViolationResolved]);

  // Allowed file types
  const allowedTypes = [
    'image/jpeg', 
    'image/png', 
    'image/gif', 
    'application/pdf', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      const validFiles = selectedFiles.filter(file => allowedTypes.includes(file.type));
      setFiles(prev => [...prev, ...validFiles]);
      setUseDemoImage(false);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      const validFiles = droppedFiles.filter(file => allowedTypes.includes(file.type));
      setFiles(prev => [...prev, ...validFiles]);
      setUseDemoImage(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <ImageIcon size={20} />;
    } else if (fileType.includes('pdf')) {
      return <FileText size={20} />;
    } else if (fileType.includes('word')) {
      return <File size={20} />;
    }
    return <File size={20} />;
  };

  const getFileTypeLabel = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return fileType.replace('image/', '').toUpperCase();
    } else if (fileType.includes('pdf')) {
      return 'PDF';
    } else if (fileType.includes('word')) {
      return 'DOC';
    }
    return 'FILE';
  };

  const resetUploader = () => {
    setFiles([]);
    setValidationStatus(null);
    setValidationMessage('');
    setFeedback('');
    setUseDemoImage(false);
  };

  const handleUseDemoImage = () => {
    setFiles([]);
    setUseDemoImage(true);
    console.log('Demo image selected:', true);
  };

  const simulateAIValidation = () => {
    setUploading(true);
    setValidationStatus('validating');
    console.log('Starting validation, useDemoImage:', useDemoImage);
    
    // Simulated AI validation - wait a bit longer to simulate analysis
    setTimeout(() => {
      setUploading(false);
      
      // If using demo image, always validate successfully
      if (useDemoImage) {
        setValidationStatus('success');
        const message = violationType === 'Password Construction' 
          ? 'Evidence verification complete. Screenshot confirms password meets all complexity requirements with 20+ characters and all required character types.'
          : 'Evidence verification complete. Screenshot confirms password was rotated within the compliance window with proper documentation.';
        setValidationMessage(message);
        
        // Mark the violation as resolved in the store
        markViolationResolved({
          accountId,
          violationType: violationType as 'Password Construction' | 'Password Rotation',
          resolvedAt: new Date(),
          evidence: `Uploaded evidence: ${DEMO_IMAGE_DATA.name}`
        });
        
        return;
      }
      
      // For regular uploads, perform "analysis" based on file type
      // This is a mock of what real AI analysis would do
      let analysisResult: {
        isCompliant: boolean;
        message: string;
        failureReason?: string;
        recommendation?: string;
        details: {
          passwordLength?: number | null;
          hasUppercase?: boolean;
          hasLowercase?: boolean;
          hasNumbers?: boolean;
          hasSpecial?: boolean;
          rotationDate?: string | null;
          isRotationTimely?: boolean;
          isDocumentationComplete?: boolean;
        }
      } = {
        isCompliant: false,
        message: '',
        details: {}
      };
      
      // Different validation logic based on file type
      const fileTypes = files.map(f => f.type);
      const fileNames = files.map(f => f.name.toLowerCase());
      
      if (violationType === 'Password Construction') {
        // Check for specific content in filenames that might indicate compliance
        const hasPasswordStrengthIndicator = fileNames.some(name => 
          name.includes('password') || 
          name.includes('strong') || 
          name.includes('secure') ||
          name.includes('complex')
        );
        
        const isImageFile = fileTypes.some(type => type.startsWith('image/'));
        const isPDFFile = fileTypes.some(type => type.includes('pdf'));
        
        // Images are harder to validate without AI, more likely to fail
        // PDFs with password-related names are more likely to be valid documentation
        analysisResult = {
          isCompliant: isPDFFile && hasPasswordStrengthIndicator,
          message: isPDFFile && hasPasswordStrengthIndicator 
            ? 'Password documentation appears to show compliance with requirements.'
            : 'Unable to verify password requirements from the uploaded evidence.',
          failureReason: !isPDFFile 
            ? 'Image-only evidence is insufficient for password validation'
            : !hasPasswordStrengthIndicator 
              ? 'Documentation does not clearly show password information'
              : 'Unable to verify all password requirements',
          recommendation: !isPDFFile 
            ? 'Please upload a PDF document showing password policy compliance'
            : 'Upload documentation that clearly shows the password with all required character types',
          details: {
            passwordLength: isPDFFile && hasPasswordStrengthIndicator ? 20 : 12,
            hasUppercase: isPDFFile && hasPasswordStrengthIndicator,
            hasLowercase: true,
            hasNumbers: isPDFFile && hasPasswordStrengthIndicator,
            hasSpecial: isPDFFile && hasPasswordStrengthIndicator
          }
        };
      } else { // Password Rotation
        // Check for rotation indicators in filenames
        const hasRotationIndicator = fileNames.some(name => 
          name.includes('rotation') || 
          name.includes('change') || 
          name.includes('update') ||
          name.includes('date')
        );
        
        const isPDFFile = fileTypes.some(type => type.includes('pdf'));
        const isDocFile = fileTypes.some(type => 
          type.includes('word') || 
          type.includes('document')
        );
        
        // Documents with rotation-related names are more likely to be valid
        analysisResult = {
          isCompliant: (isPDFFile || isDocFile) && hasRotationIndicator,
          message: (isPDFFile || isDocFile) && hasRotationIndicator 
            ? 'Password rotation documentation appears to confirm timely rotation.'
            : 'Unable to verify password rotation timeline from the uploaded evidence.',
          failureReason: !(isPDFFile || isDocFile)
            ? 'Image-only evidence is insufficient for rotation validation'
            : !hasRotationIndicator
              ? 'Documentation does not clearly show rotation information'
              : 'Unable to verify rotation timeline',
          recommendation: !(isPDFFile || isDocFile)
            ? 'Please upload a PDF or document file showing rotation evidence'
            : 'Upload documentation that clearly shows the rotation date and history',
          details: {
            rotationDate: (isPDFFile || isDocFile) && hasRotationIndicator 
              ? new Date().toLocaleDateString() 
              : null,
            isRotationTimely: (isPDFFile || isDocFile) && hasRotationIndicator,
            isDocumentationComplete: (isPDFFile || isDocFile) && hasRotationIndicator
          }
        };
      }
      
      if (analysisResult.isCompliant) {
        setValidationStatus('success');
        setValidationMessage(analysisResult.message);
        
        // Mark the violation as resolved in the store
        markViolationResolved({
          accountId,
          violationType: violationType as 'Password Construction' | 'Password Rotation',
          resolvedAt: new Date(),
          evidence: `Uploaded ${files.length} file(s): ${files.map(f => f.name).join(', ')}`
        });
      } else {
        setValidationStatus('failed');
        setValidationMessage(analysisResult.message);
      }
    }, 4000); // Longer validation time for more realistic analysis simulation
  };

  const handleSubmit = () => {
    // Allow submission even without files if using demo image
    if (files.length > 0 || useDemoImage) {
      console.log('Submitting with files:', files.length, 'useDemoImage:', useDemoImage);
      simulateAIValidation();
    } else {
      console.log('Submit button clicked but conditions not met:', 
        'files:', files.length, 
        'useDemoImage:', useDemoImage
      );
    }
  };

  return (
    <Modal 
      open={open} 
      onClose={validationStatus ? undefined : onClose}
      aria-labelledby="evidence-uploader-title"
    >
      <Paper sx={{ 
        position: 'absolute', 
        top: '50%', 
        left: '50%', 
        transform: 'translate(-50%, -50%)', 
        width: { xs: '90%', sm: '80%', md: '600px' },
        maxHeight: '90vh',
        overflowY: 'auto',
        p: 3,
        outline: 'none',
        borderRadius: '12px'
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography id="evidence-uploader-title" variant="h6" component="h2">
            Upload Compliance Evidence
          </Typography>
          <IconButton onClick={onClose} size="small">
            <X size={18} />
          </IconButton>
        </Box>
        
        <Divider sx={{ mb: 2 }} />
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Account: {accountName} ({accountId})
          </Typography>
          <Typography variant="subtitle2" color="text.secondary">
            Violation Type: {violationType}
          </Typography>
        </Box>
        
        {validationStatus === null && (
          <>
            <Box 
              sx={{ 
                border: '2px dashed',
                borderColor: dragActive ? 'primary.main' : 'divider',
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                backgroundColor: dragActive ? alpha('#000', 0.02) : 'transparent',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                mb: 2
              }}
              onClick={handleBrowseClick}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx"
              />
              <Upload size={32} color="#666" />
              <Typography variant="body1" sx={{ mt: 1, mb: 0.5 }}>
                Drag and drop files here, or click to browse
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Supported formats: JPG, PNG, GIF, PDF, DOC, DOCX
              </Typography>
            </Box>
            
            {/* Upload Recommendations */}
            <Box sx={{ mb: 3, p: 2, bgcolor: alpha('#2196f3', 0.05), borderRadius: 2, border: '1px solid', borderColor: 'info.light' }}>
              <Typography variant="subtitle2" color="info.main" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Info size={16} /> Recommended Evidence to Upload:
              </Typography>
              
              {violationType === 'Password Construction' ? (
                <Box component="ul" sx={{ m: 0, pl: 3 }}>
                  <Typography component="li" variant="body2">PDF documentation showing password policy compliance</Typography>
                  <Typography component="li" variant="body2">Screenshots from a password manager showing complexity</Typography>
                  <Typography component="li" variant="body2">Password validation report (PDF preferred)</Typography>
                </Box>
              ) : (
                <Box component="ul" sx={{ m: 0, pl: 3 }}>
                  <Typography component="li" variant="body2">PDF showing password rotation timestamp</Typography>
                  <Typography component="li" variant="body2">Documentation with rotation history and dates</Typography>
                  <Typography component="li" variant="body2">System-generated rotation audit logs (PDF preferred)</Typography>
                </Box>
              )}
              
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                PDF files with clear documentation will have higher validation success rates than images.
              </Typography>
            </Box>
            
            {/* Demo Image Option */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              mb: 3,
              mt: 1,
              gap: 2,
              p: 2,
              border: '1px dashed',
              borderColor: 'divider',
              borderRadius: 2,
              bgcolor: alpha('#000', 0.01)
            }}>
              <Typography variant="subtitle2" color="text.primary">
                Quick Demo Option
              </Typography>
              
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 1 }}>
                Don't have evidence files handy? Use our demo image for testing.
              </Typography>
              
              <Button
                variant={useDemoImage ? "contained" : "outlined"}
                color={useDemoImage ? "success" : "primary"}
                size="medium"
                startIcon={useDemoImage ? <CheckCircle size={16} /> : <PieChart size={16} />}
                onClick={handleUseDemoImage}
                sx={{ 
                  fontWeight: useDemoImage ? 'bold' : 'normal',
                  minWidth: '180px'
                }}
              >
                {useDemoImage ? "Demo Image Selected" : "Use Demo Image"}
              </Button>
              
              {useDemoImage && (
                <Alert severity="success" sx={{ width: '100%', mt: 1, fontSize: '0.85rem' }}>
                  Demo image selected. Click "Upload & Validate" to continue.
                </Alert>
              )}
            </Box>
            
            {useDemoImage && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Demo Image Details
                </Typography>
                <Box sx={{ 
                  border: '1px solid',
                  borderColor: 'success.light',
                  backgroundColor: alpha('#2e7d32', 0.05),
                  borderRadius: 1,
                  p: 1
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ImageIcon size={20} color="#2e7d32" />
                    <Box>
                      <Typography variant="body2">
                        {DEMO_IMAGE_DATA.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {(DEMO_IMAGE_DATA.size / 1024).toFixed(1)} KB • PNG
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ 
                    mt: 1, 
                    pt: 1, 
                    borderTop: '1px dashed', 
                    borderColor: 'divider',
                    textAlign: 'center'
                  }}>
                    <Alert severity="info" sx={{ fontSize: '0.75rem' }}>
                      This demo image will automatically pass validation
                    </Alert>
                  </Box>
                </Box>
              </Box>
            )}
          
            {files.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Selected Files ({files.length})
                </Typography>
                <Box sx={{ 
                  maxHeight: '150px', 
                  overflowY: 'auto', 
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                }}>
                  {files.map((file, index) => (
                    <Box 
                      key={index} 
                      sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        p: 1,
                        borderBottom: index !== files.length - 1 ? '1px solid' : 'none',
                        borderColor: 'divider',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getFileIcon(file.type)}
                        <Box>
                          <Typography variant="body2" noWrap sx={{ maxWidth: '300px' }}>
                            {file.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {(file.size / 1024).toFixed(1)} KB • {getFileTypeLabel(file.type)}
                          </Typography>
                        </Box>
                      </Box>
                      <IconButton 
                        size="small" 
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(index);
                        }}
                      >
                        <X size={16} />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button 
                variant="outlined" 
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button 
                variant="contained" 
                onClick={handleSubmit}
                disabled={files.length === 0 && !useDemoImage}
                startIcon={<Upload size={16} />}
                sx={{
                  bgcolor: (files.length === 0 && !useDemoImage) ? 'action.disabledBackground' : 'primary.main',
                  ':hover': {
                    bgcolor: (files.length === 0 && !useDemoImage) ? 'action.disabledBackground' : 'primary.dark',
                  },
                  boxShadow: (files.length === 0 && !useDemoImage) ? 'none' : 2
                }}
              >
                Upload & Validate
              </Button>
            </Box>
          </>
        )}
        
        {validationStatus === 'validating' && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress size={48} />
            <Typography variant="h6" sx={{ mt: 2 }}>
              Validating Evidence
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              AI is analyzing your uploaded evidence...
            </Typography>
            <Box sx={{ mt: 3, p: 2, bgcolor: alpha('#000', 0.03), borderRadius: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {violationType === 'Password Construction' 
                  ? 'Looking for evidence of password complexity, character types, and length...'
                  : 'Scanning for rotation dates, documentation completeness, and timely updates...'}
              </Typography>
            </Box>
          </Box>
        )}
        
        {validationStatus === 'success' && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <CheckCircle size={48} color="#2e7d32" />
            <Typography variant="h6" sx={{ mt: 2, color: 'success.main' }}>
              Compliance Validated
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, mb: 3 }}>
              {validationMessage}
            </Typography>
            
            {/* Validation Metrics Table for Success */}
            <Box sx={{ mb: 3, mt: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, textAlign: 'left' }}>
                Evidence Validation Metrics:
              </Typography>
              <Box sx={{ 
                border: '1px solid', 
                borderColor: 'divider', 
                borderRadius: 1, 
                overflow: 'hidden'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: alpha('#2e7d32', 0.1) }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,0.12)' }}>
                        Check Item
                      </th>
                      <th style={{ padding: '8px 12px', textAlign: 'center', borderBottom: '1px solid rgba(0,0,0,0.12)' }}>
                        Status
                      </th>
                      <th style={{ padding: '8px 12px', textAlign: 'center', borderBottom: '1px solid rgba(0,0,0,0.12)' }}>
                        Compliance
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {violationType === 'Password Construction' ? (
                      <>
                        <tr>
                          <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(0,0,0,0.12)' }}>
                            Password Length (≥16 characters)
                          </td>
                          <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(0,0,0,0.12)', textAlign: 'center' }}>
                            <CheckCircle size={16} color="#2e7d32" />
                          </td>
                          <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(0,0,0,0.12)', textAlign: 'center' }}>
                            {useDemoImage ? '24 characters' : '20+ characters'}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(0,0,0,0.12)' }}>
                            Uppercase Characters
                          </td>
                          <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(0,0,0,0.12)', textAlign: 'center' }}>
                            <CheckCircle size={16} color="#2e7d32" />
                          </td>
                          <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(0,0,0,0.12)', textAlign: 'center' }}>
                            Present (✓)
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(0,0,0,0.12)' }}>
                            Lowercase Characters
                          </td>
                          <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(0,0,0,0.12)', textAlign: 'center' }}>
                            <CheckCircle size={16} color="#2e7d32" />
                          </td>
                          <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(0,0,0,0.12)', textAlign: 'center' }}>
                            Present (✓)
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(0,0,0,0.12)' }}>
                            Numeric Characters
                          </td>
                          <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(0,0,0,0.12)', textAlign: 'center' }}>
                            <CheckCircle size={16} color="#2e7d32" />
                          </td>
                          <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(0,0,0,0.12)', textAlign: 'center' }}>
                            Present (✓)
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(0,0,0,0.12)' }}>
                            Special Characters
                          </td>
                          <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(0,0,0,0.12)', textAlign: 'center' }}>
                            <CheckCircle size={16} color="#2e7d32" />
                          </td>
                          <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(0,0,0,0.12)', textAlign: 'center' }}>
                            Present (✓)
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: '8px 12px' }}>
                            Password not previously used
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                            <CheckCircle size={16} color="#2e7d32" />
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                            Verified (✓)
                          </td>
                        </tr>
                      </>
                    ) : (
                      <>
                        <tr>
                          <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(0,0,0,0.12)' }}>
                            Password Rotation Date
                          </td>
                          <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(0,0,0,0.12)', textAlign: 'center' }}>
                            <CheckCircle size={16} color="#2e7d32" />
                          </td>
                          <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(0,0,0,0.12)', textAlign: 'center' }}>
                            {new Date().toLocaleDateString()}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(0,0,0,0.12)' }}>
                            Rotation within deadline
                          </td>
                          <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(0,0,0,0.12)', textAlign: 'center' }}>
                            <CheckCircle size={16} color="#2e7d32" />
                          </td>
                          <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(0,0,0,0.12)', textAlign: 'center' }}>
                            Compliant (✓)
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(0,0,0,0.12)' }}>
                            Documentation Provided
                          </td>
                          <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(0,0,0,0.12)', textAlign: 'center' }}>
                            <CheckCircle size={16} color="#2e7d32" />
                          </td>
                          <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(0,0,0,0.12)', textAlign: 'center' }}>
                            Complete (✓)
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: '8px 12px' }}>
                            Rotation Process Followed
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                            <CheckCircle size={16} color="#2e7d32" />
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                            Verified (✓)
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </Box>
            </Box>
            
            <Box sx={{ background: alpha('#2e7d32', 0.1), p: 2, borderRadius: 2, mb: 3 }}>
              <Typography variant="subtitle2" color="success.main">
                Next Steps:
              </Typography>
              <Typography variant="body2">
                Your evidence has been accepted. No further action is required at this time.
              </Typography>
            </Box>
            
            <Button 
              variant="contained" 
              color="primary" 
              onClick={onClose}
              fullWidth
            >
              Close
            </Button>
          </Box>
        )}
        
        {validationStatus === 'failed' && (
          <Box sx={{ py: 3 }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <AlertCircle size={48} color="#d32f2f" />
              <Typography variant="h6" sx={{ mt: 2, color: 'error.main' }}>
                Compliance Validation Failed
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                {validationMessage}
              </Typography>
            </Box>
            
            {/* Validation Metrics Table for Failure */}
            <Box sx={{ mb: 3, mt: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, textAlign: 'left' }}>
                Evidence Validation Issues:
              </Typography>
              <Box sx={{ 
                border: '1px solid', 
                borderColor: 'divider', 
                borderRadius: 1, 
                overflow: 'hidden'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: alpha('#d32f2f', 0.1) }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,0.12)' }}>
                        Check Item
                      </th>
                      <th style={{ padding: '8px 12px', textAlign: 'center', borderBottom: '1px solid rgba(0,0,0,0.12)' }}>
                        Status
                      </th>
                      <th style={{ padding: '8px 12px', textAlign: 'center', borderBottom: '1px solid rgba(0,0,0,0.12)' }}>
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {violationType === 'Password Construction' ? (
                      <>
                        <tr>
                          <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(0,0,0,0.12)' }}>
                            Password Length (≥16 characters)
                          </td>
                          <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(0,0,0,0.12)', textAlign: 'center' }}>
                            <X size={16} color="#d32f2f" />
                          </td>
                          <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(0,0,0,0.12)', textAlign: 'center' }}>
                            Insufficient evidence of length
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(0,0,0,0.12)' }}>
                            Uppercase Characters
                          </td>
                          <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(0,0,0,0.12)', textAlign: 'center' }}>
                            <CheckCircle size={16} color="#2e7d32" />
                          </td>
                          <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(0,0,0,0.12)', textAlign: 'center' }}>
                            Present (✓)
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(0,0,0,0.12)' }}>
                            Lowercase Characters
                          </td>
                          <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(0,0,0,0.12)', textAlign: 'center' }}>
                            <CheckCircle size={16} color="#2e7d32" />
                          </td>
                          <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(0,0,0,0.12)', textAlign: 'center' }}>
                            Present (✓)
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(0,0,0,0.12)' }}>
                            Numeric Characters
                          </td>
                          <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(0,0,0,0.12)', textAlign: 'center' }}>
                            <X size={16} color="#d32f2f" />
                          </td>
                          <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(0,0,0,0.12)', textAlign: 'center' }}>
                            Missing (✗)
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(0,0,0,0.12)' }}>
                            Special Characters
                          </td>
                          <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(0,0,0,0.12)', textAlign: 'center' }}>
                            <X size={16} color="#d32f2f" />
                          </td>
                          <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(0,0,0,0.12)', textAlign: 'center' }}>
                            Missing (✗)
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: '8px 12px' }}>
                            Password not previously used
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                            <AlertCircle size={16} color="#ff9800" />
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                            Cannot verify
                          </td>
                        </tr>
                      </>
                    ) : (
                      <>
                        <tr>
                          <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(0,0,0,0.12)' }}>
                            Password Rotation Date
                          </td>
                          <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(0,0,0,0.12)', textAlign: 'center' }}>
                            <X size={16} color="#d32f2f" />
                          </td>
                          <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(0,0,0,0.12)', textAlign: 'center' }}>
                            Cannot verify date
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(0,0,0,0.12)' }}>
                            Rotation within deadline
                          </td>
                          <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(0,0,0,0.12)', textAlign: 'center' }}>
                            <X size={16} color="#d32f2f" />
                          </td>
                          <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(0,0,0,0.12)', textAlign: 'center' }}>
                            Deadline exceeded
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(0,0,0,0.12)' }}>
                            Documentation Provided
                          </td>
                          <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(0,0,0,0.12)', textAlign: 'center' }}>
                            <X size={16} color="#d32f2f" />
                          </td>
                          <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(0,0,0,0.12)', textAlign: 'center' }}>
                            Incomplete
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: '8px 12px' }}>
                            Rotation Process Followed
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                            <AlertCircle size={16} color="#ff9800" />
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                            Cannot verify
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </Box>
            </Box>
            
            <Box sx={{ background: alpha('#d32f2f', 0.1), p: 2, borderRadius: 2, mb: 3 }}>
              <Typography variant="subtitle2" color="error.main">
                Next Steps:
              </Typography>
              <Typography variant="body2">
                Please address the issues and upload new evidence, or contact support if you need assistance.
              </Typography>
              <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="subtitle2">
                  Recommendations for {violationType}:
                </Typography>
                <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                  {violationType === 'Password Construction' ? (
                    <>
                      <li>Ensure password has at least 16 characters</li>
                      <li>Include uppercase letters, lowercase letters, numbers, and special characters</li>
                      <li>Submit documents showing the verified password policy</li>
                      <li>Use PDF format with clear password requirements highlighted</li>
                    </>
                  ) : (
                    <>
                      <li>Include clear documentation showing rotation date</li>
                      <li>Provide evidence of proper rotation compliance</li>
                      <li>Submit a complete record of rotation history if available</li>
                      <li>Use PDF or document formats rather than images alone</li>
                    </>
                  )}
                </ul>
              </Box>
            </Box>
            
            <TextField
              label="Feedback or Questions"
              multiline
              rows={3}
              fullWidth
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              sx={{ mb: 3 }}
              placeholder="Explain why you believe this should be approved or ask questions..."
            />
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button 
                variant="outlined" 
                color="primary" 
                onClick={resetUploader}
                sx={{ flex: 1 }}
                startIcon={<Upload size={16} />}
              >
                Try Again
              </Button>
              <Button 
                variant="contained" 
                color="secondary"
                sx={{ flex: 1 }}
                startIcon={<MessageSquareText size={16} />}
              >
                Talk to Live Agent
              </Button>
            </Box>
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
              <Button 
                onClick={onClose}
                color="inherit"
                size="small"
                startIcon={<X size={14} />}
              >
                Close
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Modal>
  );
} 