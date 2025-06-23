import React from 'react';
import styles from '../assessment.module.css';

interface LLMAnswerResponse {
    Answer: string;
    Quality: 'ADEQUATE' | 'INADEQUATE' | 'NEEDS_REVIEW';
    Source: string;
    Summary: string;
    Reference: string;
}

interface AssessmentResult {
    controlId: string;
    designElementId: string;
    question: string;
    answer: string | LLMAnswerResponse;
    status: 'success' | 'error';
    error?: string;
}

interface ReportDisplayProps {
    results?: AssessmentResult[];
}

export const ReportDisplay: React.FC<ReportDisplayProps> = ({ results = [] }) => {
    const parseAnswer = (answer: string | LLMAnswerResponse): LLMAnswerResponse => {
        if (typeof answer === 'string') {
            try {
                return JSON.parse(answer);
            } catch (e) {
                return {
                    Answer: answer,
                    Quality: 'NEEDS_REVIEW',
                    Source: 'N/A',
                    Summary: 'Unable to parse response',
                    Reference: 'N/A'
                };
            }
        }
        return answer;
    };

    const getQualityClass = (quality: string): string => {
        switch (quality?.toUpperCase()) {
            case 'ADEQUATE':
                return styles['wf-quality-adequate'];
            case 'INADEQUATE':
                return styles['wf-quality-inadequate'];
            default:
                return styles['wf-quality-needs-review'];
        }
    };

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

    return (
        <div className={styles['results-container']}>
            <h2>Assessment Report</h2>
            {results.map((result, index) => {
                if (result.status === 'error') {
                    return (
                        <div key={index} className={`${styles['result-item']} ${styles.error}`}>
                            <div className={styles['error-banner']}>
                                Failed to generate report: {result.error || 'Unknown error'}
                            </div>
                        </div>
                    );
                }

                const parsedAnswer = parseAnswer(result.answer);

                return (
                    <div key={index} className={`${styles['result-item']} ${styles.success}`}>
                        <div className={styles['wf-assessment-card']}>
                            <div className={styles['wf-assessment-header']}>
                                <h3>Control ID: {result.controlId}</h3>
                                <div className={styles['wf-question']}>Q: {result.question}</div>
                            </div>
                            <div className={styles['result-details']}>
                                <div className={styles['wf-content-row']}>
                                    <strong>Answer:</strong>
                                    <span className={styles['wf-answer-text']}>
                                        {parsedAnswer.Answer || 'No answer provided'}
                                    </span>
                                </div>

                                <div className={styles['wf-content-row']}>
                                    <strong>Quality:</strong>
                                    <span className={getQualityClass(parsedAnswer.Quality)}>
                                        {parsedAnswer.Quality || 'NEEDS_REVIEW'}
                                    </span>
                                </div>

                                <div className={styles['wf-content-row']}>
                                    <strong>Source:</strong>
                                    <span>{parsedAnswer.Source || 'N/A'}</span>
                                </div>

                                <div className={styles['wf-content-row']}>
                                    <strong>Summary:</strong>
                                    <span>{parsedAnswer.Summary || 'No summary available'}</span>
                                </div>

                                <div className={styles['wf-content-row']}>
                                    <strong>Reference:</strong>
                                    <span>{parsedAnswer.Reference || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}; 
