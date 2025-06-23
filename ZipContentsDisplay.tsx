import React from 'react';
import { Grid, GridColumn } from "@progress/kendo-react-grid";
import styles from '../assessment.module.css';

interface FileContent {
    fileName: string;
    type: string;
    extension?: string;
    fullPath?: string;
    path?: string;
}

interface ProcessedFolder {
    name: string;
    contents: FileContent[];
}

interface ZipContentsDisplayProps {
    folders: ProcessedFolder[];
}

export const ZipContentsDisplay: React.FC<ZipContentsDisplayProps> = ({ folders }) => {
    return (
        <div className={styles.card}>
            <div className={styles.cardHeader}>
                <h5 className="mb-0">ZIP File Contents</h5>
            </div>
            <div className={styles.cardBody}>
                {folders.map((folder, index) => {
                    const gridData = folder.contents.map(file => ({
                        ...file,
                        path: file.fullPath
                            ? file.fullPath.substring(folder.name.length + 1)
                            : file.fileName,
                        fileType: (
                            <span className={styles.badge}>
                                {file.type.toUpperCase()}
                            </span>
                        )
                    }));

                    return (
                        <div key={index} className="mb-4">
                            <h6 className={`${styles.folderTitle} d-flex align-items-center`}>
                                <span className="k-icon k-i-folder me-2"></span>
                                {folder.name}
                            </h6>
                            {folder.contents.length > 0 && (
                                <div className={styles.grid}>
                                    <Grid
                                        data={gridData}
                                        style={{ height: 'auto' }}
                                    >
                                        <GridColumn field="path" title="File Path" />
                                        <GridColumn field="fileType" title="Type" width="100px" />
                                    </Grid>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}; 