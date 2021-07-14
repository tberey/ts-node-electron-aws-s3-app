import { SimpleTxtLogger } from 'simple-txt-logger';
import rollbar from 'rollbar';

export class Rollbar {

    private rollbar: rollbar;
    private txtLogger: SimpleTxtLogger;

    public constructor(txtLogger: SimpleTxtLogger, appName: string) {
        this.txtLogger = txtLogger;

        this.rollbar = new rollbar({
            accessToken: process.env['ROLLBAR_ACCESS_TOKEN'],
            captureUncaught: true,
            captureUnhandledRejections: true,
            environment: process.env['ROLLBAR_ENV']
        });

        this.rollbarInfo(`Rollbar Successfully Configured with Application: ${appName}.`);
        this.txtLogger.writeToLogFile('Initialised Logging: Rollbar Setup.');
    }

    public rollbarInfo(info:Error | string): void {
        this.rollbar.info(info);
    }

    public rollbarLog(log:Error | string): void {
        this.rollbar.log(log);
        this.txtLogger.writeToLogFile('Successfully reported log to Rollbar.');
    }

    public rollbarDebug(bug:Error | string): void {
        this.rollbar.debug(bug);
        this.txtLogger.writeToLogFile('Successfully reported bug to Rollbar.');
    }

    public rollbarWarn(warning:Error | string): void {
        this.rollbar.warning(warning);
        this.txtLogger.writeToLogFile('Successfully reported warning to Rollbar.');
    }

    public rollbarError(error:Error | string): void {
        this.rollbar.error(error);
        this.txtLogger.writeToLogFile('Successfully reported error to Rollbar.');
    }

    public rollbarCritical(critError:Error | string): void {
        this.rollbar.critical(critError);
        this.txtLogger.writeToLogFile('Successfully reported critical error to Rollbar.');
    }
}
