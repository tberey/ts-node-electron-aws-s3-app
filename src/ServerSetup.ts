import { Rollbar } from './services/Rollbar';
import { SimpleTxtLogger } from 'simple-txt-logger';
import { Electron } from './services/Electron';
import { AWSBucket } from './services/AWSBucket';
import { HelperService } from './services/HelperService';
import express, { Express, Router } from 'express';
import dotenv from 'dotenv';
import http from 'http';

export class ServerSetup {

    static appName = 'TomCo HQ';
    private port: string;
    private hostname: string;
    private server: http.Server;
    protected router: Router;
    private app: Express;
    private electron: Electron;
    
    protected s3Client: AWSBucket;

    protected txtLogger: SimpleTxtLogger;
    protected rollbarLogger: Rollbar;

    protected constructor(port = '3030', hostname = '127.0.0.1') {
        dotenv.config();

        this.port = process.env['PORT'] || port;
        this.hostname = process.env['HOSTNAME'] || hostname;

        this.txtLogger = new SimpleTxtLogger(HelperService.newDateTime(), 'Server', ServerSetup.appName);
        this.rollbarLogger = new Rollbar(this.txtLogger, ServerSetup.appName);

        this.txtLogger.writeToLogFile('...::SERVER-SIDE APPLICATION STARTING::...');

        this.router = express.Router();
        this.app = express();
        this.server = new http.Server(this.app);

        this.s3Client = new AWSBucket(this.txtLogger, this.rollbarLogger);
        this.electron = new Electron(this.txtLogger, this.rollbarLogger);

        this.serverConfig();
        this.serverStart();
        this.electronInit();

        /*// TESTING: This block can be used to not run electron in the event of testing, for the deployment pipeline.
        if (testing) return;
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
        this.server.listen(parseInt(this.port), this.hostname, () => this.txtLogger.writeToLogFile(`Started HTTP Server: http://${this.hostname}:${this.port}`));
    }

    private async electronInit(): Promise<void> {
        await this.electron.createWindow();
        await this.electron.loadWindow();
    }

    protected shutdown(): void {
        this.txtLogger.writeToLogFile('Application Shutting Down.');
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

    // Accessor needed for testing only. So property 'this.app' can remain private.
    public appAccessor(app = this.app): Express {
        return app;
    }
}