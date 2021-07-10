import { ServerSetup } from './ServerSetup';
import { Request, Response } from 'express';
import { DeleteObjectsRequest } from 'aws-sdk/clients/s3';

export class Server extends ServerSetup {

    constructor(port?: string, hostname?: string) {
        super(port, hostname);
        this.getRequests();
        this.postRequests();
        this.deleteRequests();
    }


    private getRequests(): void {
        this.router.get('/', (req:Request, res:Response) => {
            this.txtLogger.writeToLogFile('Request Made: GET /');

            res.status(200).send();

            this.txtLogger.writeToLogFile(
            `Request Completed:
            GET: ${req.url},
            Host: ${req.hostname},
            IP: ${req.ip},
            Type: ${req.protocol?.toUpperCase()},
            Status: 200.`
            );
        });

        this.router.get('/listBuckets', async (req:Request, res:Response) => {
            this.txtLogger.writeToLogFile('Request Made: GET /listBuckets');

            const data: number | string[] = await this.s3Client.listOrFindBuckets();
            if (typeof data === "number") res.status(data).send();
            else res.status(200).send(data);

            this.txtLogger.writeToLogFile(
            `Request Completed:
            GET: ${req.url},
            Host: ${req.hostname},
            IP: ${req.ip},
            Type: ${req.protocol?.toUpperCase()},
            Status: ${(typeof data === "number") ? data : 200}.`
            );
        });

        this.router.get('/findBucket', async (req:Request, res:Response) => {
            this.txtLogger.writeToLogFile('Request Made: GET /findBucket');

            const data: number | string[] = await this.s3Client.listOrFindBuckets(`${req.query['bucket']}`);
            if (typeof data === "number") res.status(data).send();
            else res.status(404).send();

            this.txtLogger.writeToLogFile(
            `Request Completed:
            GET: ${req.url},
            Host: ${req.hostname},
            IP: ${req.ip},
            Type: ${req.protocol?.toUpperCase()},
            Status: ${(typeof data === "number") ? data : 404}.`
            );
        });

        this.router.get('/listObjects', async (req:Request, res:Response) => {
            this.txtLogger.writeToLogFile('Request Made: GET /listObjects');

            const data: number | string[] | DeleteObjectsRequest = await this.s3Client.listOrFindObjects(`${req.query['bucket']}`);
            if (typeof data === "number") res.status(data).send();
            else res.status(200).send(data);

            this.txtLogger.writeToLogFile(
            `Request Completed:
            GET: ${req.url},
            Host: ${req.hostname},
            IP: ${req.ip},
            Type: ${req.protocol?.toUpperCase()},
            Status: ${(typeof data === "number") ? data : 200}.`
            );
        });

        this.router.get('/findObject', async (req:Request, res:Response) => {
            this.txtLogger.writeToLogFile('Request Made: GET /findObject');

            const data: number | string[] | DeleteObjectsRequest = await this.s3Client.listOrFindObjects(`${req.query['bucket']}`, `${req.query['object']}`);
            if (typeof data === "number") res.status(data).send();
            else res.status(404).send();

            this.txtLogger.writeToLogFile(
            `Request Completed:
            GET: ${req.url},
            Host: ${req.hostname},
            IP: ${req.ip},
            Type: ${req.protocol?.toUpperCase()},
            Status: ${(typeof data === "number") ? data : 404}.`
            );
        });
    }


    private postRequests(): void {
        this.router.post('/createBucket', async (req:Request, res:Response) => {
            this.txtLogger.writeToLogFile('Request Made: POST /createBucket');

            const data: number = await this.s3Client.createBucket(req.body['bucket']);
            res.status(data).send();

            this.txtLogger.writeToLogFile(
            `Request Completed:
            POST: ${req.url},
            Host: ${req.hostname},
            IP: ${req.ip},
            Type: ${req.protocol?.toUpperCase()},
            Status: ${data}.`
            );
        });

        this.router.post('/uploadFile', async (req:Request, res:Response) => {
            this.txtLogger.writeToLogFile('Request Made: POST /uploadFile');
            
            const data: number = await this.s3Client.uploadFile(req.body['filePath'], req.body['bucket']);
            res.status(data).send();

            this.txtLogger.writeToLogFile(
            `Request Completed:
            POST: ${req.url},
            Host: ${req.hostname},
            IP: ${req.ip},
            Type: ${req.protocol?.toUpperCase()},
            Status: ${data}.`
            );
        });

        this.router.post('/downloadFile', async (req:Request, res:Response) => {
            this.txtLogger.writeToLogFile('Request Made: POST /downloadFile');
            
            const data: number = await this.s3Client.downloadFile(req.body['file'], req.body['bucket']);
            res.status(data).send();

            this.txtLogger.writeToLogFile(
            `Request Completed:
            POST: ${req.url},
            Host: ${req.hostname},
            IP: ${req.ip},
            Type: ${req.protocol?.toUpperCase()},
            Status: ${data}.`
            );
        });
    }


    private deleteRequests(): void {
        this.router.delete('/deleteBucket', async (req:Request, res:Response) => {
            this.txtLogger.writeToLogFile('Request Made: DEL /deleteBucket');

            const data: number = await this.s3Client.deleteBucket(req.body['bucket']);
            res.status(data).send();

            this.txtLogger.writeToLogFile(
            `Request Completed:
            DELETE: ${req.url},
            Host: ${req.hostname},
            IP: ${req.ip},
            Type: ${req.protocol?.toUpperCase()},
            Status: ${data}.`
            );
        });

        this.router.delete('/emptyBucket', async (req:Request, res:Response) => {
            this.txtLogger.writeToLogFile('Request Made: DEL /emptyBucket');

            const data: number = await this.s3Client.emptyBucket(req.body['bucket']);
            res.status(data).send();

            this.txtLogger.writeToLogFile(
            `Request Completed:
            DELETE: ${req.url},
            Host: ${req.hostname},
            IP: ${req.ip},
            Type: ${req.protocol?.toUpperCase()},
            Status: ${data}.`
            );
        });
    }
}