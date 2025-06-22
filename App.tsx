import React, { useRef, useState } from "react";
import { generateMockReport, ReportItem, wellsFargoTheme } from "./utils/generate_report";
import { processZipFile } from "./services/zipFileProcessor";
import { processControlsWithEvidence } from "./services/evidenceService";
import styles from './assessment.module.css';

// Enhanced ReportItem interface to match LLM results
interface EnhancedReportItem extends ReportItem {
    controlId?: string;
    designElementId?: string;
    status?: 'success' | 'error';
    processingError?: string;
}

interface ProcessingProgress {
    current: number;
    total: number;
    currentControl: string;
    phase: 'zip_processing' | 'llm_processing' | 'complete';
}

const FullVendorAnalysis: React.FC = () => {
    const zipFileRef = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [report, setReport] = useState<EnhancedReportItem[]>([]);
    const [showReport, setShowReport] = useState(false);
    const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
    const [zipUploaded, setZipUploaded] = useState(false);
    const [processingProgress, setProcessingProgress] = useState<ProcessingProgress | null>(null);
    const [zipContents, setZipContents] = useState<{ folders: Array<{ name: string, contents: Array<{ fileName: string, type: string, extension?: string }> }> }>({ folders: [] });

    const handleZipFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const zipFile = event.target.files?.[0];
        if (!zipFile) {
            setZipUploaded(false);
            setZipContents({ folders: [] });
            return;
        }

        try {
            // Process ZIP file to show contents
            const result = await processZipFile(zipFile);

            // Validate folder structure and file requirements
            const validationErrors: string[] = [];

            // Check if there are any controls/folders
            if (result.controls.length === 0) {
                throw new Error("No domain folders found in the ZIP file.");
            }

            // Validate each control/domain folder
            result.controls.forEach(control => {
                const hasPdf = control.evidences.some(evidence =>
                    evidence.type.toLowerCase() === 'pdf'
                );

                if (!hasPdf) {
                    validationErrors.push(`Domain folder "${control.controlName}" must contain at least one PDF file.`);
                }

                // Check if evidences are directly in the domain folder
                if (control.evidences.length === 0) {
                    validationErrors.push(`Domain folder "${control.controlName}" must contain evidence files.`);
                }
            });

            if (validationErrors.length > 0) {
                throw new Error("Validation errors:\n" + validationErrors.join("\n"));
            }

            // Update ZIP contents display with both PDFs and images
            const processedFolders = result.controls.map(control => ({
                name: control.controlName,
                contents: control.evidences.map(evidence => {
                    const fileType = evidence.type.toLowerCase();
                    return {
                        fileName: evidence.name,
                        type: fileType,
                        extension: fileType
                    };
                })
            }));

            setZipContents({ folders: processedFolders });
            setZipUploaded(true);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to process zip file.");
            console.error(err);
            setZipUploaded(false);
            setZipContents({ folders: [] });
        }
    };

    /**
     * Enhanced processDesignElements function with sequential LLM processing
     * Processes each control and its design elements one by one
     */
    const processDesignElements = async (zipFile: File): Promise<EnhancedReportItem[]> => {
        const processedReports: EnhancedReportItem[] = [];

        try {
            // Phase 1: Extract and process ZIP file
            setProcessingProgress({
                current: 0,
                total: 1,
                currentControl: 'Extracting ZIP file contents...',
                phase: 'zip_processing'
            });

            console.log('Starting ZIP file processing...');
            const zipResult = await processZipFile(zipFile);

            if (zipResult.errors.length > 0) {
                console.warn('ZIP processing errors:', zipResult.errors);
            }

            if (zipResult.controls.length === 0) {
                throw new Error('No valid domain folders found in ZIP file');
            }

            console.log(`Found ${zipResult.controls.length} domains to process`);

            // Phase 2: Sequential LLM Processing
            setProcessingProgress({
                current: 0,
                total: zipResult.controls.length,
                currentControl: 'Starting evidence analysis...',
                phase: 'llm_processing'
            });

            // Process controls with evidence through LLM sequentially
            const processedResult = await processControlsWithEvidence(
                zipResult.controls.map(control => ({
                    cid: control.cid,
                    controlName: control.controlName,
                    evidences: control.evidences
                        .filter(evidence => {
                            const type = evidence.type.toLowerCase();
                            return type === 'pdf' ||
                                type === 'jpg' ||
                                type === 'jpeg' ||
                                type === 'png' ||
                                type === 'gif';
                        })
                        .map(evidence => ({
                            base64: evidence.base64,
                            name: evidence.name,
                            type: evidence.type
                        }))
                })),
                (progressUpdate) => {
                    setProcessingProgress({
                        current: progressUpdate.current,
                        total: progressUpdate.total,
                        currentControl: progressUpdate.currentControl,
                        phase: 'llm_processing'
                    });
                }
            );

            console.log(`Evidence processing completed. Results: ${processedResult.results.length}`);

            // Phase 3: Transform results to match existing ReportItem interface
            processedResult.results.forEach((result, index) => {
                const control = zipResult.controls.find(c => c.cid === result.controlId);

                // Map LLM result status to ReportItem answer format
                const mappedAnswer: 'YES' | 'NO' | 'PARTIAL' = result.status === 'success'
                    ? (result.answer && result.answer.trim() ? 'YES' : 'PARTIAL')
                    : 'NO';

                // Map status to quality format
                const mappedQuality: 'ADEQUATE' | 'INADEQUATE' | 'NEEDS_REVIEW' = result.status === 'success'
                    ? 'ADEQUATE'
                    : 'INADEQUATE';

                processedReports.push({
                    id: result.designElementId,
                    question: result.question,
                    answer: mappedAnswer,
                    quality: mappedQuality,
                    source: `Control: ${control?.controlName || 'Unknown'}`,
                    summary: `${result.status === 'success' ? 'Successfully processed' : 'Processing failed'} for ${result.designElementId}`,
                    reference: `CID: ${result.controlId}, Element: ${result.designElementId}`,
                    controlId: result.controlId,
                    designElementId: result.designElementId,
                    status: result.status,
                    processingError: result.error
                });
            });

            setProcessingProgress({
                current: zipResult.controls.length,
                total: zipResult.controls.length,
                currentControl: `Processing complete! ${processedResult.successCount} successful, ${processedResult.errorCount} errors`,
                phase: 'complete'
            });

            return processedReports;

        } catch (error) {
            console.error('Error in processDesignElements:', error);
            throw error;
        }
    };

    const handleGenerateReport = async () => {
        if (!zipUploaded || !zipFileRef.current?.files?.[0]) {
            setError("Please select a zip file first.");
            return;
        }

        const zipFile = zipFileRef.current.files[0];

        setError(null);
        setReport([]);
        setShowReport(false);
        setLoading(true);
        setProcessingProgress(null);

        try {
            console.log('Starting enhanced report generation with LLM integration...');

            // Call the enhanced processDesignElements function
            const enhancedReport = await processDesignElements(zipFile);

            setReport(enhancedReport);
            setShowReport(true);

            console.log(`Report generation completed. Generated ${enhancedReport.length} report items.`);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to generate report.";
            console.error('Report generation failed:', err);
            setError(errorMessage);
        } finally {
            setLoading(false);
            // Clear progress after a short delay
            setTimeout(() => setProcessingProgress(null), 3000);
        }
    };

    const downloadExcel = () => {
        if (!report || report.length === 0) return;

        const headers = "Question,Answer,Quality,Source,Summary,Reference\n";
        const rows = report.map(item => {
            const question = item.question.replace(/"/g, '""');
            const summary = item.summary.replace(/"/g, '""');
            const source = item.source.replace(/"/g, '""');
            const reference = item.reference.replace(/"/g, '""');

            return `"${question}","${item.answer}","${item.quality}","${source}","${summary}","${reference}"`;
        }).join("\n");

        const csvContent = headers + rows;

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        link.setAttribute('href', url);
        link.setAttribute('download', `risk-assessment-report-${timestamp}.csv`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const startOver = () => {
        setReport([]);
        setShowReport(false);
        setError(null);
        setLoading(false);
        setZipUploaded(false);
        setZipContents({ folders: [] });
        if (zipFileRef.current) zipFileRef.current.value = '';
    };

    const toggleViewMode = () => {
        setViewMode(viewMode === 'cards' ? 'table' : 'cards');
    };

    const getQualityBadgeClass = (quality: string) => {
        const qualityClasses = {
            'ADEQUATE': styles.badgeAdequate,
            'INADEQUATE': styles.badgeInadequate,
            'NEEDS_REVIEW': styles.badgeNeedsReview
        };
        return qualityClasses[quality as keyof typeof qualityClasses] || styles.badge;
    };

    const getAnswerBadgeClass = (answer: string) => {
        const answerClasses = {
            'YES': styles.badgeYes,
            'NO': styles.badgeNo,
            'PARTIAL': styles.badgePartial
        };
        return answerClasses[answer as keyof typeof answerClasses] || styles.badge;
    };

    const getStatusBadgeClass = (status: 'success' | 'error') => {
        const statusClasses = {
            'success': styles.badgeSuccess,
            'error': styles.badgeError
        };
        return statusClasses[status] || styles.badge;
    };

    return (
        <div className={`container-fluid ${styles.mainContainer}`}>
            <div className="text-center mb-4">
                <h1 className={`mb-4 ${styles.mainTitle}`}>
                    Third Party Risk Evaluation Service
                </h1>

                {/* ZIP File Upload Section */}
                <div className="row justify-content-center">
                    <div className="col-md-6">
                        <div className={styles.uploadCard}>
                            <div className="card-body">
                                <label className="form-label h5 mb-3">Upload ZIP File</label>
                                <div className="d-flex align-items-center justify-content-center mb-3">
                                    <div className="position-relative w-100">
                                        <input
                                            type="file"
                                            className="position-absolute w-100 h-100 opacity-0"
                                            ref={zipFileRef}
                                            accept=".zip"
                                            onChange={handleZipFileChange}
                                            style={{
                                                cursor: 'pointer',
                                                zIndex: 2
                                            }}
                                        />
                                        <div className={styles.uploadArea}>
                                            <div className="d-flex align-items-center justify-content-center">
                                                <svg className={styles.uploadIcon} viewBox="0 0 16 16">
                                                    <path fillRule="evenodd" d="M4.406 1.342A5.53 5.53 0 0 1 8 0c2.69 0 4.923 2 5.166 4.579C14.758 4.804 16 6.137 16 7.773 16 9.569 14.502 11 12.687 11H10a.5.5 0 0 1 0-1h2.688C13.979 10 15 8.988 15 7.773c0-1.216-1.02-2.228-2.313-2.228h-.5v-.5C12.188 2.825 10.328 1 8 1a4.53 4.53 0 0 0-2.941 1.1c-.757.652-1.153 1.438-1.153 2.055v.448l-.445.049C2.064 4.805 1 5.952 1 7.318 1 8.785 2.23 10 3.781 10H6a.5.5 0 0 1 0 1H3.781C1.708 11 0 9.366 0 7.318c0-1.763 1.266-3.223 2.942-3.593.143-.863.698-1.723 1.464-2.383" />
                                                    <path fillRule="evenodd" d="M7.646 4.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 5.707V14.5a.5.5 0 0 1-1 0V5.707L5.354 7.854a.5.5 0 1 1-.708-.708z" />
                                                </svg>
                                                <div className={styles.uploadText}>
                                                    {zipUploaded ? (
                                                        <span className={styles.uploadSuccess}>
                                                            ✓ ZIP file uploaded successfully
                                                        </span>
                                                    ) : (
                                                        <span>Upload ZIP File with Evidence</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <small className="form-text text-muted text-center d-block">
                                    Upload a zip file with domain folders. Each folder must contain at least one PDF file and can include image files (JPG, PNG, GIF)
                                </small>
                            </div>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="alert alert-danger" role="alert">
                        {error}
                    </div>
                )}

                {/* Enhanced Progress Display */}
                {processingProgress && (
                    <div className="row justify-content-center mb-4">
                        <div className="col-md-8">
                            <div className={styles.progressCard}>
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h6 className="mb-0">
                                            {processingProgress.phase === 'zip_processing' && '📁 Processing ZIP File'}
                                            {processingProgress.phase === 'llm_processing' && '🤖 AI Analysis in Progress'}
                                            {processingProgress.phase === 'complete' && '✅ Processing Complete'}
                                        </h6>
                                        <span className="badge bg-primary">
                                            {processingProgress.current}/{processingProgress.total}
                                        </span>
                                    </div>
                                    <div className="progress mb-2">
                                        <div
                                            className={`${styles.progressBar} ${processingProgress.phase === 'complete'
                                                ? styles.progressBarSuccess
                                                : styles.progressBarPrimary
                                                }`}
                                            role="progressbar"
                                            style={{ width: `${(processingProgress.current / processingProgress.total) * 100}%` }}
                                        ></div>
                                    </div>
                                    <small className="text-muted d-block">
                                        <i className="bi bi-gear-fill me-1"></i>
                                        {processingProgress.currentControl}
                                    </small>

                                    {processingProgress.phase === 'llm_processing' && (
                                        <div className="mt-2">
                                            <small className="text-info">
                                                <i className="bi bi-info-circle me-1"></i>
                                                Processing evidence files sequentially - each control and design element is analyzed one at a time for accurate results.
                                            </small>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Button */}
                <div className="mb-4">
                    <button
                        onClick={handleGenerateReport}
                        disabled={!zipUploaded || loading}
                        className={styles.actionButton}
                    >
                        {loading ? (
                            <div className="d-flex align-items-center">
                                <div className="spinner-border spinner-border-sm me-2" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                                Analyzing evidence files...
                            </div>
                        ) : (
                            "Process Evidence Files & Generate Report"
                        )}
                    </button>
                </div>
            </div>

            {/* ZIP Contents Display */}
            {zipContents.folders.length > 0 && !showReport && (
                <div className={styles.contentCard}>
                    <div className={styles.contentHeader}>
                        <h5 className={`mb-0 ${styles.tableHeader}`}>
                            📁 ZIP File Contents
                        </h5>
                    </div>
                    <div className="card-body">
                        {zipContents.folders.map((folder, index) => (
                            <div key={index} className="mb-3">
                                <strong className={styles.primaryText}>
                                    📂 {folder.name}
                                </strong>
                                {folder.contents.length > 0 && (
                                    <ul className="ms-3 mt-2">
                                        {folder.contents.map((file, idx) => (
                                            <li key={idx} className={styles.tableHeader}>
                                                {file.type === 'pdf' && '📕 '}
                                                {['jpg', 'jpeg', 'png', 'gif'].includes(file.type) && '🖼️ '}
                                                {file.fileName}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Generated Report Display */}
            {showReport && report && report.length > 0 && (
                <div className={styles.contentCard}>
                    <div className={styles.reportHeader}>
                        <h2 className={styles.tableHeader}>Generated Report</h2>
                        <div className="d-flex gap-3">
                            <button
                                onClick={toggleViewMode}
                                className={`btn ${styles.secondaryBg}`}
                            >
                                {viewMode === 'cards' ? 'Table View' : 'Card View'}
                            </button>
                            <button
                                onClick={downloadExcel}
                                className={`btn ${styles.successBg}`}
                            >
                                Download CSV
                            </button>
                            <button
                                onClick={startOver}
                                className={`btn ${styles.dangerBg}`}
                            >
                                Start Over
                            </button>
                        </div>
                    </div>
                    <div className="card-body p-0">
                        {viewMode === 'table' ? (
                            <div className="table-responsive">
                                <table className="table table-hover mb-0">
                                    <thead className={styles.contentHeader}>
                                        <tr>
                                            <th className={styles.tableHeader}>Question</th>
                                            <th className={styles.tableHeader}>Answer</th>
                                            <th className={styles.tableHeader}>Quality</th>
                                            <th className={styles.tableHeader}>Source</th>
                                            <th className={styles.tableHeader}>Summary</th>
                                            <th className={styles.tableHeader}>Reference</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report.map((item, index) => (
                                            <tr key={index} className={styles.tableRow}>
                                                <td className={styles.text} style={{ maxWidth: '400px', wordWrap: 'break-word' }}>
                                                    <strong>Q: </strong>{item.question}
                                                </td>
                                                <td>
                                                    <span className={getAnswerBadgeClass(item.answer)}>
                                                        {item.answer}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={getQualityBadgeClass(item.quality)}>
                                                        {item.quality}
                                                    </span>
                                                </td>
                                                <td className={styles.tableHeader}>
                                                    {item.source}
                                                </td>
                                                <td className={styles.text} style={{ maxWidth: '300px', wordWrap: 'break-word' }}>
                                                    {item.summary}
                                                </td>
                                                <td className={styles.tableHeader}>
                                                    {item.reference}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-3">
                                {report.map((item, index) => (
                                    <div key={index} className={`card mb-3 ${styles.borderRadius}`}>
                                        <div className="card-body">
                                            <h5 className={`card-title ${styles.tableHeader}`}>
                                                Q: {item.question}
                                            </h5>
                                            <div className="table-responsive">
                                                <table className="table table-borderless">
                                                    <tbody>
                                                        <tr>
                                                            <td className={`fw-bold ${styles.tableHeader}`}>Answer:</td>
                                                            <td>
                                                                <span className={getAnswerBadgeClass(item.answer)}>
                                                                    {item.answer}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td className={`fw-bold ${styles.tableHeader}`}>Quality:</td>
                                                            <td>
                                                                <span className={getQualityBadgeClass(item.quality)}>
                                                                    {item.quality}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td className={`fw-bold ${styles.tableHeader}`}>Source:</td>
                                                            <td className={styles.tableHeader}>{item.source}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className={`fw-bold ${styles.tableHeader}`}>Summary:</td>
                                                            <td className={styles.tableHeader}>{item.summary}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className={`fw-bold ${styles.tableHeader}`}>Reference:</td>
                                                            <td className={styles.tableHeader}>{item.reference}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FullVendorAnalysis;
