import React from 'react';
import styles from '../assessment.module.css';

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

interface ZipContentsDisplayProps {
    folders: ProcessedFolder[];
}

export const ZipContentsDisplay: React.FC<ZipContentsDisplayProps> = ({ folders = [] }) => {
    const renderFolderContents = (folder: ProcessedFolder) => {
        return (
            <div className={styles.folderItem}>
                <div className={styles.folderName}>
                    {folder.name}
                </div>
                <ul className={styles.fileList}>
                    {folder.contents.map((file, fileIndex) => (
                        <li key={fileIndex} className={styles.fileItem}>
                            <div className={styles.fileName}>
                                {file.fileName}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        );
    };

    return (
        <div className={styles.folderStructure}>
            <h3 className={styles.folderTitle}>Zip Contents</h3>
            {folders && folders.length > 0 ? (
                folders.map((folder, index) => (
                    <div key={index}>
                        {renderFolderContents(folder)}
                    </div>
                ))
            ) : (
                <p className={styles.emptyMessage}>No files found in the zip archive.</p>
            )}
        </div>
    );
}; 
