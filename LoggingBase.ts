class LoggingBase {
    constructor(logger: LLogger) {
        this.log = logger.getLoggerFor(this.constructor.name);
        this.log("New instance created");
    }

    protected log: LogFunc;
}