import React, { useRef, useState } from "react";
import { generateMockReport, ReportItem, wellsFargoTheme } from "./utils/generate_report";
import { processZipFile } from "./services/zipFileProcessor";
import { processControlsWithEvidence, GetLLMEvidence, submitPromptForControl, type ApiResponse } from "./services/evidenceService";
import { getDesignElementsByCID } from "./services/promptService";
import { Upload } from "@progress/kendo-react-upload";
import { Button } from "@progress/kendo-react-buttons";
import { Grid, GridColumn } from "@progress/kendo-react-grid";
import { ExcelExport } from "@progress/kendo-react-excel-export";
import { Dialog } from "@progress/kendo-react-dialogs";
import { ZipContentsDisplay } from "./components/ZipContentsDisplay";
import { ReportDisplay } from "./components/ReportDisplay";
import { ProgressDisplay } from "./components/ProgressDisplay";
import "@progress/kendo-theme-default/dist/all.css";
import styles from './assessment.module.css';
import { ProgressBar } from '@progress/kendo-react-progressbars';
import './App.css';
import axios from "axios";
import { LLMAnswerResponse } from './types/survey';

// Enhanced ReportItem interface to match LLM results
interface EnhancedReportItem {
    id: string;
    controlId: string;  // This is Domain_Id
    designElementId: string;
    status: 'success' | 'error';
    processingError?: string;
    evidence?: string[];
    quality: 'ADEQUATE' | 'INADEQUATE' | 'NEEDS_REVIEW';
    answer: 'YES' | 'NO' | 'PARTIAL';
    question: string;
    source: string;
    summary: string;
    reference: string;
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
        evidences: ProcessedFile[];
    }>;
    errors: string[];
    totalFiles: number;
    totalControls: number;
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

interface ControlResult {

    controlId: string;
    isLoading: boolean;
    error?: string;
    results: ApiResponse[];
}

// Using console.log for now as logger is not available
const logger = {
    info: console.log,
    error: console.error
};

const FullVendorAnalysis: React.FC = () => {
    const excelExportRef = useRef<ExcelExport | null>(null);

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
    const [currentZipFile, setCurrentZipFile] = useState<File | null>(null);
    const [controlResults, setControlResults] = useState<Record<string, ControlResult>>({});

    const handleUploadSuccess = (event: any) => {
        const files = event.affectedFiles || [];
        if (files.length === 0) {
            console.log('No file selected');
            setZipUploaded(false);
            setZipContents({ folders: [] });
            setCurrentZipFile(null);
            return;
        }

        const zipFile = files[0].getRawFile();
        if (!zipFile) {
            console.log('Could not get raw file');
            setZipUploaded(false);
            setZipContents({ folders: [] });
            setCurrentZipFile(null);
            return;
        }

        setCurrentZipFile(zipFile);
        setZipUploaded(true);
        setShowZipContents(false);
        setIsViewingContents(false);
        handleZipFileChange(zipFile);
    };

    const handleZipFileChange = async (zipFile: File) => {
        console.log('File selected:', {
            name: zipFile.name,
            size: zipFile.size,
            type: zipFile.type
        });

        try {
            console.log('Starting ZIP file processing...');
            const result = await processZipFile(zipFile) as ProcessedZipResult;

            console.log('ZIP processing result:', {
                controlsCount: result.controls?.length || 0,
                totalFiles: result.totalFiles,
                totalControls: result.totalControls,
                errors: result.errors
            });

            if (result.controls) {
                console.log('Found controls:', result.controls.map(control => ({
                    id: control.cid,
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
                        name: control.cid,  // Using Domain_Id as folder name
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

    const processLLMResponse = (llmResult: any, control: any, element: any): EnhancedReportItem => {
        console.log(`Raw answer for element ${element.id} (CID: ${control.cid}):`, llmResult.answer);
        logger.info(`Raw answer string [${element.id}]: ${llmResult.answer}`);

        let cleanedAnswer = llmResult.answer?.trim() || '';
        console.log(`Initial trimmed answer [${element.id}]:`, cleanedAnswer);

        if (cleanedAnswer.startsWith('"') || cleanedAnswer.startsWith('```json')) {
            cleanedAnswer = cleanedAnswer
                .replace(/^"(?:json)?\s*/i, '')
                .replace(/\s*"```$/, '')
                .replace(/^```(?:json)?\s*/i, '')
                .replace(/\s*```$/, '');
            console.log(`Cleaned answer [${element.id}]:`, cleanedAnswer);
            logger.info(`Cleaned answer for ${element.id}:`, { original: llmResult.answer, cleaned: cleanedAnswer });
        }

        try {
            const parsed = JSON.parse(cleanedAnswer);
            logger.info(`Parsed answer for ${element.id}:`, parsed);
            console.log(`Parsed JSON Object for ${element.id}:`, parsed);

            // Extract the design element number from the ID (e.g., "BC001-sub-1" -> "1")
            const designElementNumber = element.id.split('-').pop() || '';

            // Create a unique identifier for this specific design element
            const uniqueId = `${control.cid}-element-${designElementNumber}`;

            // Map the answer to YES/NO/PARTIAL based on the parsed response
            const mappedAnswer = parsed.Answer?.toUpperCase() === 'YES' ? 'YES' :
                parsed.Answer?.toUpperCase() === 'PARTIAL' ? 'PARTIAL' : 'NO';

            // Map the quality to one of the allowed values
            const mappedQuality = parsed.Answer_Quality?.toUpperCase() === 'ADEQUATE' ? 'ADEQUATE' :
                parsed.Answer_Quality?.toUpperCase() === 'INADEQUATE' ? 'INADEQUATE' : 'NEEDS_REVIEW';

            // Create the report item with correct field mappings
            const reportItem: EnhancedReportItem = {
                id: uniqueId,
                controlId: control.cid,
                designElementId: element.id,
                status: llmResult.status,
                processingError: llmResult.error,
                quality: mappedQuality,
                answer: mappedAnswer,
                evidence: control.evidences.map((e: any) => e.name),
                question: element.question,
                source: parsed.Answer_Source || control.cid,
                summary: parsed.Summary || cleanedAnswer || 'No summary available',
                reference: parsed.Reference || `Domain_Id: ${control.cid} - Element ${designElementNumber}`
            };

            console.log('Processed report item:', reportItem);
            return reportItem;

        } catch (err) {
            console.error(`❌ Failed to parse answer for ${element.id}`, err);
            logger.error(`❌ Parsing error for ${element.id}`, { error: err, answer: llmResult.answer });

            // Extract the design element number for the error case too
            const designElementNumber = element.id.split('-').pop() || '';
            const uniqueId = `${control.cid}-element-${designElementNumber}`;

            return {
                id: uniqueId,
                controlId: control.cid,
                designElementId: element.id,
                status: 'error',
                processingError: `Failed to parse LLM response: ${err instanceof Error ? err.message : 'Unknown error'}`,
                quality: 'INADEQUATE',
                answer: 'NO',
                evidence: control.evidences.map((e: any) => e.name),
                question: element.question,
                source: control.cid,
                summary: cleanedAnswer || 'Failed to parse LLM response',
                reference: `Domain_Id: ${control.cid} - Element ${designElementNumber}`
            };
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
                totalFiles: zipResult.totalFiles,
                totalControls: zipResult.totalControls
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
                console.log(`Processing control ${currentIndex}/${totalControls}: ${control.cid}`);

                try {
                    // Get design elements for this Domain_Id
                    const [isValid, designElements] = await getDesignElementsByCID(control.cid);
                    console.log(`Design elements for ${control.cid}:`, {
                        isValid,
                        elementCount: designElements.length,
                        elements: designElements.map(e => e.id)
                    });

                    if (!isValid || designElements.length === 0) {
                        const errorMsg = `No design elements found for Domain_Id: ${control.cid}`;
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
                            reference: `Domain_Id: ${control.cid}`
                        } as EnhancedReportItem);
                        continue;
                    }

                    // Process each design element
                    for (const element of designElements) {
                        try {
                            setProcessingProgress({
                                current: currentIndex,
                                total: totalControls,
                                currentControl: `${control.cid} - Processing ${element.id}`,
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

                            // Process the LLM response
                            const processedReport = processLLMResponse(llmResult, control, element);
                            processedReports.push(processedReport);

                            // Add small delay to prevent overwhelming the API
                            await new Promise(resolve => setTimeout(resolve, 500));

                        } catch (error) {
                            const errorMsg = `Failed to process ${control.cid} - ${element.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
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
                                source: control.cid,
                                summary: errorMsg,
                                reference: `Domain_Id: ${control.cid}`
                            } as EnhancedReportItem);
                        }
                    }
                } catch (error) {
                    const errorMsg = `Failed to get design elements for ${control.cid}: ${error instanceof Error ? error.message : 'Unknown error'}`;
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
                        source: control.cid,
                        summary: errorMsg,
                        reference: `Domain_Id: ${control.cid}`
                    } as EnhancedReportItem);
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
        if (!zipUploaded || !currentZipFile) {
            setError("Please upload a zip file first.");
            return;
        }

        setError(null);
        setReport([]);
        setShowReport(false);
        setLoading(true);
        setProcessingProgress(null);

        try {
            console.log('Starting enhanced report generation with LLM integration...');

            // Call the enhanced processDesignElements function
            const enhancedReport = await processDesignElements(currentZipFile);

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
            const row = [
                item.question,
                item.answer,
                item.quality,
                item.source || 'N/A',
                item.summary || 'N/A',
                item.reference || 'N/A'
            ].map(cell => `"${cell.replace(/"/g, '""')}"`);
            return row.join(',');
        }).join('\n');

        const csvContent = headers + rows;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'assessment_report.csv';
        link.click();
    };

    const startOver = () => {
        setReport([]);
        setShowReport(false);
        setError(null);
        setLoading(false);
        setZipUploaded(false);
        setZipContents({ folders: [] });
        setCurrentZipFile(null);
        setViewMode('table');
        setProcessingProgress(null);
        setControlResults({});
        setIsViewingContents(false);
        setShowZipContents(false);
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
        if (!currentZipFile) return;
        setIsViewingContents(true);
        await handleZipFileChange(currentZipFile);
        setShowZipContents(true);
        setIsViewingContents(false);
    };

    return (
        <div className="app-container">
            <div className="text-center">
                <h1 className={styles.appTitle}>Third Party Risk Evaluation Service</h1>

                {/* ZIP File Upload Section */}
                <div className="row justify-content-center">
                    <div className="col-md-6">
                        <div className={styles.card}>
                            <div className={styles.cardBody}>
                                <h5 className={styles.cardTitle}>Upload ZIP File</h5>
                                <div className={styles.uploadZone}>
                                    <Upload
                                        restrictions={{
                                            allowedExtensions: ['.zip'],
                                            maxFileSize: 100000000 // 100MB
                                        }}
                                        batch={false}
                                        multiple={false}
                                        onAdd={handleUploadSuccess}
                                        saveUrl={''}
                                        autoUpload={false}
                                        withCredentials={false}
                                        showActionButtons={false}
                                    />
                                </div>
                                <small className="text-muted d-block mt-2">
                                    Upload a zip file with domain folders. Each folder must contain at least one PDF file and can include image files (JPG, PNG, GIF)
                                </small>
                            </div>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className={styles.alertDanger} role="alert">
                        {error}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="mt-4 d-flex justify-content-center gap-3">
                    <Button
                        disabled={!zipUploaded || isViewingContents}
                        onClick={handleViewZipContents}
                        className={isViewingContents ? styles.secondaryButton : styles.primaryButton}
                    >
                        {isViewingContents ? (
                            <>
                                <span className={styles.loadingSpinner}></span>
                                <span className="ms-2">Viewing ZIP contents...</span>
                            </>
                        ) : (
                            "View ZIP Contents"
                        )}
                    </Button>

                    <Button
                        onClick={handleGenerateReport}
                        disabled={!zipUploaded || loading || !showZipContents}
                        className={loading ? styles.secondaryButton : styles.primaryButton}
                    >
                        {loading ? (
                            <>
                                <span className={styles.loadingSpinner}></span>
                                <span className="ms-2">Analyzing evidence files...</span>
                            </>
                        ) : (
                            "Process Evidence Files"
                        )}
                    </Button>
                </div>

                {/* ZIP Contents Display */}
                {showZipContents && zipContents.folders.length > 0 && !loading && !showReport && (
                    <ZipContentsDisplay folders={zipContents.folders} />
                )}

                {/* Report Display */}
                {showReport && (
                    <div className="mt-4">
                        <ReportDisplay
                            results={report}
                            onStartOver={startOver}
                        />
                    </div>
                )}

                {/* Processing Progress */}
                {processingProgress && (
                    <div className={styles.progressContainer}>
                        <div className={styles.card}>
                            <div className={styles.cardBody}>
                                <div className="mb-3">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <span className="fw-bold">
                                            {processingProgress.phase === 'zip_processing' && 'Extracting ZIP contents...'}
                                            {processingProgress.phase === 'llm_processing' && 'AI Analysis in Progress...'}
                                            {processingProgress.phase === 'complete' && 'Processing Complete'}
                                        </span>
                                        <span className="text-muted">
                                            {processingProgress.current}/{processingProgress.total}
                                        </span>
                                    </div>
                                    <div className={styles.progressBar}>
                                        <div
                                            className={styles.progressFill}
                                            style={{
                                                width: `${(processingProgress.current / processingProgress.total) * 100}%`
                                            }}
                                        ></div>
                                    </div>
                                </div>
                                <small className="text-muted">{processingProgress.currentControl}</small>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FullVendorAnalysis;
