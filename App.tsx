import React, { useState } from 'react';
import { Upload } from '@progress/kendo-react-upload';
import { processZipFile } from './services/zipFileProcessor';
import { getLLMEvidenceBatchParallel, type ApiResponse } from './services/evidenceService';
import { getDesignElementsByCID } from './services/promptService';
import { ReportDisplay } from './components/ReportDisplay';
import { ZipContentsDisplay } from './components/ZipContentsDisplay';
import { ProgressDisplay } from './components/ProgressDisplay';
import styles from './assessment.module.css';
import { Button } from '@progress/kendo-react-buttons';

interface EnhancedReportItem {
    id: string;
    controlId: string;
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

const FullVendorAnalysis: React.FC = () => {
    const [currentZipFile, setCurrentZipFile] = useState<File | null>(null);
    const [zipUploaded, setZipUploaded] = useState(false);
    const [zipContents, setZipContents] = useState<{ folders: ProcessedFolder[] }>({ folders: [] });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [report, setReport] = useState<EnhancedReportItem[]>([]);
    const [showReport, setShowReport] = useState(false);
    const [viewMode, setViewMode] = useState<'card' | 'table'>('table');
    const [processingProgress, setProcessingProgress] = useState<ProcessingProgress | null>(null);
    const [controlResults, setControlResults] = useState<Record<string, ControlResult>>({});
    const [isViewingContents, setIsViewingContents] = useState(false);
    const [showZipContents, setShowZipContents] = useState(false);

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

    const handleGenerateReport = async () => {
        if (!currentZipFile) {
            setError('Please upload a ZIP file first');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            setReport([]);

            // Process the zip file to get controls and evidence
            const zipResult = await processZipFile(currentZipFile);
            console.log('✅ Zip processing complete:', zipResult);

            // Prepare the control prompt list for parallel processing
            const controlPromptList = await Promise.all(
                zipResult.controls.map(async (control) => {
                    const [, designElements] = await getDesignElementsByCID(control.cid);
                    return {
                        controlId: control.cid,
                        prompts: designElements.map(element => ({
                            id: element.id,
                            prompt: element.prompt,
                            question: element.question
                        })),
                        files: control.evidences.map(e => {
                            // Convert base64 to Uint8Array
                            const binaryString = atob(e.base64);
                            const bytes = new Uint8Array(binaryString.length);
                            for (let i = 0; i < binaryString.length; i++) {
                                bytes[i] = binaryString.charCodeAt(i);
                            }
                            // Create a blob from the bytes
                            const blob = new Blob([bytes], { type: e.type });
                            // Create a File from the blob
                            return new File([blob], e.name, { type: e.type });
                        })
                    };
                })
            );

            console.log('✅ Control prompt list prepared:', controlPromptList);

            // Process all controls in parallel
            const batchResults = await getLLMEvidenceBatchParallel(controlPromptList);
            console.log('✅ Parallel processing complete:', batchResults);

            // Transform batch results into report format
            const reportResults: EnhancedReportItem[] = Object.entries(batchResults).flatMap(([controlId, results]) =>
                results.map(result => {
                    try {
                        // Clean up the response string before parsing
                        let cleanAnswer = result.answer || '';
                        cleanAnswer = cleanAnswer.trim();
                        cleanAnswer = cleanAnswer.replace(/\\n/g, ' ').replace(/\\t/g, ' ');
                        cleanAnswer = cleanAnswer.replace(/^```json\s*/, '').replace(/```\s*$/, '');

                        // If the answer starts with a quote, assume it's a JSON string
                        if (cleanAnswer.startsWith('"') && cleanAnswer.endsWith('"')) {
                            cleanAnswer = cleanAnswer.slice(1, -1);
                        }

                        const answerObj = JSON.parse(cleanAnswer);
                        const mappedQuality = answerObj.Answer_Quality?.toUpperCase() || 'NEEDS_REVIEW';
                        const mappedAnswer = answerObj.Answer?.toUpperCase() || 'NO';

                        return {
                            id: `${controlId}-${result.designElementId}`,
                            controlId: result.controlId,
                            designElementId: result.designElementId,
                            status: result.status,
                            quality: mappedQuality as 'ADEQUATE' | 'INADEQUATE' | 'NEEDS_REVIEW',
                            answer: mappedAnswer as 'YES' | 'NO' | 'PARTIAL',
                            question: result.question,
                            source: answerObj.Answer_Source || '',
                            summary: answerObj.Summary || cleanAnswer || '',
                            reference: answerObj.Reference || '',
                            evidence: []
                        };
                    } catch (error) {
                        console.error(`Error parsing result for ${result.designElementId}:`, error);
                        console.error('Raw answer:', result.answer);

                        return {
                            id: `${controlId}-${result.designElementId}`,
                            controlId: result.controlId,
                            designElementId: result.designElementId,
                            status: 'error',
                            quality: 'NEEDS_REVIEW',
                            answer: 'NO',
                            question: result.question,
                            source: '',
                            summary: result.answer || 'Failed to parse LLM response',
                            reference: '',
                            evidence: []
                        };
                    }
                })
            );

            console.log('✅ Report results prepared:', reportResults);
            setReport(reportResults);
            setShowReport(true);
        } catch (error) {
            console.error('Error generating report:', error);
            setError(error instanceof Error ? error.message : 'An error occurred');
        } finally {
            setLoading(false);
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

    const handleViewZipContents = async () => {
        if (!currentZipFile) return;
        setIsViewingContents(true);
        await handleZipFileChange(currentZipFile);
        setShowZipContents(true);
        setIsViewingContents(false);
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Vendor Assessment Analysis</h1>

            <div className={styles.uploadSection}>
                <Upload
                    restrictions={{
                        allowedExtensions: ['.zip'],
                        maxFileSize: 100000000 // 100MB
                    }}
                    onAdd={handleUploadSuccess}
                    saveUrl={''}
                    autoUpload={false}
                    multiple={false}
                />
            </div>

            {error && (
                <div className={styles.alertDanger} role="alert">
                    {error}
                </div>
            )}

            {/* Action Buttons */}
            <div className={styles.actionButtons}>
                {!showReport ? (
                    <>
                        <Button
                            disabled={!zipUploaded || loading}
                            onClick={handleGenerateReport}
                            themeColor={'primary'}
                        >
                            {loading ? 'Processing...' : 'Generate Report'}
                        </Button>
                        {zipUploaded && (
                            <Button
                                disabled={loading || isViewingContents}
                                onClick={handleViewZipContents}
                                themeColor={'info'}
                                fillMode="outline"
                            >
                                {isViewingContents ? 'Loading Contents...' : 'View ZIP Contents'}
                            </Button>
                        )}
                    </>
                ) : (
                    <>
                        <Button
                            onClick={() => setViewMode(viewMode === 'table' ? 'card' : 'table')}
                            themeColor={'secondary'}
                        >
                            {viewMode === 'table' ? 'Card View' : 'Table View'}
                        </Button>
                        <Button onClick={downloadExcel} themeColor={'success'}>
                            Download CSV
                        </Button>
                        <Button onClick={startOver} themeColor={'error'} fillMode="outline">
                            Start Over
                        </Button>
                    </>
                )}
            </div>

            {/* Progress Display */}
            {loading && processingProgress && (
                <ProgressDisplay progress={processingProgress} />
            )}

            {/* ZIP Contents Display */}
            {showZipContents && (
                <ZipContentsDisplay
                    folders={zipContents.folders}
                    onClose={() => setShowZipContents(false)}
                />
            )}

            {/* Report Display */}
            {showReport && (
                <ReportDisplay
                    results={report}
                    viewMode={viewMode}
                />
            )}
        </div>
    );
};

export default FullVendorAnalysis;
