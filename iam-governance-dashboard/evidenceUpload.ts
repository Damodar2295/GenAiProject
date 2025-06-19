import { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient, GridFSBucket } from 'mongodb';
import fs from 'fs';

// MongoDB connection configuration
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DB || 'iam_governance';
const collection = 'iam_nha_evidence';

export const config = { api: { bodyParser: false } };

const evidenceUpload = async (req: NextApiRequest, res: NextApiResponse) => {
    logger.info({ message: 'evidence_upload calling...' });

    if (req.method === 'POST') {
        try {
            const filename = req.headers['x-filename'];
            const { name } = req.headers;
            const { createdBy } = req.headers;
            const { createdAt } = req.headers;
            const contentType = req.headers['content-type'];

            const meta = {
                name,
                createdBy,
                createdAt,
            };

            if (!filename) {
                res.status(400).send('Filename is required');
                return;
            }

            const tempFilePath = `${filename}`;
            logger.info({
                message: `evidence_upload tempFilePath...${tempFilePath}`
            });

            const writeStream = fs.createWriteStream(tempFilePath);
            logger.info({
                message: 'evidence_upload meta filed...'
            });

            let fileId;

            req.pipe(writeStream);

            writeStream.on('finish', async () => {
                try {
                    const client = new MongoClient(mongoUri);
                    await client.connect();
                    const db = client.db(dbName);
                    const bucket = new GridFSBucket(db, { bucketName: 'evidence_files' });

                    fileId = await bucket.uploadFromFile(tempFilePath, {
                        contentType,
                        metadata: { ...meta } // store file metadata
                    });

                    // Clean up temporary file
                    fs.unlink(tempFilePath, (err) => {
                        if (err) {
                            logger.error({ message: `Error deleting temporary file: ${err}` });
                        }
                    });

                    logger.info({
                        message: `evidence_upload generated fileId...${fileId}`
                    });

                    res.status(200).json({ fileId });

                    // Store evidence metadata in collection
                    const evidenceCollection = db.collection(collection);
                    await evidenceCollection.insertOne({
                        fileId,
                        filename,
                        contentType,
                        uploadedAt: new Date(),
                        uploadedBy: createdBy,
                        analysisStatus: 'pending',
                        evidenceType: 'image',
                        metadata: meta
                    });

                    await client.close();

                } catch (error) {
                    logger.error({ message: `Error: ${error}`, error });
                    res.status(500).send('Server error.');
                }
            });

            writeStream.on('data', (data) => {
                logger.info('write stream data...', data);
            });

            writeStream.on('error', (error) => {
                logger.info('something went wrong...', error);
            });

            req.pipe(writeStream);

        } catch (error) {
            logger.error({ message: `Error: ${error}`, error });
            res.status(500).send('Server error.');
        }
    } else {
        res.status(405).json({ message: 'Method not allowed' });
    }
};

// Logger utility (you'll need to implement this based on your logging setup)
const logger = {
    info: (message: any) => console.log('INFO:', message),
    error: (message: any) => console.error('ERROR:', message)
};

export default evidenceUpload; 