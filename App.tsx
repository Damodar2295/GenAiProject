import React, { useRef, useState } from "react";
import { ExcelProcessor, ZipProcessResult } from "./utils/ExcelProcessor";
import { generateMockReport, ReportItem, wellsFargoTheme } from "./utils/generate_report";

const App: React.FC = () => {
    const zipFileRef = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ZipProcessResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [report, setReport] = useState<ReportItem[]>([]);
    const [showReport, setShowReport] = useState(false);
    const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
    const [zipUploaded, setZipUploaded] = useState(false);

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

    const handleGenerateReport = async () => {
        if (!zipUploaded) {
            setError("Please select a zip file first.");
            return;
        }

        setError(null);
        setReport([]);
        setShowReport(false);
        setLoading(true);

        try {
            // Generate mock report data with LLM simulation
            const mockReport = await generateMockReport();
            setReport(mockReport);
            setShowReport(true);

        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to generate report.");
            console.error(err);
        }
        setLoading(false);
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

    const getQualityBadgeStyle = (quality: string) => {
        const color = wellsFargoTheme.qualityColors[quality as keyof typeof wellsFargoTheme.qualityColors] || '#6c757d';
        return {
            backgroundColor: color,
            color: 'white',
            padding: '0.25rem 0.5rem',
            borderRadius: '0.25rem',
            fontSize: '0.875rem',
            fontWeight: 'bold'
        };
    };

    const getAnswerBadgeStyle = (answer: string) => {
        const color = wellsFargoTheme.answerColors[answer as keyof typeof wellsFargoTheme.answerColors] || '#6c757d';
        return {
            backgroundColor: color,
            color: 'white',
            padding: '0.25rem 0.5rem',
            borderRadius: '0.25rem',
            fontSize: '0.875rem',
            fontWeight: 'bold'
        };
    };

    return (
        <div className="container-fluid mt-4">
            <div className="text-center mb-4">
                <h1 className="mb-4" style={{ color: '#000000' }}>
                    Third Party Risk Evaluation Service
                </h1>

                {/* ZIP File Upload Section */}
                <div className="row justify-content-center">
                    <div className="col-md-6">
                        <div className="card mb-4" style={{ borderColor: wellsFargoTheme.colors.border }}>
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
                                        <div
                                            className="w-100 d-flex align-items-center justify-content-center"
                                            style={{
                                                height: '80px',
                                                border: `2px dashed ${wellsFargoTheme.colors.border}`,
                                                backgroundColor: '#f8f9fa',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease',
                                                borderRadius: '0.375rem'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.borderColor = wellsFargoTheme.colors.primary;
                                                e.currentTarget.style.backgroundColor = '#f0f0f0';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.borderColor = wellsFargoTheme.colors.border;
                                                e.currentTarget.style.backgroundColor = '#f8f9fa';
                                            }}
                                        >
                                            <div className="d-flex align-items-center justify-content-center">
                                                <svg width="32" height="32" fill={wellsFargoTheme.colors.primary} className="bi bi-cloud-upload me-3" viewBox="0 0 16 16">
                                                    <path fillRule="evenodd" d="M4.406 1.342A5.53 5.53 0 0 1 8 0c2.69 0 4.923 2 5.166 4.579C14.758 4.804 16 6.137 16 7.773 16 9.569 14.502 11 12.687 11H10a.5.5 0 0 1 0-1h2.688C13.979 10 15 8.988 15 7.773c0-1.216-1.02-2.228-2.313-2.228h-.5v-.5C12.188 2.825 10.328 1 8 1a4.53 4.53 0 0 0-2.941 1.1c-.757.652-1.153 1.438-1.153 2.055v.448l-.445.049C2.064 4.805 1 5.952 1 7.318 1 8.785 2.23 10 3.781 10H6a.5.5 0 0 1 0 1H3.781C1.708 11 0 9.366 0 7.318c0-1.763 1.266-3.223 2.942-3.593.143-.863.698-1.723 1.464-2.383" />
                                                    <path fillRule="evenodd" d="M7.646 4.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 5.707V14.5a.5.5 0 0 1-1 0V5.707L5.354 7.854a.5.5 0 1 1-.708-.708z" />
                                                </svg>
                                                <div style={{ color: wellsFargoTheme.colors.text, fontSize: '1.1rem' }}>
                                                    {zipUploaded ? (
                                                        <span style={{ color: wellsFargoTheme.colors.success, fontWeight: 'bold' }}>
                                                            ✓ ZIP file uploaded successfully
                                                        </span>
                                                    ) : (
                                                        <span style={{ fontWeight: '500' }}>Upload ZIP File</span>
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

                {/* Action Button */}
                <div className="mb-4">
                    <button
                        onClick={handleGenerateReport}
                        disabled={!zipUploaded || loading}
                        className="btn btn-lg px-4"
                        style={{
                            backgroundColor: wellsFargoTheme.colors.primary,
                            borderColor: wellsFargoTheme.colors.primary,
                            color: 'white',
                            height: '50px',
                            fontSize: '1.1rem'
                        }}
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
                <div className="mt-4">
                    <div className="card">
                        <div className="card-header" style={{ backgroundColor: wellsFargoTheme.colors.background }}>
                            <h5 className="mb-0" style={{ color: wellsFargoTheme.colors.text }}>
                                📁 ZIP File Contents
                            </h5>
                        </div>
                        <div className="card-body">
                            {result.zipContents.folders.length > 0 ? (
                                <div>
                                    {result.zipContents.folders.map((folder, index) => (
                                        <div key={index} className="mb-3">
                                            <strong style={{ color: wellsFargoTheme.colors.primary }}>
                                                📂 {folder.name}
                                            </strong>
                                            {folder.contents.length > 0 && (
                                                <ul className="ms-3 mt-2">
                                                    {folder.contents.map((file, idx) => (
                                                        <li key={idx} style={{ color: wellsFargoTheme.colors.text }}>
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
                </div>
            )}

            {/* Generated Report Display */}
            {showReport && report && report.length > 0 && (
                <div className="mt-4">
                    <div className="card">
                        <div className="card-header d-flex justify-content-between align-items-center"
                            style={{ backgroundColor: wellsFargoTheme.colors.background }}>
                            <h2 style={{ color: wellsFargoTheme.colors.text }}>Generated Report</h2>
                            <div className="d-flex gap-3">
                                <button
                                    onClick={toggleViewMode}
                                    className="btn"
                                    style={{
                                        backgroundColor: wellsFargoTheme.colors.secondary,
                                        borderColor: wellsFargoTheme.colors.secondary,
                                        color: '#333'
                                    }}
                                >
                                    {viewMode === 'cards' ? 'Table View' : 'Card View'}
                                </button>
                                <button
                                    onClick={downloadExcel}
                                    className="btn"
                                    style={{
                                        backgroundColor: wellsFargoTheme.colors.success,
                                        borderColor: wellsFargoTheme.colors.success,
                                        color: 'white'
                                    }}
                                >
                                    Download Excel
                                </button>
                                <button
                                    onClick={startOver}
                                    className="btn"
                                    style={{
                                        backgroundColor: wellsFargoTheme.colors.danger,
                                        borderColor: wellsFargoTheme.colors.danger,
                                        color: 'white'
                                    }}
                                >
                                    Start Over
                                </button>
                            </div>
                        </div>
                        <div className="card-body p-0">
                            {viewMode === 'table' ? (
                                <div className="table-responsive">
                                    <table className="table table-hover mb-0">
                                        <thead style={{ backgroundColor: wellsFargoTheme.colors.background }}>
                                            <tr>
                                                <th style={{ color: wellsFargoTheme.colors.text, fontWeight: 'bold' }}>Question</th>
                                                <th style={{ color: wellsFargoTheme.colors.text, fontWeight: 'bold' }}>Answer</th>
                                                <th style={{ color: wellsFargoTheme.colors.text, fontWeight: 'bold' }}>Quality</th>
                                                <th style={{ color: wellsFargoTheme.colors.text, fontWeight: 'bold' }}>Source</th>
                                                <th style={{ color: wellsFargoTheme.colors.text, fontWeight: 'bold' }}>Summary</th>
                                                <th style={{ color: wellsFargoTheme.colors.text, fontWeight: 'bold' }}>Reference</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {report.map((item, index) => (
                                                <tr key={index} style={{ borderBottom: `1px solid ${wellsFargoTheme.colors.border}` }}>
                                                    <td style={{
                                                        color: wellsFargoTheme.colors.text,
                                                        maxWidth: '400px',
                                                        wordWrap: 'break-word'
                                                    }}>
                                                        <strong>Q: </strong>{item.question}
                                                    </td>
                                                    <td>
                                                        <span style={getAnswerBadgeStyle(item.answer)}>
                                                            {item.answer}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span style={getQualityBadgeStyle(item.quality)}>
                                                            {item.quality}
                                                        </span>
                                                    </td>
                                                    <td style={{ color: wellsFargoTheme.colors.text }}>
                                                        {item.source}
                                                    </td>
                                                    <td style={{
                                                        color: wellsFargoTheme.colors.text,
                                                        maxWidth: '300px',
                                                        wordWrap: 'break-word'
                                                    }}>
                                                        {item.summary}
                                                    </td>
                                                    <td style={{ color: wellsFargoTheme.colors.text }}>
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
                                        <div key={index} className="card mb-3" style={{ borderColor: wellsFargoTheme.colors.border }}>
                                            <div className="card-body">
                                                <h5 className="card-title" style={{ color: wellsFargoTheme.colors.text }}>
                                                    Q: {item.question}
                                                </h5>
                                                <div className="table-responsive">
                                                    <table className="table table-borderless">
                                                        <tbody>
                                                            <tr>
                                                                <td className="fw-bold" style={{ color: wellsFargoTheme.colors.text }}>Answer:</td>
                                                                <td>
                                                                    <span style={getAnswerBadgeStyle(item.answer)}>
                                                                        {item.answer}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td className="fw-bold" style={{ color: wellsFargoTheme.colors.text }}>Quality:</td>
                                                                <td>
                                                                    <span style={getQualityBadgeStyle(item.quality)}>
                                                                        {item.quality}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td className="fw-bold" style={{ color: wellsFargoTheme.colors.text }}>Source:</td>
                                                                <td style={{ color: wellsFargoTheme.colors.text }}>{item.source}</td>
                                                            </tr>
                                                            <tr>
                                                                <td className="fw-bold" style={{ color: wellsFargoTheme.colors.text }}>Summary:</td>
                                                                <td style={{ color: wellsFargoTheme.colors.text }}>{item.summary}</td>
                                                            </tr>
                                                            <tr>
                                                                <td className="fw-bold" style={{ color: wellsFargoTheme.colors.text }}>Reference:</td>
                                                                <td style={{ color: wellsFargoTheme.colors.text }}>{item.reference}</td>
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
                </div>
            )}
        </div>
    );
};

export default App;