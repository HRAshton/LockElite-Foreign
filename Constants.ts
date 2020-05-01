declare const VK_TOKEN = '';
declare const VK_CONFIRM_RESPONSE = '';
declare const WEB_SECRET = '';

declare enum LogLevel {
    Debug = "0 - Debug",
    Info = "1 - Info",
    Warning = "2 - Warning",
    Error = "3 - Error"
}

declare enum SheetNames {
    Staff = "Staff",
    Logs = "Logs"
}

declare enum RangeNames {
    VkIds = "VkIds"
}

declare enum CellNames {
    CardHashes = "CardHashes",
    LastUpdated = "LastUpdated",
    LogLevel = "LogLevel",
    OpenDoorFlag = "OpenDoorFlag",
    PinHashes = "PinHashes",
    TempCacheHaltCell = "TempCacheHaltCell"
}