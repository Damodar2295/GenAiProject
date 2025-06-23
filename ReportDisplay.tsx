import React from 'react';
import { Grid, GridColumn } from "@progress/kendo-react-grid";
import { Button } from "@progress/kendo-react-buttons";
import styles from '../assessment.module.css';

interface ReportItem {
    question: string;
    answer: string;
    quality: string;
    source: string;
    summary: string;
    reference: string;
}

interface ReportDisplayProps {
    report: ReportItem[];
    onExportExcel: () => void;
    onStartOver: () => void;
}

export const ReportDisplay: React.FC<ReportDisplayProps> = ({
    report,
    onExportExcel,
    onStartOver
}) => {
    const reportWithBadges = report.map(item => ({
        ...item,
        answerBadge: (
            <span className={
                item.answer === 'YES' ? styles.badgeYes :
                    item.answer === 'NO' ? styles.badgeNo :
                        styles.badgePartial
            }>
                {item.answer}
            </span>
        ),
        qualityBadge: (
            <span className={
                item.quality === 'ADEQUATE' ? styles.badgeAdequate :
                    item.quality === 'INADEQUATE' ? styles.badgeInadequate :
                        styles.badgeNeedsReview
            }>
                {item.quality}
            </span>
        )
    }));

    return (
        <div className={styles.card}>
            <div className={styles.cardHeader}>
                <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Assessment Report</h5>
                    <div>
                        <Button
                            onClick={onExportExcel}
                            className={`${styles.secondaryButton} me-2`}
                        >
                            <span className="k-icon k-i-excel me-2"></span>
                            Export to Excel
                        </Button>
                        <Button
                            onClick={onStartOver}
                            className={styles.primaryButton}
                        >
                            Start Over
                        </Button>
                    </div>
                </div>
            </div>
            <div className={styles.cardBody}>
                <div className={styles.grid}>
                    <Grid
                        data={reportWithBadges}
                        style={{ height: 'auto' }}
                    >
                        <GridColumn field="question" title="Question" />
                        <GridColumn field="answerBadge" title="Answer" width="100px" />
                        <GridColumn field="qualityBadge" title="Quality" width="120px" />
                        <GridColumn field="source" title="Source" width="150px" />
                        <GridColumn field="summary" title="Summary" />
                        <GridColumn field="reference" title="Reference" width="150px" />
                    </Grid>
                </div>
            </div>
        </div>
    );
}; 