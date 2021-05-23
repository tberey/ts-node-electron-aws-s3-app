import fs from 'fs';

export class SimpleTxtLogger {

    private txtLogger: fs.WriteStream;

    public constructor(appName?: string, tag?: string, fileName?: string) {
        if (!fs.existsSync('logs')) fs.mkdirSync('logs');
        this.txtLogger = fs.createWriteStream(`logs/[${tag}]${fileName || this.newDateTime()}.txt`);
        this.txtLogger.write(`Logs for Server-Side Application: '${appName}'\n`);
        this.writeToLogFile('Initialised Logging: SimpleTxtLogger Setup.');
    }

    public writeToLogFile(log: string | Error): void {
        this.txtLogger.write(`\n[${new Date().toLocaleString()}] ${log}`);
    }

    public writeToNewTxtFile(item: any, fileName?: string, directory: string = 'logs') : number {
        if (!fs.existsSync(directory)) fs.mkdirSync(directory)
        let newLog: fs.WriteStream = fs.createWriteStream(`${directory}/${fileName || this.newDateTime()}.txt`);
        newLog.write(`${item}`);
        newLog.end();
        newLog.destroy();
        return 200;
    }

    public newDateTime(): string {
        return new Date().toUTCString().replace(',','').replace(/[ \s]/g, '_');
    }

    public close(): void {
        this.txtLogger.destroy();
    }
}