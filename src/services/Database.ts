import { Rollbar } from './Rollbar';
import { SimpleTxtLogger } from './SimpleTxtLogger';
import mysql, { Connection } from 'mysql';

export class Database {

    private dbConnection: Connection;

    private txtLogger: SimpleTxtLogger;
    private rollbarLogger: Rollbar

    public constructor(txtLogger: SimpleTxtLogger, rollbarLogger: Rollbar) {
        this.txtLogger = txtLogger;
        this.rollbarLogger = rollbarLogger;

        this.dbConnection = mysql.createConnection({
            'host': process.env['DB_HOST'],
            'user': process.env['DB_USER'],
            'password': process.env['DB_PASSWORD'],
            'database': process.env['DB_NAME']
        });
        
        this.txtLogger.writeToLogFile('Configured Database.');
        this.connect();
    }

    private connect(): void {
        this.dbConnection.connect((err) => {
            if (err) {
                this.rollbarLogger.rollbarError(err);
                this.txtLogger.writeToLogFile(err);
                return;
            }

            this.txtLogger.writeToLogFile('Database Connected.');
        });
    }

    public close(): void {
        this.dbConnection.end();
        this.dbConnection.destroy();
    }
}