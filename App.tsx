import React, { useRef, useState } from "react";
import { ExcelProcessor, ZipProcessResult } from "./utils/ExcelProcessor";
import { generateMockReport, ReportItem, wellsFargoTheme } from "./utils/generate_report";
import { processZipFile } from "./services/zipFileProcessor";
import { processControlsWithEvidence } from "./services/evidenceService";
import './fullvendorassessment.css';

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

const App: React.FC = () => {
    const zipFileRef = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ZipProcessResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [report, setReport] = useState<EnhancedReportItem[]>([]);
    const [showReport, setShowReport] = useState(false);
    const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
    const [zipUploaded, setZipUploaded] = useState(false);
    const [processingProgress, setProcessingProgress] = useState<ProcessingProgress | null>(null);

    const handleZipFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const zipFile = event.target.files?.[0];
        if (!zipFile) {
            setZipUploaded(false);
            setResult(null);
            return;
        }

        try {
            // Process ZIP file immediately to show contents
            const processor = new ExcelProcessor();
            const processResult = await processor.processZipFile(zipFile);
            setResult(processResult);
            setZipUploaded(true);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to process zip file.");
            console.error(err);
            setZipUploaded(false);
            setResult(null);
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
                // Continue processing even with some errors
            }

            if (zipResult.controls.length === 0) {
                throw new Error('No valid control folders found in ZIP file');
            }

            console.log(`Found ${zipResult.controls.length} controls to process`);

            // Phase 2: Sequential LLM Processing
            setProcessingProgress({
                current: 0,
                total: zipResult.controls.length,
                currentControl: 'Starting LLM analysis...',
                phase: 'llm_processing'
            });

            // Process controls with evidence through LLM sequentially
            const processedResult = await processControlsWithEvidence(
                zipResult.controls.map(control => ({
                    cid: control.cid,
                    controlName: control.controlName,
                    evidences: control.evidences.map(evidence => ({
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

            console.log(`LLM processing completed. Results: ${processedResult.results.length}`);

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
                    // Enhanced fields
                    controlId: result.controlId,
                    designElementId: result.designElementId,
                    status: result.status,
                    processingError: result.error
                });
            });

            // Add processing summary
            if (processedResult.errors.length > 0) {
                console.warn('Processing errors:', processedResult.errors);
            }

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
        setResult(null);
        setError(null);
        setLoading(false);
        setZipUploaded(false);
        if (zipFileRef.current) zipFileRef.current.value = '';
    };

    const toggleViewMode = () => {
        setViewMode(viewMode === 'cards' ? 'table' : 'cards');
    };

    const getQualityBadgeClass = (quality: string) => {
        return wellsFargoTheme.qualityClasses[quality as keyof typeof wellsFargoTheme.qualityClasses] || 'wf-badge';
    };

    const getAnswerBadgeClass = (answer: string) => {
        return wellsFargoTheme.answerClasses[answer as keyof typeof wellsFargoTheme.answerClasses] || 'wf-badge';
    };

    const getStatusBadgeClass = (status: 'success' | 'error') => {
        return wellsFargoTheme.statusClasses[status] || 'wf-badge';
    };

    return (
        <div className="container-fluid wf-main-container">
            <div className="text-center mb-4">
                <h1 className="mb-4 wf-main-title">
                    Third Party Risk Evaluation Service
                </h1>

                {/* ZIP File Upload Section */}
                <div className="row justify-content-center">
                    <div className="col-md-6">
                        <div className={wellsFargoTheme.classes.uploadCard}>
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
                                        <div className={wellsFargoTheme.classes.uploadArea}>
                                            <div className="d-flex align-items-center justify-content-center">
                                                <svg className={wellsFargoTheme.classes.uploadIcon} viewBox="0 0 16 16">
                                                    <path fillRule="evenodd" d="M4.406 1.342A5.53 5.53 0 0 1 8 0c2.69 0 4.923 2 5.166 4.579C14.758 4.804 16 6.137 16 7.773 16 9.569 14.502 11 12.687 11H10a.5.5 0 0 1 0-1h2.688C13.979 10 15 8.988 15 7.773c0-1.216-1.02-2.228-2.313-2.228h-.5v-.5C12.188 2.825 10.328 1 8 1a4.53 4.53 0 0 0-2.941 1.1c-.757.652-1.153 1.438-1.153 2.055v.448l-.445.049C2.064 4.805 1 5.952 1 7.318 1 8.785 2.23 10 3.781 10H6a.5.5 0 0 1 0 1H3.781C1.708 11 0 9.366 0 7.318c0-1.763 1.266-3.223 2.942-3.593.143-.863.698-1.723 1.464-2.383" />
                                                    <path fillRule="evenodd" d="M7.646 4.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 5.707V14.5a.5.5 0 0 1-1 0V5.707L5.354 7.854a.5.5 0 1 1-.708-.708z" />
                                                </svg>
                                                <div className={wellsFargoTheme.classes.uploadText}>
                                                    {zipUploaded ? (
                                                        <span className={wellsFargoTheme.classes.uploadSuccess}>
                                                            ✓ ZIP file uploaded successfully
                                                        </span>
                                                    ) : (
                                                        <span>Upload ZIP File</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <small className="form-text text-muted text-center d-block">
                                    Upload a zip file containing vendor questionnaire and evidence files
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
                            <div className={wellsFargoTheme.classes.progressCard}>
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
                                    <div className="progress mb-2 wf-progress-bar">
                                        <div
                                            className={`${wellsFargoTheme.classes.progressBar} ${processingProgress.phase === 'complete'
                                                ? wellsFargoTheme.classes.progressBarSuccess
                                                : wellsFargoTheme.classes.progressBarPrimary
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
                                                Processing controls sequentially - each control and design element is analyzed one at a time for accurate results.
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
                        className={wellsFargoTheme.classes.actionButton}
                    >
                        {loading ? (
                            <div className="d-flex align-items-center">
                                <div className="spinner-border spinner-border-sm me-2" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                                LLM is analysing the data and generating the report...
                            </div>
                        ) : (
                            "Process ZIP File & Generate Report"
                        )}
                    </button>
                </div>
            </div>

            {/* ZIP Contents Display - Show immediately after upload, hide during report generation */}
            {result && zipUploaded && !showReport && (
                <div className={wellsFargoTheme.classes.contentCard}>
                    <div className={wellsFargoTheme.classes.contentHeader}>
                        <h5 className={`mb-0 ${wellsFargoTheme.classes.tableHeader}`}>
                            📁 ZIP File Contents
                        </h5>
                    </div>
                    <div className="card-body">
                        {result.zipContents.folders.length > 0 ? (
                            <div>
                                {result.zipContents.folders.map((folder, index) => (
                                    <div key={index} className="mb-3">
                                        <strong className={wellsFargoTheme.classes.primaryText}>
                                            📂 {folder.name}
                                        </strong>
                                        {folder.contents.length > 0 && (
                                            <ul className="ms-3 mt-2">
                                                {folder.contents.map((file, idx) => (
                                                    <li key={idx} className={wellsFargoTheme.classes.tableHeader}>
                                                        {file.type === 'pdf' && '📕 '}
                                                        {file.type === 'excel' && '📊 '}
                                                        {file.type === 'other' && '📄 '}
                                                        {file.fileName} {file.extension && `(${file.extension})`}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted">No folders found in the ZIP file.</p>
                        )}
                    </div>
                </div>
            )}

            {/* Generated Report Display */}
            {showReport && report && report.length > 0 && (
                <div className={wellsFargoTheme.classes.contentCard}>
                    <div className={wellsFargoTheme.classes.reportHeader}>
                        <h2 className={wellsFargoTheme.classes.tableHeader}>Generated Report</h2>
                        <div className="d-flex gap-3">
                            <button
                                onClick={toggleViewMode}
                                className="btn wf-secondary-bg"
                            >
                                {viewMode === 'cards' ? 'Table View' : 'Card View'}
                            </button>
                            <button
                                onClick={downloadExcel}
                                className="btn wf-success-bg"
                            >
                                Download Excel
                            </button>
                            <button
                                onClick={startOver}
                                className="btn wf-danger-bg"
                            >
                                Start Over
                            </button>
                        </div>
                    </div>
                    <div className="card-body p-0">
                        {viewMode === 'table' ? (
                            <div className="table-responsive">
                                <table className="table table-hover mb-0">
                                    <thead className={wellsFargoTheme.classes.contentHeader}>
                                        <tr>
                                            <th className={wellsFargoTheme.classes.tableHeader}>Question</th>
                                            <th className={wellsFargoTheme.classes.tableHeader}>Answer</th>
                                            <th className={wellsFargoTheme.classes.tableHeader}>Quality</th>
                                            <th className={wellsFargoTheme.classes.tableHeader}>Source</th>
                                            <th className={wellsFargoTheme.classes.tableHeader}>Summary</th>
                                            <th className={wellsFargoTheme.classes.tableHeader}>Reference</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report.map((item, index) => (
                                            <tr key={index} className={wellsFargoTheme.classes.tableRow}>
                                                <td className="wf-text" style={{ maxWidth: '400px', wordWrap: 'break-word' }}>
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
                                                <td className={wellsFargoTheme.classes.tableHeader}>
                                                    {item.source}
                                                </td>
                                                <td className="wf-text" style={{ maxWidth: '300px', wordWrap: 'break-word' }}>
                                                    {item.summary}
                                                </td>
                                                <td className={wellsFargoTheme.classes.tableHeader}>
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
                                    <div key={index} className="card mb-3 wf-border-radius">
                                        <div className="card-body">
                                            <h5 className={`card-title ${wellsFargoTheme.classes.tableHeader}`}>
                                                Q: {item.question}
                                            </h5>
                                            <div className="table-responsive">
                                                <table className="table table-borderless">
                                                    <tbody>
                                                        <tr>
                                                            <td className={`fw-bold ${wellsFargoTheme.classes.tableHeader}`}>Answer:</td>
                                                            <td>
                                                                <span className={getAnswerBadgeClass(item.answer)}>
                                                                    {item.answer}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td className={`fw-bold ${wellsFargoTheme.classes.tableHeader}`}>Quality:</td>
                                                            <td>
                                                                <span className={getQualityBadgeClass(item.quality)}>
                                                                    {item.quality}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td className={`fw-bold ${wellsFargoTheme.classes.tableHeader}`}>Source:</td>
                                                            <td className={wellsFargoTheme.classes.tableHeader}>{item.source}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className={`fw-bold ${wellsFargoTheme.classes.tableHeader}`}>Summary:</td>
                                                            <td className={wellsFargoTheme.classes.tableHeader}>{item.summary}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className={`fw-bold ${wellsFargoTheme.classes.tableHeader}`}>Reference:</td>
                                                            <td className={wellsFargoTheme.classes.tableHeader}>{item.reference}</td>
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

export default App;