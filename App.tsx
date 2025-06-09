import React, { useRef, useState } from "react";
import { ExcelProcessor } from "./utils/ExcelProcessor";
import { VendorEvidence } from "./utils/ExcelProcessor";

const App: React.FC = () => {
    const zipFileRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);
    const [vendorEvidence, setVendorEvidence] = useState<VendorEvidence[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleProcessZip = async () => {
        setError(null);
        setVendorEvidence(null);
        setLoading(true);

        const zipFile = zipFileRef.current?.files?.[0];
        if (!zipFile) {
            setError("Please select a zip file.");
            setLoading(false);
            return;
        }

        try {
            const processor = new ExcelProcessor();
            const result = await processor.processZipFile(zipFile);
            setVendorEvidence(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to process zip file.");
            console.error(err);
        }
        setLoading(false);
    };

    return (
        <div className="container mt-5">
            <h2 className="mb-4">Vendor Evidence Processor</h2>
            <div className="mb-3">
                <label className="form-label">Upload Zip File</label>
                <input
                    type="file"
                    className="form-control"
                    ref={zipFileRef}
                    accept=".zip"
                />
                <small className="form-text text-muted">
                    Upload a zip file containing vendor questionnaire (.xls) and CID folders with evidence files
                </small>
            </div>
            <button
                className="btn btn-primary"
                onClick={handleProcessZip}
                disabled={loading}
            >
                {loading ? "Processing..." : "Process Zip File"}
            </button>
            {error && (
                <div className="alert alert-danger mt-3" role="alert">
                    {error}
                </div>
            )}
            {vendorEvidence && (
                <div className="mt-4">
                    <h5>Processed Vendor Evidence</h5>
                    {vendorEvidence.map((evidence, index) => (
                        <div key={index} className="card mb-3">
                            <div className="card-header">
                                <h6 className="mb-0">CID: {evidence.cid}</h6>
                            </div>
                            <div className="card-body">
                                <h6>Design Elements:</h6>
                                <ul className="list-unstyled">
                                    {evidence.designElements.map((element, idx) => (
                                        <li key={idx} className="mb-3">
                                            <strong>{element.question}</strong>
                                            <ul>
                                                {element.subQuestions.map((subQ, subIdx) => (
                                                    <li key={subIdx}>{subQ}</li>
                                                ))}
                                            </ul>
                                        </li>
                                    ))}
                                </ul>
                                <h6>Evidence Files:</h6>
                                <ul>
                                    {evidence.evidenceFiles.map((file, idx) => (
                                        <li key={idx}>{file}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default App;