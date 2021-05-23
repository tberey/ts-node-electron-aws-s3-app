import { ServerSetup } from './ServerSetup';
import { Request, Response } from 'express';
import { DeleteObjectsRequest } from 'aws-sdk/clients/s3';

export class Server extends ServerSetup {

    public constructor(port?: string, hostname?: string, appName?: string) {
        super(port, hostname, appName);
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
            Type: ${req.protocol!.toUpperCase()},
            Status: 200.`
            );
        });

        this.router.get('/listBuckets', async (req:Request, res:Response) => {
            this.txtLogger.writeToLogFile('Request Made: GET /listBuckets');

            let data: number | string[] = await this.s3Client.listOrFindBuckets();
            if (typeof data === "number") res.status(data).send();
            else res.status(200).send(data);

            this.txtLogger.writeToLogFile(
            `Request Completed:
            GET: ${req.url},
            Host: ${req.hostname},
            IP: ${req.ip},
            Type: ${req.protocol!.toUpperCase()},
            Status: ${(typeof data === "number") ? data : 200}.`
            );
        });

        this.router.get('/findBucket', async (req:Request, res:Response) => {
            this.txtLogger.writeToLogFile('Request Made: GET /findBucket');

            let data: number | string[] = await this.s3Client.listOrFindBuckets(req.query['bucket']!.toString());
            if (typeof data === "number") res.status(data).send();
            else res.status(404).send();

            this.txtLogger.writeToLogFile(
            `Request Completed:
            GET: ${req.url},
            Host: ${req.hostname},
            IP: ${req.ip},
            Type: ${req.protocol!.toUpperCase()},
            Status: ${(typeof data === "number") ? data : 404}.`
            );
        });

        this.router.get('/listObjects', async (req:Request, res:Response) => {
            this.txtLogger.writeToLogFile('Request Made: GET /listObjects');

            let data: number | string[] | DeleteObjectsRequest = await this.s3Client.listOrFindObjects(req.query['bucket']!.toString());
            if (typeof data === "number") res.status(data).send();
            else res.status(200).send(data);

            this.txtLogger.writeToLogFile(
            `Request Completed:
            GET: ${req.url},
            Host: ${req.hostname},
            IP: ${req.ip},
            Type: ${req.protocol!.toUpperCase()},
            Status: ${(typeof data === "number") ? data : 200}.`
            );
        });

        this.router.get('/findObject', async (req:Request, res:Response) => {
            this.txtLogger.writeToLogFile('Request Made: GET /findObject');

            let data: number | string[] | DeleteObjectsRequest = await this.s3Client.listOrFindObjects(req.query['bucket']!.toString(), req.query['object']!.toString());
            if (typeof data === "number") res.status(data).send();
            else res.status(404).send();

            this.txtLogger.writeToLogFile(
            `Request Completed:
            GET: ${req.url},
            Host: ${req.hostname},
            IP: ${req.ip},
            Type: ${req.protocol!.toUpperCase()},
            Status: ${(typeof data === "number") ? data : 404}.`
            );
        });
    }

    private postRequests(): void {
        this.router.post('/createBucket', async (req:Request, res:Response) => {
            this.txtLogger.writeToLogFile('Request Made: POST /createBucket');

            let data: number = await this.s3Client.createBucket(req.body['bucket']);
            res.status(data).send();

            this.txtLogger.writeToLogFile(
            `Request Completed:
            POST: ${req.url},
            Host: ${req.hostname},
            IP: ${req.ip},
            Type: ${req.protocol!.toUpperCase()},
            Status: ${data}.`
            );
        });

        this.router.post('/uploadFile', async (req:Request, res:Response) => {
            this.txtLogger.writeToLogFile('Request Made: POST /uploadFile');
            
            let data: number = await this.s3Client.uploadFile(req.body['filePath'], req.body['bucket']);
            res.status(data).send();

            this.txtLogger.writeToLogFile(
            `Request Completed:
            POST: ${req.url},
            Host: ${req.hostname},
            IP: ${req.ip},
            Type: ${req.protocol!.toUpperCase()},
            Status: ${data}.`
            );
        });

        this.router.post('/downloadFile', async (req:Request, res:Response) => {
            this.txtLogger.writeToLogFile('Request Made: POST /downloadFile');
            
            let data: number = await this.s3Client.downloadFile(req.body['file'], req.body['bucket']);
            res.status(data).send();

            this.txtLogger.writeToLogFile(
            `Request Completed:
            POST: ${req.url},
            Host: ${req.hostname},
            IP: ${req.ip},
            Type: ${req.protocol!.toUpperCase()},
            Status: ${data}.`
            );
        });
    }

    private deleteRequests(): void {
        this.router.delete('/deleteBucket', async (req:Request, res:Response) => {
            this.txtLogger.writeToLogFile('Request Made: DEL /deleteBucket');

            let data: number = await this.s3Client.deleteBucket(req.body['bucket']);
            res.status(data).send();

            this.txtLogger.writeToLogFile(
            `Request Completed:
            DELETE: ${req.url},
            Host: ${req.hostname},
            IP: ${req.ip},
            Type: ${req.protocol!.toUpperCase()},
            Status: ${data}.`
            );
        });

        this.router.delete('/emptyBucket', async (req:Request, res:Response) => {
            this.txtLogger.writeToLogFile('Request Made: DEL /emptyBucket');

            let data: number = await this.s3Client.emptyBucket(req.body['bucket']);
            res.status(data).send();

            this.txtLogger.writeToLogFile(
            `Request Completed:
            DELETE: ${req.url},
            Host: ${req.hostname},
            IP: ${req.ip},
            Type: ${req.protocol!.toUpperCase()},
            Status: ${data}.`
            );
        });
    }
}