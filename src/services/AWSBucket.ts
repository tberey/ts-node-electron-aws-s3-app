import { Rollbar } from './Rollbar';
import { SimpleTxtLogger } from 'simple-txt-logger';
import { HelperService } from './HelperService';
import aws, { S3 } from 'aws-sdk';
import fs from 'fs';

// AWS Backing Service Class - This class is for full interactions with AWS S3 Buckets.
// This includes bucket management & S3 directory structure, and also both local & remote file management to/from S3.
export class AWSBucket {

    private AWS_S3: S3;
    private fullFileName: string;

    private txtLogger: SimpleTxtLogger;
    private rollbarLogger: Rollbar;

    // Initialize the AWS Connection and Client.
    constructor(txtLogger: SimpleTxtLogger, rollbarLogger: Rollbar) {
        this.txtLogger = txtLogger;
        this.rollbarLogger = rollbarLogger;

        this.fullFileName = '';

        aws.config.update({  region: process.env['AWS_REGION']  });
        this.AWS_S3 = new aws.S3({
            accessKeyId: process.env['AWS_ACCESS_KEY_ID'],
            secretAccessKey: process.env['AWS_SECRET_ACCESS_KEY']
        });

        this.txtLogger.writeToLogFile('Configured AWS S3.');
    }

    // S3 Bucket Infrastructure Methods: ----------------------------------------------------------------------------------------------

    public async listOrFindBuckets(findBucket?: string): Promise< number | string[] > {
        if (findBucket) findBucket = HelperService.bucketFormat(findBucket);
        this.txtLogger.writeToLogFile((findBucket) ? `Find bucket '${findBucket}'.` : 'List all buckets.');

        let status: number | undefined;
        let bucketFound = false;
        const bucketsArray: string[] = [];
        
        await this.AWS_S3.listBuckets()
        .promise()
        .then((data: S3.ListBucketsOutput) => {
            if (!data.Buckets?.length) return;

            this.txtLogger.writeToLogFile('All Buckets:');
            
            data.Buckets.forEach((val, i) => {
                if (!val.Name) return;
                this.txtLogger.writeToLogFile(`${i+1}, '${val.Name}';`);
                if (!findBucket) bucketsArray.push(val.Name);
                else if (findBucket && findBucket == val.Name) bucketFound = true;
            });
        })
        .catch((err: Error) => {
            this.rollbarLogger.rollbarError(err);
            this.txtLogger.writeToLogFile(`Error reported to Rollbar: ${err}`);
            status = 500;
        });

        if (status) return status;
        else if (bucketFound) {
            this.txtLogger.writeToLogFile(`Found bucket '${findBucket}'.`);
            return 200;
        }
        else if (bucketsArray.length) return bucketsArray;
        findBucket ? this.txtLogger.writeToLogFile('Bucket Not Found.') : this.txtLogger.writeToLogFile('No Buckets to List.');
        return 404;
    }

    public async listOrFindObjects(bucketName: string, findObject?: string, emptyRequest?: boolean): Promise< number | string[] | S3.DeleteObjectsRequest > {
        bucketName = HelperService.bucketFormat(bucketName);
        this.txtLogger.writeToLogFile((findObject) ? `Find object '${findObject}' in bucket '${bucketName}'.` : `List all objects in bucket '${bucketName}'.`);

        const result: number | string[] = await this.listOrFindBuckets(bucketName);
        const objectsArray: string[] = [];

        if (result == 500) return 500;
        else if (result !== 200) {
            this.txtLogger.writeToLogFile(`Could not find Bucket '${bucketName}'. Failed to list Objects.`);
            return 400;
        }

        let status: number | undefined;
        let objectFound = false;
        let params: S3.DeleteObjectsRequest = {
            "Bucket": bucketName,
            "Delete": {
                "Objects": [ { "Key": '' } ]
            }
        };
        
        await this.AWS_S3.listObjectsV2({  Bucket: bucketName  })
        .promise()
        .then(async (data: S3.ListObjectsV2Output) => {
            if (!data.Contents?.length) return;
            this.txtLogger.writeToLogFile(`All Objects in Bucket '${bucketName}':`);

            data.Contents.forEach((val, i) => {
                if (!val.Key) return;
                this.txtLogger.writeToLogFile(`${i+1}, '${val.Key}';`);
                if (emptyRequest) return;
                else if (!findObject) objectsArray.push(`'${val.Key}'`);
                else if (findObject && HelperService.searchTerm(findObject) == HelperService.searchTerm(val.Key.toString())) {
                    objectFound = true;
                    this.fullFileName = val.Key.toString();
                }
            });

            if (emptyRequest) params = {
                "Bucket": bucketName,
                "Delete": {
                    "Objects": data.Contents.map((key) => ({ "Key": key['Key'] || 'ERROR'}))
                }
            }
        })
        .catch((err: Error) => {
            this.rollbarLogger.rollbarError(err);
            this.txtLogger.writeToLogFile(`Error reported to Rollbar: ${err}`);
            status = 500;
        });

        if (status) return status;
        else if (objectFound) {
            this.txtLogger.writeToLogFile(`Found object '${findObject}'`);
            return 200;
        }
        else if (emptyRequest) return params;
        else if (objectsArray.length) return objectsArray;
        else if (!findObject) this.txtLogger.writeToLogFile(`No Objects in Bucket '${bucketName}'.`);
        return 404;
    }

    public async emptyBucket(targetBucket: string): Promise<number> {
        targetBucket = HelperService.bucketFormat(targetBucket);
        this.txtLogger.writeToLogFile(`Empty bucket '${targetBucket}'.`);

        const params: number | S3.DeleteObjectsRequest | string[] = await this.listOrFindObjects(targetBucket, undefined, true);
        if (params == 400) {
            this.txtLogger.writeToLogFile(`Bucket does not exist. Failed to empty Bucket '${targetBucket}'.`);
            return 400;
        } else if (params == 404) {
            this.txtLogger.writeToLogFile(`Bucket already empty. Failed to empty Bucket '${targetBucket}'.`);
            return 400;
        } else if (typeof params == 'number' || Array.isArray(params)) return 500;

        let status: number | undefined;
        
        await this.AWS_S3.deleteObjects(params)
        .promise()
        .then((data: S3.DeleteObjectsOutput) => {
            this.txtLogger.writeToLogFile(`Emptying Bucket: '${targetBucket}'`);
            data.Deleted?.forEach((val) => this.txtLogger.writeToLogFile(`Deleted, '${val.Key}';`));
        })
        .catch((err: Error) => {
            this.rollbarLogger.rollbarError(err);
            this.txtLogger.writeToLogFile(`Error reported to Rollbar: ${err}`);
            status = 500;
        });
        
        if (status) return status;
        this.txtLogger.writeToLogFile(`Successfully emptied Bucket '${targetBucket}'.`);
        return 200;
    }

    public async createBucket(newBucket: string): Promise<number> {
        newBucket =  HelperService.bucketFormat(newBucket);
        this.txtLogger.writeToLogFile(`Create bucket '${newBucket}'.`);

        const result: string[] | number | boolean = await this.listOrFindBuckets(newBucket) == 200;

        if (typeof result == 'number' && result == 200) {
            this.txtLogger.writeToLogFile(`Bucket '${newBucket}' already exists. Failed to create a new Bucket.`);
            return 400;
        } else if (typeof result == 'number' && result == 500) return 500;

        let status: number | undefined;
        const params: S3.CreateBucketRequest = {
            "Bucket": newBucket,
            "CreateBucketConfiguration": {
                "LocationConstraint": process.env['AWS_REGION']
            }
        };
        
        await this.AWS_S3.createBucket(params)
        .promise()
        .then(() => this.txtLogger.writeToLogFile(`Successfully created bucket '${newBucket}'.`))
        .catch((err: Error) => {
            this.rollbarLogger.rollbarError(err);
            this.txtLogger.writeToLogFile(`Error reported to Rollbar: ${err}`);
            status = 500;
        });

        if (status) return status;
        return 200;
    }

    public async deleteBucket(deleteBucket: string): Promise<number> {
        deleteBucket = HelperService.bucketFormat(deleteBucket);
        this.txtLogger.writeToLogFile(`Delete bucket '${deleteBucket}'.`);

        const result: number | string[] | S3.DeleteObjectsRequest = await this.listOrFindObjects(deleteBucket);

        if (result == 400) {
            this.txtLogger.writeToLogFile (`Bucket does not exist. Failed to delete '${deleteBucket}'.`);
            return 400;
        } else if (result == 500) {
            return 500;
        } else if (result !== 404) {
            this.txtLogger.writeToLogFile(`Bucket is not empty. Failed to delete '${deleteBucket}'.`);
            return 400;
        }

        let status: number | undefined;
        
        await this.AWS_S3.deleteBucket({  Bucket: deleteBucket  })
        .promise()
        .then(() => this.txtLogger.writeToLogFile(`Successfully deleted bucket '${deleteBucket}'`))
        .catch((err: Error) => {
            this.rollbarLogger.rollbarError(err);
            this.txtLogger.writeToLogFile(`Error reported to Rollbar: ${err}`);
            status = 500;
        });
        
        if (status) return status;
        return 200;
    }

    // S3 File Management Methods: ----------------------------------------------------------------------------------------

    public async uploadFile(filePath: string, bucketName: string): Promise<number> {
        if (bucketName) bucketName = HelperService.bucketFormat(bucketName);
        const file: string = filePath.substr(filePath.lastIndexOf('/')+1);
        this.txtLogger.writeToLogFile(`Upload item '${filePath}' to bucket '${bucketName}'.`);

        const result: number | string[] | S3.DeleteObjectsRequest = await this.listOrFindObjects(bucketName, file);

        if (result == 200) {
            this.txtLogger.writeToLogFile(`File already in bucket '${bucketName}'. Failed to upload '${file}'.`);
            return 400;
        } else if (result == 400) {
            this.txtLogger.writeToLogFile(`Bucket '${bucketName}' does not exist. Failed to upload '${file}'.`);
            return 400;
        } else if (result == 500) return 500;

        let status: number | undefined;
        const fsFile: fs.ReadStream = fs.createReadStream(filePath);

        const params: S3.PutObjectRequest = {
            Bucket: bucketName,
            Key: file,
            Body: fsFile,
            ServerSideEncryption: process.env['AWS_ENCRYPTION']
        };

        await this.AWS_S3.upload(params)
        .promise()
        .then((data: S3.ManagedUpload.SendData) => this.txtLogger.writeToLogFile(`Successfully uploaded '${data.Key}' to bucket '${data.Bucket}'`))
        .catch((err: Error) => {
            this.rollbarLogger.rollbarError(err);
            this.txtLogger.writeToLogFile(`Error reported to Rollbar: ${err}`);
            status = 500;
        })
        .finally(() => fsFile.destroy());
        
        if (status) return status;
        return 200;
    }

    public async downloadFile(fileName: string, bucketName: string): Promise<number> {
        bucketName = HelperService.bucketFormat(bucketName);
        let fileExists = false;
        
        const result: number | string[] | S3.DeleteObjectsRequest = await this.listOrFindObjects(bucketName, fileName);

        if (result == 400) {
            this.txtLogger.writeToLogFile(`Bucket '${bucketName}' does not exist. Failed to download '${fileName}'.`);
            return 400;
        } else if (result == 404) {
            this.txtLogger.writeToLogFile(`'${bucketName}' does not contain '${fileName}'. Failed to download file.`);
            return 400;
        } else if (result == 500) return 500;

        if (!fs.existsSync('downloads')) fs.mkdirSync('downloads');//('../downloads')

        if (this.fullFileName) try {
            await fs.promises.access(`downloads/${this.fullFileName}`);
            fileExists = true;
        } catch {
            this.txtLogger.writeToLogFile(`Download item '${fileName}' from bucket '${bucketName}'.`);
        }

        if (fileExists) {
            this.txtLogger.writeToLogFile(`'${this.fullFileName}' already exists locally in downloads folder. Failed to download file.`);
            return 400;
        }

        let status: number | undefined;
        const fsFile: fs.WriteStream = fs.createWriteStream(`downloads/${this.fullFileName}`);
        const params: S3.GetObjectRequest = {  Bucket: bucketName, Key: this.fullFileName  };

        await new Promise((resolve) => {
            const pipe = this.AWS_S3.getObject(params).createReadStream().pipe(fsFile);
            pipe.on('error', (err:Error) =>{
                this.rollbarLogger.rollbarError(err);
                this.txtLogger.writeToLogFile(`Error reported to Rollbar: ${err}`);
                status = 500;
                resolve(this);
                pipe.destroy();
            });

            pipe.on('close', () => {
                this.txtLogger.writeToLogFile(`Successfully downloaded '${this.fullFileName}' from bucket '${bucketName}' to './downloads'`);
                resolve(this);
                pipe.destroy();
            });
        }).finally(() => fsFile.destroy());

        if (status) return status;
        return 200;
    }
}