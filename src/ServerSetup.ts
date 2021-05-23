import { Rollbar } from './services/Rollbar';
import { SimpleTxtLogger } from './services/SimpleTxtLogger';
import { Electron } from './services/Electron';
import { AWSBucket } from './services/AWSBucket';
import { Database } from './services/Database';
import express, { Express, Router } from 'express';
import dotenv from 'dotenv';
import http from 'http';

export class ServerSetup {

    private appName: string;
    private port: string;
    private hostname: string;
    private server: http.Server;
    protected router: Router;
    public app: Express;
    private electron: any;
    
    private dbClient: Database;
    protected s3Client: AWSBucket;

    protected txtLogger: SimpleTxtLogger;
    private rollbarLogger: Rollbar;
    
    protected constructor(port: string = '3000', hostname: string = '127.0.0.1', appName?: string) {
        dotenv.config();
        this.appName = process.env['APP_NAME'] || appName || '<App_Name>';
        this.port = process.env['PORT'] || port;
        this.hostname = process.env['HOSTNAME'] || hostname;

        this.txtLogger = new SimpleTxtLogger(this.appName, 'Server');
        this.rollbarLogger = new Rollbar(this.txtLogger, this.appName, );

        this.txtLogger.writeToLogFile('-APPLICATION STARTING-');
        
        this.router = express.Router();
        this.app = express();
        this.server = new http.Server(this.app);

        this.dbClient = new Database(this.txtLogger, this.rollbarLogger);
        this.s3Client = new AWSBucket(this.txtLogger, this.rollbarLogger);
        this.electron = new Electron(this.txtLogger, this.rollbarLogger);

        

        this.serverConfig();
        this.serverStart();
        this.electronInit();

        
        /*// TESTING: This block can be used to not run electron in the event of testing, for the deployment pipeline.
        // if (testing) return;
        const Electron2 = require('./services/Electron').Electron;
        this.electron = new Electron2(this.txtLogger, this.rollbarLogger);
        this.electronInit();*/
        
    }

    private serverConfig(): void {
        this.app.use(express.urlencoded({extended: true}));
        this.app.use(express.json());
        this.app.use(express.static('public'));
        this.app.set('view engine', 'ejs');
        this.app.use("/", this.router);
        this.txtLogger.writeToLogFile('Configured Server.');
    }

    private serverStart(): void {
        this.server.listen(parseInt(this.port), this.hostname, (): void => this.txtLogger.writeToLogFile(`Started HTTP Server: http://${this.hostname}:${this.port}`));
    }

    private async electronInit(): Promise<void> {
        await this.electron.createWindow();
        await this.electron.loadWindow();
    }

    protected shutdown(): void {
        this.txtLogger.writeToLogFile('Application Shutting Down.');
        this.dbClient.close();
        this.txtLogger.close();
        this.server.close((err?: Error) => {
            if (err) {
                this.rollbarLogger.rollbarError(err);
                this.electron.close();
                process.exit(1);
            }
            else {
                this.electron.close();
                process.exit(0);
            }
        });
        this.electron.close();
    }
}