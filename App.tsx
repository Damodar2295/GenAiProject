import React, { useState, useRef } from 'react';
import { processZipFile, validateZipStructure, ControlEvidence } from '../services/zipFileProcessor';
import { processControlsWithEvidence, LLMEvidenceResult } from '../services/evidenceService';
import '../fullvendorassessment.css';
import { Upload } from "@progress/kendo-react-upload";
import { Button } from "@progress/kendo-react-buttons";
import { Grid, GridColumn } from "@progress/kendo-react-grid";
import { ExcelExport } from "@progress/kendo-react-excel-export";
import { Dialog } from "@progress/kendo-react-dialogs";
import { ProgressBar } from '@progress/kendo-react-progressbars';
import "@progress/kendo-theme-default/dist/all.css";

interface AssessmentProps {
    className?: string;
}

interface ProcessingProgress {
    current: number;
    total: number;
    currentControl: string;
    phase: 'upload' | 'processing' | 'llm' | 'complete';
}

interface AssessmentResult {
    controlId: string;
    controlName: string;
    designElementId: string;
    question: string;
    answer: string;
    status: 'success' | 'error';
    error?: string;
}

const Assessment: React.FC<AssessmentProps> = ({ className = '' }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [zipFile, setZipFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState<ProcessingProgress | null>(null);
    const [results, setResults] = useState<AssessmentResult[]>([]);
    const [errors, setErrors] = useState<string[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [processingStats, setProcessingStats] = useState<{
        totalControls: number;
        successCount: number;
        errorCount: number;
    } | null>(null);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            setZipFile(null);
            return;
        }

        try {
            setProgress({ current: 0, total: 1, currentControl: 'Validating zip structure...', phase: 'upload' });

            // Validate zip structure
            const validation = await validateZipStructure(file);
            if (!validation.isValid) {
                setErrors(validation.errors);
                setZipFile(null);
                setProgress(null);
                return;
            }

            setZipFile(file);
            setErrors([]);
            setProgress(null);
        } catch (error) {
            setErrors([error instanceof Error ? error.message : 'Failed to validate zip file']);
            setZipFile(null);
            setProgress(null);
        }
    };

    const handleProcessAssessment = async () => {
        if (!zipFile) {
            setErrors(['Please select a zip file first']);
            return;
        }

        setIsProcessing(true);
        setErrors([]);
        setResults([]);
        setShowResults(false);
        setProcessingStats(null);

        try {
            // Phase 1: Extract and process zip file
            setProgress({ current: 0, total: 1, currentControl: 'Extracting zip contents...', phase: 'processing' });

            const zipResult = await processZipFile(zipFile);

            if (zipResult.errors.length > 0) {
                setErrors(zipResult.errors);
            }

            if (zipResult.controls.length === 0) {
                setErrors(['No valid controls found in zip file']);
                setIsProcessing(false);
                setProgress(null);
                return;
            }

            // Phase 2: Process controls with LLM
            setProgress({
                current: 0,
                total: zipResult.controls.length,
                currentControl: 'Starting LLM processing...',
                phase: 'llm'
            });

            const processedResult = await processControlsWithEvidence(
                zipResult.controls,
                (progressUpdate) => {
                    setProgress({
                        current: progressUpdate.current,
                        total: progressUpdate.total,
                        currentControl: progressUpdate.currentControl,
                        phase: 'llm'
                    });
                }
            );

            // Transform results for display
            const assessmentResults: AssessmentResult[] = processedResult.results.map(result => ({
                controlId: result.controlId,
                controlName: zipResult.controls.find(c => c.cid === result.controlId)?.controlName || 'Unknown',
                designElementId: result.designElementId,
                question: result.question,
                answer: result.answer,
                status: result.status,
                error: result.error
            }));

            setResults(assessmentResults);
            setProcessingStats({
                totalControls: zipResult.controls.length,
                successCount: processedResult.successCount,
                errorCount: processedResult.errorCount
            });

            if (processedResult.errors.length > 0) {
                setErrors(prev => [...prev, ...processedResult.errors]);
            }

            setShowResults(true);
            setProgress({ current: 1, total: 1, currentControl: 'Assessment complete!', phase: 'complete' });

        } catch (error) {
            setErrors([error instanceof Error ? error.message : 'Failed to process assessment']);
        } finally {
            setIsProcessing(false);
            setTimeout(() => setProgress(null), 2000);
        }
    };

    const downloadResults = () => {
        if (results.length === 0) return;

        const headers = "Control ID,Control Name,Design Element ID,Question,Answer,Status,Error\n";
        const rows = results.map(result => {
            const question = result.question.replace(/"/g, '""');
            const answer = result.answer.replace(/"/g, '""');
            const error = (result.error || '').replace(/"/g, '""');

            return `"${result.controlId}","${result.controlName}","${result.designElementId}","${question}","${answer}","${result.status}","${error}"`;
        }).join("\n");

        const csvContent = headers + rows;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        link.href = url;
        link.download = `vendor-assessment-${timestamp}.csv`;
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const resetAssessment = () => {
        setZipFile(null);
        setResults([]);
        setErrors([]);
        setShowResults(false);
        setProgress(null);
        setProcessingStats(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const getStatusBadgeClass = (status: 'success' | 'error') => {
        return status === 'success' ? 'badge bg-success' : 'badge bg-danger';
    };

    return (
        <div className={`container mt-4 ${className}`}>
            <div className="row justify-content-center">
                <div className="col-lg-10">
                    <div className="card shadow">
                        <div className="card-header bg-primary text-white">
                            <h2 className="mb-0">
                                <i className="bi bi-shield-check me-2"></i>
                                Vendor Security Assessment
                            </h2>
                        </div>
                        <div className="card-body">

                            {/* File Upload Section */}
                            <div className="mb-4">
                                <h5 className="card-title">Upload Evidence Package</h5>
                                <div className="mb-3">
                                    <label htmlFor="zipFile" className="form-label">
                                        Select ZIP file containing control evidence organized by folders
                                    </label>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        className="form-control"
                                        id="zipFile"
                                        accept=".zip"
                                        onChange={handleFileUpload}
                                        disabled={isProcessing}
                                    />
                                    <div className="form-text">
                                        Ensure your ZIP file contains folders named after security controls (e.g., "access_control", "data_encryption")
                                        with PDF evidence files inside each folder.
                                    </div>
                                </div>

                                {zipFile && (
                                    <div className="alert alert-success">
                                        <i className="bi bi-check-circle me-2"></i>
                                        <strong>File loaded:</strong> {zipFile.name} ({(zipFile.size / (1024 * 1024)).toFixed(2)} MB)
                                    </div>
                                )}
                            </div>

                            {/* Error Display */}
                            {errors.length > 0 && (
                                <div className="alert alert-danger">
                                    <h6>Errors:</h6>
                                    <ul className="mb-0">
                                        {errors.map((error, index) => (
                                            <li key={index}>{error}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Processing Progress */}
                            {progress && (
                                <div className="mb-4">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <span className="fw-bold">
                                            {progress.phase === 'upload' && 'Validating Upload'}
                                            {progress.phase === 'processing' && 'Processing Files'}
                                            {progress.phase === 'llm' && 'AI Analysis in Progress'}
                                            {progress.phase === 'complete' && 'Complete'}
                                        </span>
                                        <span className="text-muted">{progress.current}/{progress.total}</span>
                                    </div>
                                    <div className="progress mb-2">
                                        <div
                                            className="progress-bar progress-bar-striped progress-bar-animated"
                                            role="progressbar"
                                            style={{ width: `${(progress.current / progress.total) * 100}%` }}
                                        ></div>
                                    </div>
                                    <small className="text-muted">{progress.currentControl}</small>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="d-flex gap-2 mb-4">
                                <button
                                    className="btn btn-primary"
                                    onClick={handleProcessAssessment}
                                    disabled={!zipFile || isProcessing}
                                >
                                    {isProcessing ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-play-circle me-2"></i>
                                            Start Assessment
                                        </>
                                    )}
                                </button>

                                {showResults && (
                                    <>
                                        <button
                                            className="btn btn-success"
                                            onClick={downloadResults}
                                        >
                                            <i className="bi bi-download me-2"></i>
                                            Download Results
                                        </button>
                                        <button
                                            className="btn btn-secondary"
                                            onClick={resetAssessment}
                                        >
                                            <i className="bi bi-arrow-clockwise me-2"></i>
                                            Start Over
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Processing Statistics */}
                            {processingStats && (
                                <div className="row mb-4">
                                    <div className="col-md-4">
                                        <div className="card text-center">
                                            <div className="card-body">
                                                <h5 className="card-title text-primary">{processingStats.totalControls}</h5>
                                                <p className="card-text">Total Controls</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="card text-center">
                                            <div className="card-body">
                                                <h5 className="card-title text-success">{processingStats.successCount}</h5>
                                                <p className="card-text">Successful</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="card text-center">
                                            <div className="card-body">
                                                <h5 className="card-title text-danger">{processingStats.errorCount}</h5>
                                                <p className="card-text">Errors</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Results Display */}
                            {showResults && results.length > 0 && (
                                <div className="mt-4">
                                    <h5 className="card-title mb-3">Assessment Results</h5>
                                    <div className="table-responsive">
                                        <table className="table table-striped table-hover">
                                            <thead className="table-dark">
                                                <tr>
                                                    <th>Control ID</th>
                                                    <th>Control Name</th>
                                                    <th>Design Element</th>
                                                    <th>Question</th>
                                                    <th>Answer</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {results.map((result, index) => (
                                                    <tr key={index}>
                                                        <td>
                                                            <code className="text-primary">{result.controlId}</code>
                                                        </td>
                                                        <td>{result.controlName}</td>
                                                        <td>
                                                            <small className="text-muted">{result.designElementId}</small>
                                                        </td>
                                                        <td style={{ maxWidth: '300px', fontSize: '0.9rem' }}>
                                                            {result.question}
                                                        </td>
                                                        <td style={{ maxWidth: '400px', fontSize: '0.9rem' }}>
                                                            {result.answer || (result.error && <span className="text-danger">Error: {result.error}</span>)}
                                                        </td>
                                                        <td>
                                                            <span className={getStatusBadgeClass(result.status)}>
                                                                {result.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Assessment; 
