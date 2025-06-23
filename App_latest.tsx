import React, { useRef, useState } from "react";
import { generateMockReport, ReportItem, wellsFargoTheme } from "./utils/generate_report";
import { processZipFile } from "./services/zipFileProcessor";
import { processControlsWithEvidence, GetLLMEvidence } from "./services/evidenceService";
import { getDesignElementsByCID } from "./services/promptService";
import styles from './assessment.module.css';

// Enhanced ReportItem interface to match LLM results
interface EnhancedReportItem extends ReportItem {
    controlId?: string;
    designElementId?: string;
    status?: 'success' | 'error';
    processingError?: string;
    evidence?: string[];
}

interface ProcessingProgress {
    current: number;
    total: number;
    currentControl: string;
    phase: 'zip_processing' | 'llm_processing' | 'complete';
}

interface ProcessedFile {
    name: string;
    type: string;
    base64: string;
    fullPath?: string;
}

interface ProcessedZipResult {
    controls: Array<{
        cid: string;
        controlName: string;
        evidences: ProcessedFile[];
    }>;
    errors: string[];
    files?: ProcessedFile[];
}

interface FileContent {
    fileName: string;
    type: string;
    extension?: string;
    fullPath?: string;
}

interface ProcessedFolder {
    name: string;
    contents: FileContent[];
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
    const [zipContents, setZipContents] = useState<{ folders: ProcessedFolder[] }>({ folders: [] });
    const [showZipContents, setShowZipContents] = useState(false);
    const [isViewingContents, setIsViewingContents] = useState(false);

    const handleZipFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const zipFile = event.target.files?.[0];
        if (!zipFile) {
            console.log('No file selected');
            setZipUploaded(false);
            setZipContents({ folders: [] });
            return;
        }

        console.log('File selected:', {
            name: zipFile.name,
            size: zipFile.size,
            type: zipFile.type
        });

        try {
            console.log('Starting ZIP file processing...');
            // Process ZIP file to show contents
            const result = await processZipFile(zipFile) as ProcessedZipResult;

            console.log('ZIP processing result:', {
                controlsCount: result.controls?.length || 0,
                hasFiles: !!result.files,
                filesCount: result.files?.length || 0,
                errors: result.errors
            });

            if (result.controls) {
                console.log('Found controls:', result.controls.map(control => ({
                    name: control.controlName,
                    evidenceCount: control.evidences?.length || 0,
                    evidenceTypes: control.evidences?.map(e => e.type)
                })));
            }

            // Display all contents without validation
            const processedFolders: ProcessedFolder[] = [];

            // Process structured folders
            if (result.controls && result.controls.length > 0) {
                console.log('Processing structured folders...');
                const folderResults = result.controls.map(control => {
                    const folderContent = {
                        name: control.controlName || 'Unnamed Folder',
                        contents: control.evidences
                            .filter(evidence => evidence.type.toLowerCase() === 'pdf' ||
                                ['jpg', 'jpeg', 'png', 'gif'].includes(evidence.type.toLowerCase()))
                            .map(evidence => ({
                                fileName: evidence.name,
                                type: evidence.type.toLowerCase(),
                                extension: evidence.type.toLowerCase(),
                                fullPath: evidence.fullPath
                            }))
                    };
                    console.log(`Folder "${folderContent.name}" contains ${folderContent.contents.length} files`);
                    return folderContent;
                });
                processedFolders.push(...folderResults);
            } else {
                console.log('No structured folders found in the ZIP');
            }

            // Handle any loose files
            if (result.files && result.files.length > 0) {
                console.log('Processing loose files...');
                const looseFiles = result.files.filter(file =>
                    file.type.toLowerCase() === 'pdf' ||
                    ['jpg', 'jpeg', 'png', 'gif'].includes(file.type.toLowerCase())
                );

                console.log(`Found ${looseFiles.length} valid loose files`);

                if (looseFiles.length > 0) {
                    processedFolders.push({
                        name: 'Other Files',
                        contents: looseFiles.map(file => ({
                            fileName: file.name,
                            type: file.type.toLowerCase(),
                            extension: file.type.toLowerCase(),
                            fullPath: file.fullPath
                        }))
                    });
                }
            } else {
                console.log('No loose files found in the ZIP');
            }

            // Sort folders alphabetically
            processedFolders.sort((a, b) => a.name.localeCompare(b.name));

            // Sort files within each folder
            processedFolders.forEach(folder => {
                folder.contents.sort((a, b) => a.fileName.localeCompare(b.fileName));
            });

            console.log('Final processed structure:', {
                totalFolders: processedFolders.length,
                folders: processedFolders.map(f => ({
                    name: f.name,
                    fileCount: f.contents.length,
                    files: f.contents.map(c => c.fileName)
                }))
            });

            setZipContents({ folders: processedFolders });
            setZipUploaded(true);
            setError(null);

            console.log('ZIP contents successfully set to state');
        } catch (err) {
            console.error('Error processing ZIP file:', err);
            if (err instanceof Error) {
                console.error('Error details:', {
                    message: err.message,
                    stack: err.stack
                });
            }
            setError("Failed to read ZIP file. Please ensure it's a valid ZIP archive.");
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
            console.log('Starting evidence processing...');
            // Phase 1: Extract and process ZIP file
            setProcessingProgress({
                current: 0,
                total: 1,
                currentControl: 'Extracting ZIP file contents...',
                phase: 'zip_processing'
            });

            const zipResult = await processZipFile(zipFile) as ProcessedZipResult;
            console.log('ZIP extraction complete:', {
                controlsCount: zipResult.controls?.length || 0,
                hasFiles: !!zipResult.files,
                filesCount: zipResult.files?.length || 0
            });

            // Process structured folders
            if (!zipResult.controls || zipResult.controls.length === 0) {
                throw new Error('No valid controls found in ZIP file');
            }

            console.log('Processing controls/folders...');
            const validControls = zipResult.controls.filter(control =>
                control.evidences && control.evidences.some(evidence =>
                    evidence.type.toLowerCase() === 'pdf'
                )
            );

            console.log(`Found ${validControls.length} valid controls with evidence files`);

            if (validControls.length === 0) {
                throw new Error('No valid controls with PDF evidence files found');
            }

            // Phase 2: Process each control through LLM
            setProcessingProgress({
                current: 0,
                total: validControls.length,
                currentControl: 'Starting LLM processing...',
                phase: 'llm_processing'
            });

            let currentIndex = 0;
            const totalControls = validControls.length;

            for (const control of validControls) {
                currentIndex++;
                console.log(`Processing control ${currentIndex}/${totalControls}: ${control.controlName} (${control.cid})`);

                try {
                    // Get design elements for this CID
                    const [isValid, designElements] = await getDesignElementsByCID(control.cid);
                    console.log(`Design elements for ${control.cid}:`, {
                        isValid,
                        elementCount: designElements.length,
                        elements: designElements.map(e => e.id)
                    });

                    if (!isValid || designElements.length === 0) {
                        const errorMsg = `No design elements found for Control ID: ${control.cid}`;
                        console.warn(errorMsg);
                        processedReports.push({
                            id: control.cid,
                            controlId: control.cid,
                            designElementId: `${control.cid}-error`,
                            status: 'error',
                            processingError: errorMsg,
                            quality: 'INADEQUATE',
                            answer: 'NO',
                            evidence: [],
                            question: 'No design elements found',
                            source: 'System',
                            summary: errorMsg,
                            reference: 'N/A'
                        });
                        continue;
                    }

                    // Process each design element
                    for (const element of designElements) {
                        try {
                            setProcessingProgress({
                                current: currentIndex,
                                total: totalControls,
                                currentControl: `${control.controlName} - Processing ${element.id}`,
                                phase: 'llm_processing'
                            });

                            // Prepare evidence payload - reuse existing base64 from zipFileProcessor
                            const payload = {
                                controlId: control.cid,
                                designElementId: element.id,
                                prompt: element.prompt,
                                question: element.question,
                                evidences: control.evidences
                                    .filter(e => e.type.toLowerCase() === 'pdf')
                                    .map(e => e.base64)
                            };

                            console.log(`Sending payload for ${element.id}:`, {
                                controlId: payload.controlId,
                                designElementId: payload.designElementId,
                                evidenceCount: payload.evidences.length
                            });

                            // Process through LLM
                            const llmResult = await GetLLMEvidence(payload);
                            console.log(`LLM result for ${element.id}:`, {
                                status: llmResult.status,
                                hasAnswer: !!llmResult.answer,
                                error: llmResult.error
                            });

                            // Add to processed reports
                            processedReports.push({
                                id: element.id,
                                controlId: control.cid,
                                designElementId: element.id,
                                status: llmResult.status,
                                processingError: llmResult.error,
                                quality: llmResult.status === 'success' ? 'ADEQUATE' : 'INADEQUATE',
                                answer: llmResult.status === 'success' ? 'YES' : 'NO',
                                evidence: control.evidences.map(e => e.name),
                                question: element.question,
                                source: control.controlName,
                                summary: llmResult.answer || llmResult.error || 'No response received',
                                reference: `Control: ${control.controlName}`
                            });

                            // Add small delay to prevent overwhelming the API
                            await new Promise(resolve => setTimeout(resolve, 500));

                        } catch (error) {
                            const errorMsg = `Failed to process ${control.controlName} - ${element.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
                            console.error(errorMsg);
                            processedReports.push({
                                id: element.id,
                                controlId: control.cid,
                                designElementId: element.id,
                                status: 'error',
                                processingError: errorMsg,
                                quality: 'INADEQUATE',
                                answer: 'NO',
                                evidence: control.evidences.map(e => e.name),
                                question: element.question,
                                source: control.controlName,
                                summary: errorMsg,
                                reference: `Control: ${control.controlName}`
                            });
                        }
                    }

                } catch (error) {
                    const errorMsg = `Failed to get design elements for ${control.controlName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
                    console.error(errorMsg);
                    processedReports.push({
                        id: control.cid,
                        controlId: control.cid,
                        designElementId: `${control.cid}-error`,
                        status: 'error',
                        processingError: errorMsg,
                        quality: 'INADEQUATE',
                        answer: 'NO',
                        evidence: control.evidences.map(e => e.name),
                        question: 'Failed to get design elements',
                        source: control.controlName,
                        summary: errorMsg,
                        reference: `Control: ${control.controlName}`
                    });
                }
            }

            setProcessingProgress({
                current: totalControls,
                total: totalControls,
                currentControl: 'Processing complete!',
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

    const handleViewZipContents = async () => {
        if (!zipFileRef.current?.files?.[0]) {
            setError("Please select a zip file first.");
            return;
        }

        const zipFile = zipFileRef.current.files[0];
        setIsViewingContents(true);
        setError(null);

        try {
            console.log('Starting ZIP content viewing...');
            console.log('File details:', {
                name: zipFile.name,
                size: zipFile.size,
                type: zipFile.type
            });

            const result = await processZipFile(zipFile) as ProcessedZipResult;

            console.log('ZIP extraction result:', {
                controlsCount: result.controls?.length || 0,
                hasFiles: !!result.files,
                filesCount: result.files?.length || 0,
                errors: result.errors
            });

            // Process and display the contents
            const processedFolders: ProcessedFolder[] = [];

            if (result.controls && result.controls.length > 0) {
                console.log('Found controls:', result.controls);
                result.controls.forEach(control => {
                    console.log(`Processing control: ${control.controlName}`, {
                        evidenceCount: control.evidences?.length || 0,
                        evidences: control.evidences
                    });
                });

                processedFolders.push(...result.controls.map(control => ({
                    name: control.controlName || 'Unnamed Folder',
                    contents: control.evidences.map(evidence => ({
                        fileName: evidence.name,
                        type: evidence.type.toLowerCase(),
                        extension: evidence.type.toLowerCase(),
                        fullPath: evidence.fullPath
                    }))
                })));
            }

            if (result.files && result.files.length > 0) {
                console.log('Processing loose files:', result.files);
                processedFolders.push({
                    name: 'Other Files',
                    contents: result.files.map(file => ({
                        fileName: file.name,
                        type: file.type.toLowerCase(),
                        extension: file.type.toLowerCase(),
                        fullPath: file.fullPath
                    }))
                });
            }

            // Sort everything
            processedFolders.sort((a, b) => a.name.localeCompare(b.name));
            processedFolders.forEach(folder => {
                folder.contents.sort((a, b) => a.fileName.localeCompare(b.fileName));
            });

            console.log('Final processed structure:', {
                totalFolders: processedFolders.length,
                folders: processedFolders.map(f => ({
                    name: f.name,
                    fileCount: f.contents.length,
                    files: f.contents.map(c => c.fileName)
                }))
            });

            setZipContents({ folders: processedFolders });
            setShowZipContents(true);
            setZipUploaded(true);
        } catch (err) {
            console.error('Error viewing ZIP contents:', err);
            if (err instanceof Error) {
                console.error('Error details:', {
                    message: err.message,
                    stack: err.stack
                });
            }
            setError("Failed to read ZIP contents. Please ensure it's a valid ZIP archive.");
        } finally {
            setIsViewingContents(false);
        }
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
                                                <svg
                                                    className={styles.uploadIcon}
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 16 16"
                                                >
                                                    <path d="M8 1a5.53 5.53 0 0 0-3.594 1.342c-.766.66-1.321 1.52-1.464 2.383C1.266 4.095 0 5.555 0 7.318 0 9.366 1.708 11 3.781 11H7.5V5.707L5.354 7.854a.5.5 0 1 1-.708-.708l3-3a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 5.707V11h4.188C14.502 11 16 9.57 16 7.773c0-1.636-1.242-2.969-2.834-3.194C12.923 2.01 10.69 0 8 0zm0 13v-2h1v2h-1z" />
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

                {/* Action Buttons */}
                <div className="mb-4 d-flex justify-content-center gap-3">
                    <button
                        onClick={handleViewZipContents}
                        disabled={!zipFileRef.current?.files?.length || isViewingContents}
                        className={`${styles.actionButton} ${styles.secondaryBg}`}
                    >
                        {isViewingContents ? (
                            <div className="d-flex align-items-center">
                                <div className="spinner-border spinner-border-sm me-2" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                                Viewing ZIP contents...
                            </div>
                        ) : (
                            "View ZIP Contents"
                        )}
                    </button>

                    <button
                        onClick={handleGenerateReport}
                        disabled={!zipUploaded || loading || !showZipContents}
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
                            "Process Evidence Files"
                        )}
                    </button>
                </div>
            </div>

            {/* ZIP Contents Display */}
            {showZipContents && zipContents.folders.length > 0 && !showReport && (
                <div className={styles.contentCard}>
                    <div className={styles.contentHeader}>
                        <h5 className={`mb-0 ${styles.tableHeader}`}>
                            📁 Extracted ZIP Folder
                        </h5>
                    </div>
                    <div className="card-body">
                        <div className={styles.folderStructure}>
                            {zipContents.folders.map((folder, index) => (
                                <div key={index} className={styles.folderItem}>
                                    <div className={styles.folderName}>
                                        /{folder.name}/
                                    </div>
                                    {folder.contents.length > 0 && (
                                        <div className={styles.fileList}>
                                            {folder.contents.map((file, idx) => {
                                                // Get the path after the root folder
                                                const subPath = file.fullPath
                                                    ? file.fullPath.substring(folder.name.length + 1)
                                                    : file.fileName;

                                                // Split the path into parts for indentation
                                                const pathParts = subPath.split('/');
                                                const indent = pathParts.length > 1
                                                    ? (pathParts.length - 1) * 20
                                                    : 0;

                                                return (
                                                    <div
                                                        key={idx}
                                                        className={styles.fileItem}
                                                        style={{ paddingLeft: `${indent}px` }}
                                                    >
                                                        {pathParts.length > 1 ? (
                                                            <>
                                                                {pathParts.slice(0, -1).map((part: string, i: number) => (
                                                                    <span key={i} className={styles.subFolder}>
                                                                        {part}/
                                                                    </span>
                                                                ))}
                                                                <span className={styles.fileName}>
                                                                    {pathParts[pathParts.length - 1]}
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <span className={styles.fileName}>
                                                                {subPath}
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
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