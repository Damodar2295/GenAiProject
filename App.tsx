import React, { useRef, useState } from "react";
import { generateMockReport, ReportItem } from "./utils/generate_report";
import { processZipFile } from "./services/zipFileProcessor";
import { processControlsWithEvidence, GetLLMEvidence, submitPromptForControl, type ApiResponse, type EvidencePayload } from "./services/evidenceService";
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

// Add new type for processing mode
type ProcessingMode = 'sequential' | 'parallel';

const FullVendorAnalysis: React.FC = () => {
    const excelExportRef = useRef<ExcelExport | null>(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [report, setReport] = useState<EnhancedReportItem[]>([]);
    const [showReport, setShowReport] = useState(false);
    const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
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

            // Extract design element from the prompt or answer
            let designElement = 'No design element found';

            // First try to get from prompt if available
            if (element.prompt) {
                const promptParts = element.prompt.split('design element:');
                if (promptParts.length > 1) {
                    designElement = promptParts[1].trim();
                }
            }

            // If not found in prompt, try to extract from the answer
            if (designElement === 'No design element found' && parsed.Question) {
                // Extract the design element from the question if possible
                const questionParts = parsed.Question.split('design element:');
                if (questionParts.length > 1) {
                    designElement = questionParts[1].trim();
                } else {
                    // If no design element marker, use the full question
                    designElement = parsed.Question;
                }
            }

            // If still not found, use the question from the element
            if (designElement === 'No design element found' && element.question) {
                designElement = element.question;
            }

            console.log('Extracted design element:', {
                fromPrompt: element.prompt,
                fromAnswer: parsed.Question,
                finalElement: designElement
            });

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
                question: designElement,
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

            // Get question from element or use default
            const designElement = element.question || 'No question available';

            return {
                id: uniqueId,
                controlId: control.cid,
                designElementId: element.id,
                status: 'error',
                processingError: `Failed to parse LLM response: ${err instanceof Error ? err.message : 'Unknown error'}`,
                quality: 'INADEQUATE',
                answer: 'NO',
                evidence: control.evidences.map((e: any) => e.name),
                question: designElement,
                source: control.cid,
                summary: cleanedAnswer || 'Failed to parse LLM response',
                reference: `Domain_Id: ${control.cid} - Element ${designElementNumber}`
            };
        }
    };

    /**
     * Enhanced processDesignElements function with parallel LLM processing
     * Processes controls and their design elements in parallel for faster execution
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

            // Phase 2: Process controls through LLM in parallel
            setProcessingProgress({
                current: 0,
                total: validControls.length,
                currentControl: 'Starting LLM processing...',
                phase: 'llm_processing'
            });

            // Process all controls in parallel with a concurrency limit
            const concurrencyLimit = 3; // Process 3 controls at a time
            const chunks = [];
            for (let i = 0; i < validControls.length; i += concurrencyLimit) {
                chunks.push(validControls.slice(i, i + concurrencyLimit));
            }

            let processedCount = 0;
            for (const chunk of chunks) {
                // Process each chunk of controls in parallel
                const chunkPromises = chunk.map(async (control) => {
                    try {
                        // Get design elements for this CID
                        const [isValid, designElements] = await getDesignElementsByCID(control.cid);

                        if (!isValid || designElements.length === 0) {
                            const errorMsg = `No design elements found for Control ID: ${control.cid}`;
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
                            });
                            return;
                        }

                        // Process all design elements for this control in parallel
                        const elementPromises = designElements.map(async (element, elementIndex) => {
                            try {
                                // Prepare evidence payload
                                const payload: EvidencePayload = {
                                    controlId: control.cid,
                                    designElementId: element.id,
                                    prompt: element.prompt,
                                    question: element.question,
                                    evidences: control.evidences.map(e => e.base64)
                                };

                                console.log(`Processing ${control.cid} - ${element.id}`);
                                const llmResult = await GetLLMEvidence(payload);
                                return processLLMResponse(llmResult, control, element);
                            } catch (error) {
                                console.error(`Error processing element ${element.id}:`, error);
                                return {
                                    id: `${control.cid}-${elementIndex}`,
                                    controlId: control.cid,
                                    designElementId: element.id,
                                    status: 'error',
                                    processingError: error instanceof Error ? error.message : 'Unknown error',
                                    quality: 'INADEQUATE',
                                    answer: 'NO',
                                    evidence: control.evidences.map(e => e.name),
                                    question: element.question,
                                    source: control.cid,
                                    summary: 'Failed to process design element',
                                    reference: `Domain_Id: ${control.cid}`
                                };
                            }
                        });

                        const elementResults = await Promise.all(elementPromises);
                        processedReports.push(...elementResults);
                    } catch (error) {
                        console.error(`Error processing control ${control.cid}:`, error);
                        processedReports.push({
                            id: control.cid,
                            controlId: control.cid,
                            designElementId: `${control.cid}-error`,
                            status: 'error',
                            processingError: error instanceof Error ? error.message : 'Unknown error',
                            quality: 'INADEQUATE',
                            answer: 'NO',
                            evidence: control.evidences.map(e => e.name),
                            question: 'Failed to get design elements',
                            source: control.cid,
                            summary: `Failed to process control: ${error instanceof Error ? error.message : 'Unknown error'}`,
                            reference: `Domain_Id: ${control.cid}`
                        });
                    }
                });

                // Wait for the current chunk to complete
                await Promise.all(chunkPromises);
                processedCount += chunk.length;

                // Update progress
                setProcessingProgress({
                    current: processedCount,
                    total: validControls.length,
                    currentControl: `Processed ${processedCount}/${validControls.length} controls`,
                    phase: 'llm_processing'
                });
            }

            // Mark processing as complete
            setProcessingProgress({
                current: validControls.length,
                total: validControls.length,
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
        if (!currentZipFile) {
            setError('Please upload a ZIP file first');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            setReport([]);

            const results = await processDesignElements(currentZipFile);
            setReport(results);
            setShowReport(true);
        } catch (error) {
            console.error('Error generating report:', error);
            setError(error instanceof Error ? error.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const downloadCSV = () => {
        if (!report.length) return;

        const headers = ['Control ID', 'Design Element', 'Question', 'Answer', 'Quality', 'Source', 'Summary', 'Reference'];
        const csvRows = [headers];

        report.forEach(item => {
            csvRows.push([
                item.controlId,
                item.designElementId,
                item.question,
                item.answer,
                item.quality,
                item.source,
                item.summary,
                item.reference
            ]);
        });

        const csvContent = csvRows.map(row => row.map(cell =>
            typeof cell === 'string' ? `"${cell.replace(/"/g, '""')}"` : cell
        ).join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'vendor_analysis_results.csv');
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
        setCurrentZipFile(null);
        setViewMode('table');
        setProcessingProgress(null);
        setControlResults({});
        setIsViewingContents(false);
        setShowZipContents(false);
    };

    const handleViewZipContents = async () => {
        if (!currentZipFile) return;
        setIsViewingContents(true);
        await handleZipFileChange(currentZipFile);
        setShowZipContents(true);
        setIsViewingContents(false);
    };

    const toggleViewMode = () => {
        setViewMode(prev => prev === 'table' ? 'cards' : 'table');
    };

    return (
        <div className={`${styles.container} ${styles.background}`}>
            <div className={styles.navbar}>
                <div className={styles.navbarBrand}>
                    <h1 className={styles.mainTitle}>Full Vendor Assessment</h1>
                </div>
            </div>

            <div className={`${styles.mainContainer} container`}>
                <div className={`${styles.contentCard} card shadow-sm`}>
                    <div className="card-body p-4">
                        <div className={`${styles.uploadCard} mt-4`}>
                            <Upload
                                restrictions={{
                                    allowedExtensions: ['.zip'],
                                    maxFileSize: 100000000
                                }}
                                onAdd={handleUploadSuccess}
                                saveUrl={''}
                                autoUpload={false}
                                multiple={false}
                                className={styles.uploadArea}
                            />
                        </div>

                        {error && (
                            <div className={styles.alertDanger} role="alert">
                                {error}
                            </div>
                        )}

                        <div className="d-flex justify-content-center gap-4 mt-4">
                            <Button
                                disabled={!zipUploaded || isViewingContents}
                                onClick={handleViewZipContents}
                                className={styles.actionButton}
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
                                className={styles.actionButton}
                            >
                                {loading ? (
                                    <>
                                        <span className={styles.loadingSpinner}></span>
                                        <span className="ms-2">Processing analysis results, please wait...</span>
                                    </>
                                ) : (
                                    "Process Evidence Files"
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* ZIP Contents Display */}
                {showZipContents && zipContents.folders.length > 0 && !loading && !showReport && (
                    <div className={`${styles.contentCard} mt-4 shadow-sm`}>
                        <div className="card-body p-4">
                            <ZipContentsDisplay folders={zipContents.folders} />
                        </div>
                    </div>
                )}

                {/* Report Display */}
                {showReport && (
                    <div className={`${styles.contentCard} mt-4 shadow-sm`}>
                        <div className="card-body p-4">
                            <ReportDisplay
                                results={report}
                                onStartOver={startOver}
                                onDownloadExcel={downloadCSV}
                                viewMode={viewMode}
                                onToggleViewMode={toggleViewMode}
                            />
                        </div>
                    </div>
                )}

                {/* Processing Progress */}
                {processingProgress && (
                    <div className={`${styles.contentCard} mt-4 shadow-sm`}>
                        <div className="card-body p-4">
                            <div className="mb-3">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <span className={`${styles.text} fw-bold`}>
                                        {processingProgress.phase === 'zip_processing' && '⏳ Extracting ZIP contents...'}
                                        {processingProgress.phase === 'llm_processing' && '⏳ Processing analysis results, please wait...'}
                                        {processingProgress.phase === 'complete' && '✅ Processing Complete'}
                                    </span>
                                    <span className={styles.textSmall}>
                                        {processingProgress.current}/{processingProgress.total}
                                    </span>
                                </div>
                                <div className={styles.progressBar}>
                                    <div
                                        className={`${styles.progressFill} ${processingProgress.phase === 'complete'
                                            ? styles.progressBarSuccess
                                            : styles.progressBarPrimary
                                            }`}
                                        style={{
                                            width: `${(processingProgress.current / processingProgress.total) * 100}%`
                                        }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FullVendorAnalysis;
