import { Rollbar } from './Rollbar';
import { SimpleTxtLogger } from './SimpleTxtLogger';
import { app, BrowserWindow } from 'electron';
import path from 'path';

export class Electron {

    private appWindow?: BrowserWindow;
    private width: number;
    private height: number;
    private ejse: any;

    private txtLogger: SimpleTxtLogger;
    private rollbarLogger: Rollbar;

    public constructor(txtLogger: SimpleTxtLogger, rollbarLogger: Rollbar) {
        this.txtLogger = txtLogger
        this.rollbarLogger = rollbarLogger;
        
        this.ejse = require('ejs-electron');
        this.width = +process.env['ELECTRON_WIN_WIDTH']!;
        this.height = +process.env['ELECTRON_WIN_HEIGHT']!;

        this.listeners();

        this.txtLogger.writeToLogFile('Started Electron Application.');
    }

    public async createWindow(filePath?: string): Promise<number> {
        let status:number = 200;

        await app.whenReady()
        .then(() => {
            this.appWindow = new BrowserWindow({
                width: this.width,
                height: this.height,
                webPreferences: {
                    nodeIntegration: true,
                    preload: path.join(__dirname, filePath || 'scripts/electron.scripts.js')
                }
            });
            this.txtLogger.writeToLogFile('New app window created.');
        })
        .catch((err: Error) => {
            this.rollbarLogger.rollbarError(err);
            this.txtLogger.writeToLogFile(`Error reported to Rollbar: ${err}`);
            status = 500;
        });

        return status;
    }

    public async loadWindow (filePath?: string): Promise<number> {
        let status:number = 200;

        if (!this.appWindow) {
            this.txtLogger.writeToLogFile('No app window found.');
            return 400;
        }

        await app.whenReady()
        .then(() => {
            if (this.appWindow) this.appWindow.loadFile(filePath || '../views/index.ejs');
            this.ejse.data('viewTest', 'WORLD');
            this.txtLogger.writeToLogFile('View loaded into app window.');
        })
        .catch((err: Error) => {
            this.rollbarLogger.rollbarError(err);
            this.txtLogger.writeToLogFile(`Error reported to Rollbar: ${err}`);
            status = 500;
        });

        return status;
    }

    private listeners(): void {
        app.on('window-all-closed', () => {
            this.close();
        });
        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) this.loadWindow();
        });
    }

    public async sendSomeData(varName: string, data: any): Promise<number> {
        await this.ejse.data(varName, data);
        return 200;
    }

    public close(): void {
        this.txtLogger.writeToLogFile('Closed Electron Application.');
        this.txtLogger.close();
        app.quit();
    }
}