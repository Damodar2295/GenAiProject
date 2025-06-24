import React from 'react';
import styles from '../assessment.module.css';

interface TableRow {
    Question: string;
    Answer: string;
    Answer_Quality: string;
    Answer_Source: string;
    Summary: string;
    Reference: string;
}

interface ReportDisplayProps {
    results?: Array<{
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
    }>;
    onStartOver: () => void;
    onDownloadExcel: () => void;
    viewMode: 'table' | 'cards';
    onToggleViewMode: () => void;
}

export const ReportDisplay: React.FC<ReportDisplayProps> = ({
    results = [],
    onStartOver,
    onDownloadExcel,
    viewMode,
    onToggleViewMode
}) => {
    if (!results || results.length === 0) {
        return (
            <div className={styles.bottomSection}>
                <div className={styles.reportContainer}>
                    <div className={styles.reportHeader}>
                        <h2>Generated Report</h2>
                    </div>
                    <div className={styles.emptyState}>
                        <p>No assessment results available. Please upload evidence files and generate a report.</p>
                    </div>
                </div>
            </div>
        );
    }

    const getQualityClass = (quality: string): string => {
        const qualityMap = {
            'ADEQUATE': styles.qualityAdequate,
            'INADEQUATE': styles.qualityInadequate,
            'NEEDS_REVIEW': styles.qualityNeedsReview
        };
        return qualityMap[quality as keyof typeof qualityMap] || styles.qualityNeedsReview;
    };

    const renderTableView = () => (
        <div className={styles.tableContainer}>
            <table className={styles.reportTable}>
                <thead>
                    <tr>
                        <th>Question</th>
                        <th>Answer</th>
                        <th>Quality</th>
                        <th>Source</th>
                        <th>Summary</th>
                        <th>Reference</th>
                    </tr>
                </thead>
                <tbody>
                    {results.map((item, index) => (
                        <tr key={index}>
                            <td>{item.question}</td>
                            <td>{item.answer}</td>
                            <td>
                                <span className={`${styles.quality} ${getQualityClass(item.quality)}`}>
                                    {item.quality}
                                </span>
                            </td>
                            <td>{item.source}</td>
                            <td>{item.summary}</td>
                            <td>{item.reference}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const renderCardView = () => (
        <div className={styles.reportContent}>
            {results.map((item, index) => (
                <div key={index} className={styles.reportItem}>
                    <h3 className={styles.prompt}>Q: {item.question}</h3>
                    <div className={styles.responseTable}>
                        <table>
                            <tbody>
                                <tr>
                                    <td className={styles.label}>Answer:</td>
                                    <td>{item.answer}</td>
                                </tr>
                                <tr>
                                    <td className={styles.label}>Quality:</td>
                                    <td>
                                        <span className={`${styles.quality} ${getQualityClass(item.quality)}`}>
                                            {item.quality}
                                        </span>
                                    </td>
                                </tr>
                                <tr>
                                    <td className={styles.label}>Source:</td>
                                    <td>{item.source}</td>
                                </tr>
                                <tr>
                                    <td className={styles.label}>Summary:</td>
                                    <td>{item.summary}</td>
                                </tr>
                                <tr>
                                    <td className={styles.label}>Reference:</td>
                                    <td>{item.reference}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className={styles.bottomSection}>
            <div className={styles.reportContainer}>
                <div className={styles.reportHeader}>
                    <h2>Generated Report</h2>
                    <div className={styles.reportActions}>
                        <button
                            onClick={onToggleViewMode}
                            className={styles.viewModeButton}
                        >
                            {viewMode === 'cards' ? 'Table View' : 'Card View'}
                        </button>
                        <button
                            onClick={onDownloadExcel}
                            className={styles.downloadButton}
                        >
                            Download Excel
                        </button>
                        <button
                            onClick={onStartOver}
                            className={styles.startOverButton}
                        >
                            Start Over
                        </button>
                    </div>
                </div>
                {viewMode === 'table' ? renderTableView() : renderCardView()}
            </div>
        </div>
    );
}; 
