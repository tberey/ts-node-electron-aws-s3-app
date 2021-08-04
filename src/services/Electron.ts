import { Rollbar } from './Rollbar';
import { SimpleTxtLogger } from 'simple-txt-logger';
import { app, BrowserWindow } from 'electron';
import path from 'path';

export class Electron {

    private appWindow?: BrowserWindow;
    private width: number;
    private height: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private ejse: any; // No @types available.

    private txtLogger: SimpleTxtLogger;
    private rollbarLogger: Rollbar;

    constructor(txtLogger: SimpleTxtLogger, rollbarLogger: Rollbar) {
        this.txtLogger = txtLogger;
        this.rollbarLogger = rollbarLogger;
        
        this.ejse = require('ejs-electron');
        this.width = parseInt(process.env['ELECTRON_WIN_WIDTH'] || '400');
        this.height = parseInt(process.env['ELECTRON_WIN_HEIGHT'] || '400');

        this.listeners();

        this.txtLogger.writeToLogFile('Configured Electron.');
    }

    public async createWindow(filePath?: string): Promise<number> {
        let status = 200;

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
            this.txtLogger.writeToLogFile('Created New Electron Application Window & Loaded Script.');
        })
        .catch((err: Error) => {
            this.rollbarLogger.rollbarError(err);
            this.txtLogger.writeToLogFile(`Error reported to Rollbar: ${err}`);
            status = 500;
        });

        return status;
    }

    public async loadWindow (filePath?: string): Promise<number> {
        let status = 200;

        if (!this.appWindow) {
            this.txtLogger.writeToLogFile('No app window found.');
            return 400;
        }

        await app.whenReady()
        .then(() => {
            if (this.appWindow) this.appWindow.loadFile(filePath || '../views/index.ejs');
            this.ejse.data('viewTest', 'WORLD');
            this.txtLogger.writeToLogFile('View Loaded into Application Window. Client Ready.');
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

    public async sendSomeData(varName: string, data: string): Promise<number> {
        await this.ejse.data(varName, data);
        return 200;
    }

    public close(): void {
        this.txtLogger.writeToLogFile('Closed Electron Application.');
        this.txtLogger.close();
        app.quit();
    }
}