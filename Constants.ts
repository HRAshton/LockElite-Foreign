const VK_TOKEN = '7d9ead7edabfb0ca38c9971d8e177ef7cf1a60e025d0a0e6c5ae8f890aebc0d3a63b1cf5c4afccf43e7d8';
const VK_CONFIRM_RESPONSE = 'f02c272f';
const WEB_SECRET = 'FoLz9sltbebJXv4bbGYGKrabKIs1R1NU';

const ProcessAsyncFlag = "-processAsync";
const PinLength = 6;

enum LogLevel {
    Debug = "0 - Debug",
    Info = "1 - Info",
    Warning = "2 - Warning",
    Error = "3 - Error",
}

enum SheetNames {
    Staff = "Staff",
    Logs = "Logs",
    ProcessedEvents = "ProcessedEvents",
}

enum RangeNames {
    VkIds = "VkIds",
    PinHashes = "PinHashes",
    CardHashes = "CardHashes",
}

enum CellNames {
    LastUpdated = "LastUpdated",
    LogLevel = "LogLevel",
    OpenDoorFlag = "OpenDoorFlag",
    TempCacheHaltCell = "TempCacheHaltCell",
}

enum BotCommandsLowercased {
    Open = "открой",
    GivePin = "дай пин",
}

enum AsyncTasks {
    VkMessage = "VkMessage",
}