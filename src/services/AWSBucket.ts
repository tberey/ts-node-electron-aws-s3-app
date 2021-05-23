import { Rollbar } from './Rollbar';
import { SimpleTxtLogger } from './SimpleTxtLogger';
import { HelperService } from './HelperService';
import aws, { S3 } from 'aws-sdk';
import fs from 'fs';

// AWS Backing Service Class - This class is for full interactions with AWS S3 Buckets.
// This includes bucket management & S3 directory structure, and also both local & remote file management to/from S3.
export class AWSBucket {

    private AWS_S3: S3;
    private fullFileName: any;

    private txtLogger: SimpleTxtLogger;
    private rollbarLogger: Rollbar;

    // Initialise the AWS Connection and Client.
    public constructor(txtLogger: SimpleTxtLogger, rollbarLogger: Rollbar) {
        this.txtLogger = txtLogger
        this.rollbarLogger = rollbarLogger;

        aws.config.update({  region: process.env['AWS_REGION']  });
        this.AWS_S3 = new aws.S3({
            accessKeyId: process.env['AWS_ACCESS_KEY_ID'],
            secretAccessKey: process.env['AWS_SECRET_ACCESS_KEY']
        });

        this.txtLogger.writeToLogFile('Configured AWS S3.');
    }

    // S3 Bucket Infrastructure Methods: ----------------------------------------------------------------------------------------------

    // If no argument is passed, returns an array containing a list of all buckets.
    // If an argument for a bucket is passed, attempts to find and match that bucket by returning either 200 or 404.
    // Return only a 500 on an error.
    public async listOrFindBuckets(findBucket?: string): Promise< number | string[] > {
        if (findBucket) findBucket = new HelperService().bucketFormat(findBucket);
        this.txtLogger.writeToLogFile((findBucket) ? `Find bucket '${findBucket}'.` : 'List all buckets.');

        let status: number | undefined;
        let bucketFound: boolean = false;
        let bucketsArray: string[] = [];
        
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
            this.txtLogger.writeToLogFile(`Found bucket '${findBucket}'`);
            return 200;
        }
        else if (bucketsArray.length) return bucketsArray;
        this.txtLogger.writeToLogFile('No Buckets to List.');
        return 404;
    }

    // Lists all the objects in the passed bucket, which is returned in an array.
    // If a second argument of true is supplied, specifying a delete request, it will return the list in a delete paramter.
    // If there are no objects a 404 is returned, or if the bucket is not found, then returns 400. Returns a 500 on error.
    public async listOrFindObjects(bucketName: string, findObject?: string, emptyRequest?: boolean): Promise< number | string[] | S3.DeleteObjectsRequest > {
        bucketName = new HelperService().bucketFormat(bucketName);
        this.txtLogger.writeToLogFile((findObject) ? `Find object '${findObject}' in bucket '${bucketName}'.` : `List all objects in bucket '${bucketName}'.`);

        let check: number | string[] = await this.listOrFindBuckets(bucketName);

        if (check == 500) return 500;
        else if (check !== 200) {
            this.txtLogger.writeToLogFile(`Could not find Bucket '${bucketName}'. Failed to list Objects.`);
            return 400;
        }

        let status: number | undefined;
        let objectFound: boolean = false;
        let objectsArray: string[] = [];
        let params: any;
        
        await this.AWS_S3.listObjectsV2({  Bucket: bucketName  })
        .promise()
        .then(async (data: S3.ListObjectsV2Output) => {
            if (!data.Contents?.length) return;
            let helper: HelperService = new HelperService();
            this.txtLogger.writeToLogFile(`All Objects in Bucket '${bucketName}':`);

            data.Contents.forEach((val, i) => {
                if (!val.Key) return;
                this.txtLogger.writeToLogFile(`${i+1}, '${val.Key}';`);
                if (emptyRequest) return;
                else if (!findObject) objectsArray.push(`'${val.Key}'`);
                else if (findObject && helper.searchTerm(findObject) == helper.searchTerm(val.Key)) {
                    objectFound = true;
                    this.fullFileName = val.Key;
                };
            });
            
            if (emptyRequest) params = {
                Bucket: bucketName,
                Delete: {
                    Objects: data.Contents.map(({ Key }) => ({ Key }))
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

    // Empties the target bucket that is supplied as an argument, returning a 200 on success.
    // Returns either a 400 if the bucket could not be emptied, or a 500 on an error.
    public async emptyBucket(targetBucket: string): Promise<number> {
        targetBucket = new HelperService().bucketFormat(targetBucket);
        this.txtLogger.writeToLogFile(`Empty bucket '${targetBucket}'.`);

        const params: any = await this.listOrFindObjects(targetBucket, undefined, true);

        if (params == 400) {
            this.txtLogger.writeToLogFile(`Bucket does not exist. Failed to empty Bucket '${targetBucket}'.`);
            return 400;
        } else if (params == 404) {
            this.txtLogger.writeToLogFile(`Bucket already empty. Failed to empty Bucket '${targetBucket}'.`);
            return 400;
        } else if (params == 500) return 500;

        let status: number | undefined;
        
        await this.AWS_S3.deleteObjects(params)
        .promise()
        .then((data: S3.DeleteObjectsOutput) => {
            this.txtLogger.writeToLogFile(`Emptying Bucket: '${targetBucket}'`);
            data.Deleted!.forEach((val) => this.txtLogger.writeToLogFile(`Deleted, '${val.Key}';`));
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

    // Pass a bucket name to creates a new templated bucket.
    // If no bucket is passed as an argument then default bucket, specified in .env file, is passed to be created.
    // Returns 200 on request success, or 400 on duplicate bucket clonflict. Returns a 500 on error.
    public async createBucket(newBucket: string): Promise<number> {
        newBucket =  new HelperService().bucketFormat(newBucket);
        this.txtLogger.writeToLogFile(`Create bucket '${newBucket}'.`);

        let check: any = await this.listOrFindBuckets(newBucket) == 200;

        if (check == 200) {
            this.txtLogger.writeToLogFile(`Bucket '${newBucket}' already exists. Failed to create a new Bucket.`);
            return 400;
        } else if (check == 500) return 500;

        let status: number | undefined;
        const params = {
            Bucket: newBucket,
            CreateBucketConfiguration: {
                LocationConstraint: process.env['AWS_REGION']
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

    // Method to delete the bucket passed as the argument. Returns a 400 if the bucket cannot be deleted, otherwise returns 200.
    // Returns 500 on an error.
    public async deleteBucket(deleteBucket: string): Promise<number> {
        deleteBucket = new HelperService().bucketFormat(deleteBucket);
        this.txtLogger.writeToLogFile(`Delete bucket '${deleteBucket}'.`);

        let check: number | string[] | S3.DeleteObjectsRequest = await this.listOrFindObjects(deleteBucket);

        if (check == 400) {
            this.txtLogger.writeToLogFile (`Bucket does not exist. Failed to delete '${deleteBucket}'.`);
            return 400;
        } else if (check == 500) {
            return 500;
        } else if (check !== 404) {
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

    // Uploads any file to the default bucket (specified in .env), that is passed as a first argument.
    // If a bucket is passed as the optional second argument, will upload to that bucket, if it exists.
    // Returns 400 if bucket is not found, or a 200 on success. Returns 500 on an error.
    public async uploadFile(filePath: string, bucketName: string): Promise<number> {
        if (bucketName) bucketName = new HelperService().bucketFormat(bucketName);
        let file: string = filePath.substr(filePath.lastIndexOf('/')+1);
        this.txtLogger.writeToLogFile(`Upload item '${filePath}' to bucket '${bucketName}'.`);

        let check: number | string[] | S3.DeleteObjectsRequest = await this.listOrFindObjects(bucketName, file);

        if (check == 200) {
            this.txtLogger.writeToLogFile(`File already in bucket '${bucketName}'. Failed to upload '${file}'.`);
            return 400;
        } else if (check == 400) {
            this.txtLogger.writeToLogFile(`Bucket '${bucketName}' does not exist. Failed to upload '${file}'.`);
            return 400;
        } else if (check == 500) return 500;

        let status: number | undefined;
        let fsFile: fs.ReadStream = fs.createReadStream(filePath);
        

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
        bucketName = new HelperService().bucketFormat(bucketName);
        let fileExists: boolean = false;
        
        let check: number | string[] | S3.DeleteObjectsRequest = await this.listOrFindObjects(bucketName, fileName);

        if (check == 400) {
            this.txtLogger.writeToLogFile(`Bucket '${bucketName}' does not exist. Failed to download '${fileName}'.`);
            return 400;
        } else if (check == 404) {
            this.txtLogger.writeToLogFile(`'${bucketName}' does not contain '${fileName}'. Failed to download file.`);
            return 400;
        } else if (check == 500) return 500;

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
        let fsFile: fs.WriteStream = fs.createWriteStream(`downloads/${this.fullFileName}`);
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