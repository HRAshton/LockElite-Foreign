declare type LogFunc = (logLevel: LogLevel, eventName: string, details?: string) => void;

class LLogger {
    constructor(sheetHelper: SheetHelper) {
        this.sheetHelper = sheetHelper;
        this.traceColorHex = '#' +
            [Math.round(Math.random() * 255), Math.round(Math.random() * 255), Math.round(Math.random() * 255)]
                .map(x => x.toString(16))
                .join('')
                .toUpperCase();
        this.logLevel = this.sheetHelper.getLogLevelValue() as LogLevel;

        this.log(LLogger.name, LogLevel.Debug, "Initialized", JSON.stringify([this.traceColorHex, this.logLevel]));
    }

    private readonly MaxLogSize: number = 30000;
    private readonly DeletingPart: number = 0.1;
    private readonly sheetHelper: SheetHelper;

    private readonly traceColorHex: string;
    private readonly logLevel: LogLevel;

    getLoggerFor(sourceName: string): LogFunc {
        return (l, e, d) => this.log(sourceName, l, e, d);
    }

    maintenance(): void {
        if (this.sheetHelper.getLogEntriesCount() < this.MaxLogSize) {
            return;
        }
        
        const rowsToDelete = this.MaxLogSize * this.DeletingPart;
        this.sheetHelper.deleteOldLogs(rowsToDelete);
    }

    log(sourceName: string, logLevel: LogLevel, eventName: string, details?: string): void {
        this.maintenance();
        if (this.logLevel > logLevel) {
            return;
        }
        this.sheetHelper.toast(eventName, this.logLevel);
        if (this.logLevel === LogLevel.Info) {
            this.sheetHelper.toast(eventName, this.logLevel);
        }

        this.sheetHelper.addRowToLogSheet(new Date(), this.traceColorHex, sourceName, logLevel, eventName, details);
    }
}