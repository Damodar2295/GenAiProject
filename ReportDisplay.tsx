import React, { useState, useEffect } from 'react';
import styles from '../assessment.module.css';
import { ButtonGroup, Button } from '@progress/kendo-react-buttons';
// Using console.log for now as logger is not available
const logger = {
    info: console.log,
    error: console.error
};

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
        controlId: string;
        designElementId: string;
        question: string;
        answer: string;
        status: 'success' | 'error';
        error?: string;
    }>;
    onStartOver: () => void;
}

export const ReportDisplay: React.FC<ReportDisplayProps> = ({ results = [], onStartOver }) => {
    const [tableData, setTableData] = useState<TableRow[]>([]);
    const [tableCols] = useState(['Question', 'Answer', 'Answer_Quality', 'Answer_Source', 'Summary', 'Reference']);
    const [viewMode, setViewMode] = useState<'table' | 'card'>('table');

    useEffect(() => {
        const rows = results.flatMap((r, i) => {
            console.log(`Raw answer for element ${i} (CID: ${r.controlId}):`, r.answer);
            logger.info(`Raw answer string [${r.designElementId}]: ${r.answer}`);

            let cleanedAnswer = r.answer?.trim() || '';
            console.log(`Initial trimmed answer [${r.designElementId}]:`, cleanedAnswer);

            if (cleanedAnswer.startsWith('"') || cleanedAnswer.startsWith('```json')) {
                cleanedAnswer = cleanedAnswer
                    .replace(/^"(?:json)?\s*/i, '')
                    .replace(/\s*"```$/, '')
                    .replace(/^```(?:json)?\s*/i, '')
                    .replace(/\s*```$/, '');
                console.log(`Cleaned answer [${r.designElementId}]:`, cleanedAnswer);
                logger.info(`Cleaned answer for ${r.designElementId}:`, { original: r.answer, cleaned: cleanedAnswer });
            }

            try {
                const parsed = JSON.parse(cleanedAnswer);
                logger.info(`Parsed answer for ${r.designElementId}:`, parsed);
                console.log(`Parsed JSON Object for ${r.designElementId}:`, parsed);

                // Handle array or single object
                const resultObjects = Array.isArray(parsed) ? parsed : [parsed];

                // Map each object to ensure all required fields are present
                return resultObjects.map(obj => ({
                    Question: r.question || obj.Question || 'No question provided',
                    Answer: obj.Answer || r.answer || 'No answer provided',
                    Answer_Quality: obj.Quality || obj.Answer_Quality || 'NEEDS_REVIEW',
                    Answer_Source: obj.Source || obj.Answer_Source || 'Not specified',
                    Summary: obj.Summary || 'No summary available',
                    Reference: obj.Reference || `Domain_Id: ${r.controlId}`
                }));
            } catch (err) {
                console.error(`❌ Failed to parse answer for ${r.designElementId}`, err);
                logger.error(`❌ Parsing error for ${r.designElementId}`, { error: err, answer: r.answer });

                // Return a fallback object with meaningful defaults
                return [{
                    Question: r.question || 'Question not available',
                    Answer: r.answer || 'Unable to parse response',
                    Answer_Quality: r.status === 'error' ? 'INADEQUATE' : 'NEEDS_REVIEW',
                    Answer_Source: r.controlId || 'Unknown source',
                    Summary: r.error || 'Failed to parse LLM response',
                    Reference: `Domain_Id: ${r.controlId}`
                }];
            }
        });

        console.log('Final processed table data:', rows);
        logger.info('Final table data processed', { rowCount: rows.length, rows });
        setTableData(rows);
    }, [results]);

    if (!results || results.length === 0) {
        return (
            <div className={styles['results-container']}>
                <h2>Assessment Report</h2>
                <div className={styles['empty-state']}>
                    <p>No assessment results available. Please upload evidence files and generate a report.</p>
                </div>
            </div>
        );
    }

    const getQualityClass = (quality: string): string => {
        switch (quality?.toUpperCase()) {
            case 'ADEQUATE':
                return styles['quality-adequate'];
            case 'INADEQUATE':
                return styles['quality-inadequate'];
            default:
                return styles['quality-needs-review'];
        }
    };

    const renderTableView = () => (
        <div className={styles['table-container']}>
            <table className={styles['assessment-table']}>
                <thead>
                    <tr>
                        {tableCols.map((col, index) => (
                            <th key={index} className={styles['table-header']}>
                                {col.replace('_', ' ')}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {tableData.map((row, rowIndex) => (
                        <tr key={rowIndex} className={styles['table-row']}>
                            {tableCols.map((col, colIndex) => (
                                <td
                                    key={`${rowIndex}-${colIndex}`}
                                    className={`${styles['table-cell']} ${col === 'Answer_Quality' ? getQualityClass(row[col as keyof TableRow]) : ''}`}
                                >
                                    {row[col as keyof TableRow] || 'N/A'}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const renderCardView = () => (
        <div className={styles['cards-container']}>
            {tableData.map((row, index) => (
                <div key={index} className={styles['result-card']}>
                    <div className={styles['card-header']}>
                        <h3>Question</h3>
                        <p>{row.Question}</p>
                    </div>
                    <div className={styles['card-content']}>
                        <div className={styles['content-row']}>
                            <strong>Answer:</strong>
                            <p>{row.Answer || 'N/A'}</p>
                        </div>
                        <div className={styles['content-row']}>
                            <strong>Quality:</strong>
                            <span className={getQualityClass(row.Answer_Quality)}>
                                {row.Answer_Quality || 'N/A'}
                            </span>
                        </div>
                        <div className={styles['content-row']}>
                            <strong>Source:</strong>
                            <p>{row.Answer_Source || 'N/A'}</p>
                        </div>
                        <div className={styles['content-row']}>
                            <strong>Summary:</strong>
                            <p>{row.Summary || 'N/A'}</p>
                        </div>
                        <div className={styles['content-row']}>
                            <strong>Reference:</strong>
                            <p>{row.Reference || 'N/A'}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className={styles['results-container']}>
            <div className={styles['results-header']}>
                <h2>Assessment Report</h2>
                <div className={styles['view-controls']}>
                    <ButtonGroup>
                        <Button
                            selected={viewMode === 'table'}
                            onClick={() => setViewMode('table')}
                        >
                            Table View
                        </Button>
                        <Button
                            selected={viewMode === 'card'}
                            onClick={() => setViewMode('card')}
                        >
                            Card View
                        </Button>
                    </ButtonGroup>
                </div>
            </div>

            {viewMode === 'table' ? renderTableView() : renderCardView()}

            <div className={styles['results-footer']}>
                <Button
                    onClick={onStartOver}
                    className={styles['start-over-button']}
                >
                    Start Over
                </Button>
            </div>
        </div>
    );
}; 
