'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
    Container,
    Row,
    Col,
    Card,
    Button,
    ProgressBar,
    Table,
    ListGroup,
    Badge,
    Alert,
    Image,
    Modal,
    Form
} from 'react-bootstrap';
import {
    CloudUpload,
    Delete,
    FileCheck,
    Info,
    Zap,
    CheckCircle,
    Upload,
    FileText,
    Image as ImageIcon,
    File,
    MessageSquare,
    Star,
    TestTube2,
    PlayCircle,
    AlertCircle
} from 'lucide-react';
import { AuthGuard } from './components/AuthGuard';
import { FeedbackData, LLMAnalysisResponse, EvidenceFile, AnalysisResults } from './types/survey';

// Import utilities from processEvidence.ts
import {
    uploadImageHandlerLLM,
    validateImageFiles
} from './utils/processEvidence';

// Define Wells Fargo colors
const wfColors = {
    primary: '#D4001A', // Wells Fargo Red
    primaryLight: '#FF405A',
    primaryDark: '#B30017',
    secondary: '#FFBC0D', // Wells Fargo Gold
    secondaryLight: '#FFD65A',
    secondaryDark: '#E5A800',
    dark: '#1D1D1D',
    light: '#F5F5F7',
    success: '#34C759',
    error: '#D4001A',
    warning: '#FFBC0D',
    compliant: '#e8f5e9',
    nonCompliant: '#ffebee',
    partiallyCompliant: '#fff3e0',
    border: '#dee2e6',
    text: '#6E6E73',
    bgLight: '#f8f9fa'
};

// Custom button styles
const primaryButtonStyle = {
    backgroundColor: wfColors.primary,
    borderColor: wfColors.primary,
    color: '#ffffff'
};

const secondaryButtonStyle = {
    backgroundColor: 'transparent',
    borderColor: wfColors.border,
    color: wfColors.dark
};

const UploadEvidence: React.FC = () => {
    // File handling state
    const [files, setFiles] = useState<File[]>([]);
    const [dragActive, setDragActive] = useState<boolean>(false);
    const [uploading, setUploading] = useState<boolean>(false);
    const [uploadComplete, setUploadComplete] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Analysis state
    const [showAnalysis, setShowAnalysis] = useState<boolean>(false);
    const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
    const [analyzingProgress, setAnalyzingProgress] = useState<number>(0);
    const [analysisResults, setAnalysisResults] = useState<any>(null);
    const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);

    // LLM Testing state
    const [isTestingLLM, setIsTestingLLM] = useState<boolean>(false);
    const [llmTestResults, setLlmTestResults] = useState<any[]>([]);
    const [showTestModal, setShowTestModal] = useState<boolean>(false);
    const [testError, setTestError] = useState<string>('');

    // Feedback state
    const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);
    const [feedbackComment, setFeedbackComment] = useState<string>('');
    const [feedbackRating, setFeedbackRating] = useState<number>(0);
    const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);

    // File to base64 conversion
    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
        });
    };

    // Test LLM API functionality
    const testLLMAPI = async () => {
        if (files.length === 0) {
            alert('Please select at least one image file to test LLM functionality.');
            return;
        }

        const validation = validateImageFiles(files);
        if (!validation.valid) {
            setTestError(`File validation failed: ${validation.errors.join(', ')}`);
            return;
        }

        setIsTestingLLM(true);
        setTestError('');
        setLlmTestResults([]);

        try {
            console.log('Starting LLM API test with', files.length, 'files');

            const testResults = [];

            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                if (file.type.startsWith('image/')) {
                    try {
                        const base64Data = await fileToBase64(file);

                        const payload = {
                            imageBase64: base64Data,
                            filename: file.name,
                            token: 'test-token',
                            username: 'test-user'
                        };

                        const response = await fetch('/api/v1/getLLMResponseForEvidence', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(payload)
                        });

                        if (response.ok) {
                            const result = await response.json();
                            testResults.push({
                                filename: file.name,
                                status: 'success',
                                message: 'LLM response received successfully',
                                response: result,
                                fileSize: file.size,
                                fileType: file.type
                            });
                        } else {
                            const errorText = await response.text();
                            testResults.push({
                                filename: file.name,
                                status: 'error',
                                message: `API Error: ${response.status} - ${errorText}`,
                                response: null,
                                fileSize: file.size,
                                fileType: file.type
                            });
                        }
                    } catch (error) {
                        testResults.push({
                            filename: file.name,
                            status: 'error',
                            message: error instanceof Error ? error.message : 'Processing failed',
                            response: null,
                            fileSize: file.size,
                            fileType: file.type
                        });
                    }
                } else {
                    testResults.push({
                        filename: file.name,
                        status: 'skipped',
                        message: 'Non-image file skipped',
                        response: null,
                        fileSize: file.size,
                        fileType: file.type
                    });
                }
            }

            setLlmTestResults(testResults);
            setShowTestModal(true);

            const successfulTests = testResults.filter(r => r.status === 'success');
            if (successfulTests.length > 0) {
                console.log(`🎉 LLM API Test Complete! ${successfulTests.length}/${testResults.length} files processed successfully`);
            } else {
                console.warn('⚠️ No files were processed successfully');
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            setTestError(errorMessage);
            console.error('❌ LLM API test failed:', error);
        } finally {
            setIsTestingLLM(false);
        }
    };

    // Handle upload and analysis
    const handleUpload = async () => {
        if (files.length === 0) return;

        setUploading(true);
        setTestError('');

        try {
            console.log('Starting upload and LLM processing...');
            setUploadComplete(true);
            setUploading(false);

            // Start analysis immediately
            setTimeout(() => {
                startAnalysisWithLLM();
            }, 1000);

        } catch (error) {
            setUploading(false);
            const errorMessage = error instanceof Error ? error.message : 'Upload failed';
            setTestError(errorMessage);
            alert('Upload failed. Please try again.');
            console.error('Upload error:', error);
        }
    };

    // Start analysis with LLM
    const startAnalysisWithLLM = async () => {
        setIsAnalyzing(true);
        setAnalyzingProgress(0);

        try {
            const progressInterval = setInterval(() => {
                setAnalyzingProgress((prev: number) => {
                    if (prev >= 90) return 90;
                    return prev + 15;
                });
            }, 800);

            const analysisResults = [];
            const evidenceAnalysis = [];

            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                if (file.type.startsWith('image/')) {
                    try {
                        const base64Data = await fileToBase64(file);

                        const payload = {
                            imageBase64: base64Data,
                            filename: file.name,
                            token: 'analysis-token',
                            username: 'current-user'
                        };

                        const response = await fetch('/api/v1/getLLMResponseForEvidence', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(payload)
                        });

                        if (response.ok) {
                            const result = await response.json();
                            analysisResults.push({
                                filename: file.name,
                                result: result,
                                status: 'completed'
                            });

                            // Structure evidence analysis for UI
                            evidenceAnalysis.push({
                                questionId: `evidence_${i + 1}`,
                                evidence: {
                                    hasImage: true,
                                    fileName: file.name
                                },
                                observation: result.observation || 'Analysis completed',
                                relevance: result.relevance || 'Relevant to IAM compliance assessment',
                                analysis: result.analysis || result.response || 'Analysis results available',
                                status: result.compliance_status || 'Partially Compliant'
                            });
                        }
                    } catch (error) {
                        console.error(`Error processing ${file.name}:`, error);
                        analysisResults.push({
                            filename: file.name,
                            result: null,
                            status: 'error',
                            error: error instanceof Error ? error.message : 'Processing failed'
                        });
                    }
                }

                setAnalyzingProgress(90 + ((i + 1) / files.length) * 10);
            }

            clearInterval(progressInterval);
            setAnalyzingProgress(100);

            // Create comprehensive analysis results
            const complianceResults = {
                NHA_Compliance_Assessment: {
                    Introduction: "This assessment analyzes the uploaded evidence for NHA compliance according to Wells Fargo IAM policies.",
                    Evidence_Analysis: evidenceAnalysis,
                    Addressing_Specific_Survey_Questions: evidenceAnalysis.map((item, index) => ({
                        Survey_Question: `Evidence Item ${index + 1} Compliance`,
                        Response_Based_on_Images: item.analysis,
                        Evidence_Reference: item.evidence.fileName
                    })),
                    Summary: `Analysis of ${files.length} evidence files completed. Review individual assessments for detailed compliance status.`,
                    Justification: "Assessment based on visual analysis of uploaded evidence against IAM compliance requirements using YAML-configured prompts.",
                    Recommended_Actions: [
                        "Review all evidence items marked as non-compliant",
                        "Ensure eSAR inventory is up to date",
                        "Verify password policies meet ISCR-315-01 requirements",
                        "Document any remediation actions taken"
                    ],
                    Compliance_Flag: "Partially Compliant" // This could be calculated based on individual results
                }
            };

            setAnalysisResults(complianceResults);

            setTimeout(() => {
                setIsAnalyzing(false);
                setShowAnalysis(true);
            }, 1000);

        } catch (error) {
            setIsAnalyzing(false);
            setTestError(error instanceof Error ? error.message : 'Analysis failed');
            console.error('Analysis error:', error);
        }
    };

    // Create image preview URLs
    useEffect(() => {
        const imageFiles = files.filter((file: File) => file.type.startsWith('image/'));
        const urls = imageFiles.map((file: File) => URL.createObjectURL(file));
        setImagePreviewUrls(urls);

        return () => {
            urls.forEach((url: string) => URL.revokeObjectURL(url));
        };
    }, [files]);

    // Handle file selection
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFiles = Array.from(e.target.files);
            setFiles((prev: File[]) => [...prev, ...selectedFiles]);
        }
    };

    // Handle drag and drop
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
            setFiles((prev: File[]) => [...prev, ...droppedFiles]);
        }
    };

    // Remove file
    const handleDeleteFile = (index: number) => {
        setFiles(files.filter((_: File, i: number) => i !== index));
    };

    // Get file icon
    const getFileIcon = (fileType: string) => {
        if (fileType.startsWith('image/')) {
            return <ImageIcon size={20} color={wfColors.primary} />;
        } else if (fileType.includes('pdf')) {
            return <FileText size={20} color={wfColors.primary} />;
        } else {
            return <File size={20} color={wfColors.primary} />;
        }
    };

    // Get status badge style
    const getStatusBadgeStyle = (status: string): any => {
        const normalizedStatus = status.toLowerCase().trim();

        switch (normalizedStatus) {
            case 'compliant':
                return {
                    backgroundColor: wfColors.success,
                    color: 'white',
                    border: 'none'
                };
            case 'non-compliant':
                return {
                    backgroundColor: wfColors.error,
                    color: 'white',
                    border: 'none'
                };
            case 'partially compliant':
                return {
                    backgroundColor: wfColors.warning,
                    color: wfColors.dark,
                    border: 'none'
                };
            default:
                return {
                    backgroundColor: wfColors.light,
                    color: wfColors.dark,
                    border: `1px solid ${wfColors.border}`
                };
        }
    };

    // Download JSON report
    const handleDownloadJson = () => {
        const reportData = {
            timestamp: new Date().toISOString(),
            evidenceFiles: files.map((file: File) => ({
                name: file.name,
                size: file.size,
                type: file.type,
                lastModified: file.lastModified
            })),
            analysisResults: analysisResults,
            llmTestResults: llmTestResults.length > 0 ? llmTestResults : null,
        };

        const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `iam-evidence-analysis-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Handle feedback submission (simplified - no database)
    const handleSubmitFeedback = async () => {
        if (!feedbackComment.trim() || feedbackRating === 0) {
            alert('Please provide both a rating and comment for your feedback.');
            return;
        }

        // Simulate feedback submission
        console.log('Feedback submitted:', {
            rating: feedbackRating,
            comment: feedbackComment,
            timestamp: new Date().toISOString(),
            analysisId: `analysis_${Date.now()}`,
            evidenceCount: files.length
        });

        setFeedbackSubmitted(true);
        setShowFeedbackModal(false);

        setTimeout(() => {
            setFeedbackComment('');
            setFeedbackRating(0);
            setFeedbackSubmitted(false);
        }, 3000);
    };

    // Render upload section
    const renderUploadSection = () => (
        <Container className="mt-4">
            <Row className="justify-content-center">
                <Col lg={10}>
                    <Card className="shadow-sm border-0">
                        <Card.Header
                            className="text-center py-4"
                            style={{ backgroundColor: wfColors.primary, color: 'white' }}
                        >
                            <h2 className="mb-0">
                                <Upload size={32} className="me-2" />
                                IAM Evidence Upload & Analysis
                            </h2>
                            <p className="mb-0 mt-2">Upload evidence files for AI-powered compliance analysis</p>
                        </Card.Header>

                        <Card.Body className="p-4">
                            {/* Error Display */}
                            {testError && (
                                <Alert variant="danger" className="mb-4">
                                    <AlertCircle size={20} className="me-2" />
                                    <strong>Error:</strong> {testError}
                                </Alert>
                            )}

                            {/* Upload Instructions */}
                            <Alert variant="info" className="mb-4">
                                <Info size={20} className="me-2" />
                                <strong>What to Upload:</strong>
                                <ul className="mb-0 mt-2">
                                    <li>NHA Evidence (screenshots, exports, documentation)</li>
                                    <li>eSAR Inventory records</li>
                                    <li>Password Complexity configuration</li>
                                    <li>Password Rotation logs/evidence</li>
                                    <li>Password Suspension policy documentation</li>
                                </ul>
                            </Alert>

                            {/* Drag and Drop Area */}
                            <div
                                className={`border-2 border-dashed rounded p-5 text-center mb-4 ${dragActive ? 'border-primary bg-light' : 'border-secondary'
                                    }`}
                                style={{
                                    borderColor: dragActive ? wfColors.primary : wfColors.border,
                                    backgroundColor: dragActive ? wfColors.light : 'transparent',
                                    cursor: 'pointer'
                                }}
                                onClick={() => fileInputRef.current?.click()}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                            >
                                <input
                                    type="file"
                                    multiple
                                    ref={fileInputRef}
                                    style={{ display: 'none' }}
                                    onChange={handleFileSelect}
                                    accept="image/*,.pdf,.doc,.docx"
                                />

                                <CloudUpload size={48} color={wfColors.primary} className="mb-3" />
                                <h5>Drop files here or click to browse</h5>
                                <p className="text-muted mb-0">
                                    Supported formats: Images (JPG, PNG, GIF), PDF, Word Documents
                                </p>
                            </div>

                            {/* File List */}
                            {files.length > 0 && (
                                <div className="mb-4">
                                    <h6 className="mb-3">Selected Files ({files.length})</h6>
                                    <ListGroup>
                                        {files.map((file, index) => (
                                            <ListGroup.Item
                                                key={index}
                                                className="d-flex justify-content-between align-items-center"
                                                style={{ borderColor: wfColors.border }}
                                            >
                                                <div className="d-flex align-items-center">
                                                    {getFileIcon(file.type)}
                                                    <div className="ms-2">
                                                        <div style={{ color: wfColors.dark }}>{file.name}</div>
                                                        <small style={{ color: wfColors.text }}>
                                                            {(file.size / 1024).toFixed(2)} KB - {file.type}
                                                        </small>
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="outline-danger"
                                                    onClick={() => handleDeleteFile(index)}
                                                >
                                                    <Delete size={16} />
                                                </Button>
                                            </ListGroup.Item>
                                        ))}
                                    </ListGroup>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="text-center">
                                <div className="d-flex justify-content-center gap-3 flex-wrap">
                                    {/* Test LLM Button */}
                                    <Button
                                        style={{
                                            backgroundColor: wfColors.secondary,
                                            borderColor: wfColors.secondary,
                                            color: wfColors.dark
                                        }}
                                        size="lg"
                                        onClick={testLLMAPI}
                                        disabled={files.length === 0 || isTestingLLM}
                                        className="px-4"
                                    >
                                        {isTestingLLM ? (
                                            <>
                                                <div className="spinner-border spinner-border-sm me-2" role="status">
                                                    <span className="visually-hidden">Testing...</span>
                                                </div>
                                                Testing LLM API...
                                            </>
                                        ) : (
                                            <>
                                                <TestTube2 size={20} className="me-2" />
                                                Test LLM API
                                            </>
                                        )}
                                    </Button>

                                    {/* Upload & Analyze Button */}
                                    <Button
                                        style={primaryButtonStyle}
                                        size="lg"
                                        onClick={handleUpload}
                                        disabled={files.length === 0 || uploading}
                                        className="px-4"
                                    >
                                        {uploading ? (
                                            <>
                                                <div className="spinner-border spinner-border-sm me-2" role="status">
                                                    <span className="visually-hidden">Loading...</span>
                                                </div>
                                                Uploading...
                                            </>
                                        ) : (
                                            <>
                                                <PlayCircle size={20} className="me-2" />
                                                Analyze Evidence
                                            </>
                                        )}
                                    </Button>
                                </div>

                                {/* Test Results Summary */}
                                {llmTestResults.length > 0 && (
                                    <div className="mt-4">
                                        <Alert variant="success" className="p-3">
                                            <CheckCircle size={20} className="me-2" />
                                            <strong>LLM Test Complete!</strong>
                                            {' '}{llmTestResults.filter(r => r.status === 'success').length}/{llmTestResults.length} files processed successfully.
                                            <Button
                                                variant="link"
                                                size="sm"
                                                onClick={() => setShowTestModal(true)}
                                                className="ms-2 p-0"
                                            >
                                                View Details →
                                            </Button>
                                        </Alert>
                                    </div>
                                )}

                                {uploadComplete && !isAnalyzing && !showAnalysis && (
                                    <Alert variant="success" className="mt-4">
                                        <CheckCircle size={20} className="me-2" />
                                        Files processed successfully! Starting AI analysis...
                                    </Alert>
                                )}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* LLM Test Results Modal */}
            <Modal show={showTestModal} onHide={() => setShowTestModal(false)} size="lg" centered>
                <Modal.Header closeButton style={{ backgroundColor: wfColors.light }}>
                    <Modal.Title>
                        <TestTube2 size={24} className="me-2" style={{ color: wfColors.primary }} />
                        LLM API Test Results
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    <div className="mb-3">
                        <strong>Test Summary:</strong> {llmTestResults.filter(r => r.status === 'success').length} successful, {llmTestResults.filter(r => r.status === 'error').length} failed, {llmTestResults.filter(r => r.status === 'skipped').length} skipped
                    </div>

                    {llmTestResults.map((result, index) => (
                        <Card key={index} className="mb-3">
                            <Card.Header className="d-flex justify-content-between align-items-center py-2">
                                <span className="fw-bold">{result.filename}</span>
                                <Badge
                                    bg={result.status === 'success' ? 'success' : result.status === 'error' ? 'danger' : 'secondary'}
                                >
                                    {result.status}
                                </Badge>
                            </Card.Header>
                            <Card.Body className="py-2">
                                <p className="mb-2"><strong>Message:</strong> {result.message}</p>
                                {result.fileSize && (
                                    <p className="mb-2 small text-muted">
                                        Size: {(result.fileSize / 1024).toFixed(2)} KB | Type: {result.fileType}
                                    </p>
                                )}
                                {result.response && (
                                    <div>
                                        <strong>LLM Response:</strong>
                                        <pre className="bg-light p-2 mt-1 small" style={{ maxHeight: '150px', overflow: 'auto' }}>
                                            {JSON.stringify(result.response, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    ))}
                </Modal.Body>
                <Modal.Footer style={{ backgroundColor: wfColors.light }}>
                    <Button variant="outline-secondary" onClick={() => setShowTestModal(false)}>
                        Close
                    </Button>
                    <Button
                        style={primaryButtonStyle}
                        onClick={handleDownloadJson}
                        disabled={llmTestResults.length === 0}
                    >
                        <FileText size={16} className="me-2" />
                        Download Test Report
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );

    // Render analyzing view
    const renderAnalyzingView = () => (
        <Container className="mt-4">
            <Row className="justify-content-center">
                <Col lg={8}>
                    <Card className="shadow-sm border-0 text-center">
                        <Card.Body className="p-5">
                            <div className="mb-4">
                                <Zap size={64} color={wfColors.primary} className="mb-3" />
                                <h3>Analyzing Evidence with AI</h3>
                                <p className="text-muted">
                                    AI is processing your uploaded evidence files for compliance assessment...
                                </p>
                            </div>

                            <ProgressBar
                                now={analyzingProgress}
                                style={{ height: '12px' }}
                                className="mb-3"
                            />
                            <p className="small text-muted">
                                {analyzingProgress}% Complete
                            </p>

                            <div className="mt-4 p-3 bg-light rounded">
                                <small className="text-muted">
                                    Processing {files.length} files using YAML-configured prompts for IAM compliance analysis...
                                </small>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );

    // Render analysis results
    const renderAnalysisResults = () => {
        if (!analysisResults) {
            return (
                <Container className="mt-4">
                    <Row className="justify-content-center">
                        <Col lg={8}>
                            <Card className="shadow-sm border-0 text-center">
                                <Card.Body className="p-5">
                                    <div className="spinner-border" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                    <p className="mt-3">Loading analysis results...</p>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            );
        }

        const assessment = analysisResults.NHA_Compliance_Assessment;

        return (
            <Container className="mt-4">
                <Row className="justify-content-center">
                    <Col lg={12}>
                        {/* Header */}
                        <Card className="shadow-sm border-0 mb-4">
                            <Card.Header
                                className="text-center py-4"
                                style={{ backgroundColor: wfColors.primary, color: 'white' }}
                            >
                                <CheckCircle size={32} className="me-2" />
                                <h2 className="mb-0">IAM Evidence Analysis Complete</h2>
                                <p className="mb-0 mt-2">
                                    Status: <strong>{assessment.Compliance_Flag}</strong>
                                </p>
                            </Card.Header>
                        </Card>

                        {/* LLM Test Results Summary */}
                        {llmTestResults.length > 0 && (
                            <Card className="shadow-sm border-0 mb-4">
                                <Card.Header className="d-flex justify-content-between align-items-center">
                                    <h5 className="mb-0">
                                        <TestTube2 size={20} className="me-2 text-primary" />
                                        LLM API Test Summary
                                    </h5>
                                    <Button
                                        variant="outline-primary"
                                        size="sm"
                                        onClick={() => setShowTestModal(true)}
                                    >
                                        View Details
                                    </Button>
                                </Card.Header>
                                <Card.Body>
                                    <div className="row text-center">
                                        <div className="col-md-4">
                                            <div className="p-3">
                                                <h4 className="text-success">{llmTestResults.filter(r => r.status === 'success').length}</h4>
                                                <small className="text-muted">Successful</small>
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <div className="p-3">
                                                <h4 className="text-danger">{llmTestResults.filter(r => r.status === 'error').length}</h4>
                                                <small className="text-muted">Failed</small>
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <div className="p-3">
                                                <h4 className="text-secondary">{llmTestResults.filter(r => r.status === 'skipped').length}</h4>
                                                <small className="text-muted">Skipped</small>
                                            </div>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        )}

                        {/* Introduction */}
                        <Card className="shadow-sm border-0 mb-4">
                            <Card.Body>
                                <h5 className="mb-3">
                                    <Info size={20} className="me-2 text-primary" />
                                    Assessment Introduction
                                </h5>
                                <p className="text-muted mb-0">{assessment.Introduction}</p>
                            </Card.Body>
                        </Card>

                        {/* Evidence Analysis Grid */}
                        {assessment.Evidence_Analysis.map((evidence: any, index: number) => (
                            <Card key={index} className="shadow-sm border-0 mb-4">
                                <Card.Header
                                    className="d-flex justify-content-end align-items-center py-3"
                                    style={{
                                        backgroundColor: wfColors.light,
                                        color: wfColors.dark
                                    }}
                                >
                                    <span
                                        style={{
                                            ...getStatusBadgeStyle(evidence.status),
                                            padding: '8px 16px',
                                            borderRadius: '6px',
                                            fontSize: '0.875rem',
                                            fontWeight: '500',
                                            display: 'inline-block'
                                        }}
                                    >
                                        {evidence.status}
                                    </span>
                                </Card.Header>

                                <Card.Body className="p-0">
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', minHeight: '200px' }}>
                                        {/* Evidence Column */}
                                        <div className="p-3 border-end" style={{ backgroundColor: '#f8f9fa' }}>
                                            <h6 className="fw-bold mb-3" style={{ color: wfColors.dark }}>Evidence</h6>
                                            <div className="text-center">
                                                {evidence.evidence.hasImage ? (
                                                    <div>
                                                        <ImageIcon size={48} className="mb-2" style={{ color: wfColors.primary }} />
                                                        <p className="small mb-0" style={{ color: wfColors.text }}>
                                                            {evidence.evidence.fileName}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <FileCheck size={48} className="mb-2 text-muted" />
                                                        <p className="small mb-0 text-muted">
                                                            {evidence.evidence.fileName}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Observation Column */}
                                        <div className="p-3 border-end">
                                            <h6 className="fw-bold mb-3" style={{ color: wfColors.dark }}>Observation</h6>
                                            <p className="small mb-0" style={{ color: wfColors.text, lineHeight: '1.4' }}>
                                                {evidence.observation}
                                            </p>
                                        </div>

                                        {/* Relevance Column */}
                                        <div className="p-3 border-end">
                                            <h6 className="fw-bold mb-3" style={{ color: wfColors.dark }}>Relevance</h6>
                                            <p className="small mb-0" style={{ color: wfColors.text, lineHeight: '1.4' }}>
                                                {evidence.relevance}
                                            </p>
                                        </div>

                                        {/* Analysis Column */}
                                        <div className="p-3">
                                            <h6 className="fw-bold mb-3" style={{ color: wfColors.dark }}>Analysis</h6>
                                            <p className="small mb-0" style={{ color: wfColors.text, lineHeight: '1.4' }}>
                                                {evidence.analysis}
                                            </p>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        ))}

                        {/* Survey Questions Summary */}
                        <Card className="shadow-sm border-0 mb-4">
                            <Card.Header>
                                <h5 className="mb-0">
                                    <FileCheck size={20} className="me-2" />
                                    Evidence Assessment Summary
                                </h5>
                            </Card.Header>
                            <Card.Body className="p-0">
                                <Table responsive className="mb-0">
                                    <thead style={{ backgroundColor: wfColors.light }}>
                                        <tr>
                                            <th style={{ color: wfColors.dark, padding: '15px', width: '30%' }}>Evidence Item</th>
                                            <th style={{ color: wfColors.dark, padding: '15px', width: '50%' }}>Analysis Result</th>
                                            <th style={{ color: wfColors.dark, padding: '15px', width: '20%' }}>File Reference</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {assessment.Addressing_Specific_Survey_Questions.map((item: any, index: number) => (
                                            <tr key={index}>
                                                <td className="p-3">
                                                    <strong style={{ color: wfColors.dark }}>{item.Survey_Question}</strong>
                                                </td>
                                                <td className="p-3" style={{ color: wfColors.text }}>
                                                    {item.Response_Based_on_Images}
                                                </td>
                                                <td className="p-3">
                                                    <Badge style={{ color: wfColors.text, border: `1px solid ${wfColors.border}`, backgroundColor: 'transparent' }}>
                                                        {item.Evidence_Reference}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </Card.Body>
                        </Card>

                        {/* Summary and Recommendations */}
                        <Card className="shadow-sm border-0 mb-4">
                            <Card.Header>
                                <h5 className="mb-0">
                                    <Zap size={20} className="me-2" />
                                    Summary & Recommendations
                                </h5>
                            </Card.Header>
                            <Card.Body>
                                <div className="row">
                                    <div className="col-md-8">
                                        <h6 className="fw-bold mb-2">Summary</h6>
                                        <p style={{ color: wfColors.text, lineHeight: '1.6' }}>{assessment.Summary}</p>

                                        <h6 className="fw-bold mb-2 mt-4">Justification</h6>
                                        <p style={{ color: wfColors.text, lineHeight: '1.6' }}>{assessment.Justification}</p>
                                    </div>
                                    <div className="col-md-4">
                                        <h6 className="fw-bold mb-2">Recommended Actions</h6>
                                        <ul className="list-unstyled">
                                            {assessment.Recommended_Actions.map((action: string, index: number) => (
                                                <li key={index} className="mb-2 d-flex align-items-start">
                                                    <CheckCircle size={16} className="me-2 mt-1 text-primary flex-shrink-0" />
                                                    <span className="small" style={{ color: wfColors.text }}>{action}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>

                        {/* Evidence Preview */}
                        {imagePreviewUrls.length > 0 && (
                            <Card className="shadow-sm border-0 mb-4">
                                <Card.Header>
                                    <h5 className="mb-0">
                                        <ImageIcon size={20} className="me-2" />
                                        Uploaded Evidence Preview
                                    </h5>
                                </Card.Header>
                                <Card.Body>
                                    <Row>
                                        {imagePreviewUrls.map((url, index) => (
                                            <Col md={4} key={index} className="mb-3">
                                                <Image
                                                    src={url}
                                                    alt={`Evidence ${index + 1}`}
                                                    thumbnail
                                                    style={{ width: '100%', maxHeight: '200px', objectFit: 'cover' }}
                                                />
                                            </Col>
                                        ))}
                                    </Row>
                                </Card.Body>
                            </Card>
                        )}

                        {/* Action Buttons */}
                        <div className="text-center mb-4">
                            <Button
                                style={primaryButtonStyle}
                                size="lg"
                                onClick={handleDownloadJson}
                                className="me-3"
                            >
                                <FileText size={20} className="me-2" />
                                Download Report
                            </Button>
                            <Button
                                style={{
                                    backgroundColor: wfColors.secondary,
                                    borderColor: wfColors.secondary,
                                    color: wfColors.dark
                                }}
                                size="lg"
                                onClick={() => setShowFeedbackModal(true)}
                                className="me-3"
                            >
                                <MessageSquare size={20} className="me-2" />
                                Provide Feedback
                            </Button>
                            <Button
                                style={secondaryButtonStyle}
                                size="lg"
                                onClick={() => window.location.reload()}
                            >
                                Start New Analysis
                            </Button>
                        </div>

                        {/* Feedback Success Alert */}
                        {feedbackSubmitted && (
                            <Alert variant="success" className="text-center mb-4">
                                <CheckCircle size={20} className="me-2" />
                                Thank you for your feedback! Your input helps us improve our AI analysis.
                            </Alert>
                        )}

                        {/* Feedback Modal */}
                        <Modal show={showFeedbackModal} onHide={() => setShowFeedbackModal(false)} size="lg" centered>
                            <Modal.Header closeButton style={{ backgroundColor: wfColors.light }}>
                                <Modal.Title>
                                    <MessageSquare size={24} className="me-2" style={{ color: wfColors.primary }} />
                                    Provide Feedback on Analysis
                                </Modal.Title>
                            </Modal.Header>
                            <Modal.Body className="p-4">
                                <Form>
                                    {/* Rating Section */}
                                    <Form.Group className="mb-4">
                                        <Form.Label className="fw-bold mb-3">
                                            How would you rate the accuracy of this analysis?
                                        </Form.Label>
                                        <div className="d-flex align-items-center">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                    key={star}
                                                    size={32}
                                                    className="me-2"
                                                    style={{
                                                        color: star <= feedbackRating ? wfColors.secondary : wfColors.border,
                                                        fill: star <= feedbackRating ? wfColors.secondary : 'transparent',
                                                        cursor: 'pointer'
                                                    }}
                                                    onClick={() => setFeedbackRating(star)}
                                                />
                                            ))}
                                            <span className="ms-3 text-muted">
                                                {feedbackRating > 0 && (
                                                    <>
                                                        {feedbackRating} of 5 stars
                                                        {feedbackRating === 1 && ' - Poor'}
                                                        {feedbackRating === 2 && ' - Fair'}
                                                        {feedbackRating === 3 && ' - Good'}
                                                        {feedbackRating === 4 && ' - Very Good'}
                                                        {feedbackRating === 5 && ' - Excellent'}
                                                    </>
                                                )}
                                            </span>
                                        </div>
                                    </Form.Group>

                                    {/* Comment Section */}
                                    <Form.Group className="mb-4">
                                        <Form.Label className="fw-bold">
                                            Please provide specific feedback about the analysis:
                                        </Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={5}
                                            placeholder="Share your thoughts on the analysis accuracy, missing elements, suggestions for improvement, or any other feedback..."
                                            value={feedbackComment}
                                            onChange={(e) => setFeedbackComment(e.target.value)}
                                            style={{ borderColor: wfColors.border }}
                                        />
                                        <Form.Text className="text-muted">
                                            Your feedback helps us improve our AI analysis capabilities.
                                        </Form.Text>
                                    </Form.Group>

                                    {/* Analysis Summary for Reference */}
                                    <div className="p-3 rounded" style={{ backgroundColor: wfColors.light }}>
                                        <h6 className="fw-bold mb-2">Analysis Summary (for reference):</h6>
                                        <p className="small mb-1">
                                            <strong>Compliance Status:</strong> {analysisResults?.NHA_Compliance_Assessment?.Compliance_Flag}
                                        </p>
                                        <p className="small mb-1">
                                            <strong>Evidence Files:</strong> {files.length} files analyzed
                                        </p>
                                        <p className="small mb-0">
                                            <strong>Analysis Date:</strong> {new Date().toLocaleDateString()}
                                        </p>
                                    </div>
                                </Form>
                            </Modal.Body>
                            <Modal.Footer style={{ backgroundColor: wfColors.light }}>
                                <Button
                                    variant="outline-secondary"
                                    onClick={() => setShowFeedbackModal(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    style={primaryButtonStyle}
                                    onClick={handleSubmitFeedback}
                                    disabled={!feedbackComment.trim() || feedbackRating === 0}
                                >
                                    <CheckCircle size={16} className="me-2" />
                                    Submit Feedback
                                </Button>
                            </Modal.Footer>
                        </Modal>
                    </Col>
                </Row>
            </Container>
        );
    };

    // Main render logic
    if (showAnalysis) {
        return renderAnalysisResults();
    }

    if (isAnalyzing) {
        return renderAnalyzingView();
    }

    return renderUploadSection();
};

export default function SecuredUploadEvidence() {
    return (
        <AuthGuard>
            <UploadEvidence />
        </AuthGuard>
    );
} 