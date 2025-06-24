import React, { useState } from 'react';
import styles from '../assessment.module.css';
import { Button } from '@progress/kendo-react-buttons';

interface ReportItem {
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

interface ReportDisplayProps {
    results?: ReportItem[];
    viewMode: 'card' | 'table';
}

export const ReportDisplay: React.FC<ReportDisplayProps> = ({ results = [], viewMode }) => {

    if (!results || results.length === 0) {
        return (
            <div className={styles['results-container']}>
                <h2>Generated Report</h2>
                <div className={styles['empty-state']}>
                    <p>No assessment results available. Please upload evidence files and generate a report.</p>
                </div>
            </div>
        );
    }

    const renderReportCard = (item: ReportItem) => (
        <div key={item.id} className={styles['report-card']}>
            <div className={styles['report-card-content']}>
                <div className={styles['report-field']}>
                    <div className={styles['field-label']}>Q: Artifact(s) Required:</div>
                    <div className={styles['field-value']}>{item.question}</div>
                </div>
                <div className={styles['report-field']}>
                    <div className={styles['field-label']}>Answer:</div>
                    <div className={`${styles['field-value']} ${styles[`answer-${item.answer.toLowerCase()}`]}`}>{item.answer}</div>
                </div>
                <div className={styles['report-field']}>
                    <div className={styles['field-label']}>Quality:</div>
                    <div className={`${styles['field-value']} ${styles[`quality-${item.quality.toLowerCase()}`]}`}>{item.quality}</div>
                </div>
                <div className={styles['report-field']}>
                    <div className={styles['field-label']}>Source:</div>
                    <div className={styles['field-value']}>{item.source}</div>
                </div>
                <div className={styles['report-field']}>
                    <div className={styles['field-label']}>Summary:</div>
                    <div className={styles['field-value']}>{item.summary}</div>
                </div>
                <div className={styles['report-field']}>
                    <div className={styles['field-label']}>Reference:</div>
                    <div className={styles['field-value']}>{item.reference}</div>
                </div>
            </div>
        </div>
    );

    const renderTableView = () => (
        <div className={styles['table-container']}>
            <table className={styles['assessment-table']}>
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
                    {results.map((item) => (
                        <tr key={item.id}>
                            <td>{item.question}</td>
                            <td className={styles[`answer-${item.answer.toLowerCase()}`]}>{item.answer}</td>
                            <td className={styles[`quality-${item.quality.toLowerCase()}`]}>{item.quality}</td>
                            <td>{item.source}</td>
                            <td>{item.summary}</td>
                            <td>{item.reference}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className={styles['results-container']}>
            {viewMode === 'card' ? results.map(renderReportCard) : renderTableView()}
        </div>
    );
}; 
