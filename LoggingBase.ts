class LoggingBase {
    constructor(logger: LLogger) {
        this.log = logger.getLoggerFor(this.constructor.name);
        this.log(LogLevel.Debug, "Initialized");
    }

    protected log: LogFunc;
}