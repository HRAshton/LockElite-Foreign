declare type WebMessage = {
    type: string;
    secret: string;
    event_id: string;
}

function doGet(e: GoogleAppsScript.Events.DoGet): GoogleAppsScript.Content.TextOutput { return handleWebRequest(decodeURIComponent(e.queryString)) }
function doPost(e: GoogleAppsScript.Events.DoPost): GoogleAppsScript.Content.TextOutput { return handleWebRequest(e.postData.contents) }

function onSheetEdit(e: GoogleAppsScript.Events.SheetsOnEdit): void {
    const sheetHelper = new SheetHelper();
    const logger = new LLogger(sheetHelper);
    const log = logger.getLoggerFor("onSheetEdit");
    try {
        log(LogLevel.Debug, "Sheet edited", JSON.stringify(e));

        if (e.range.getSheet().getName() !== "Staff" || e.range.getLastColumn() > 6) {
            // Особые обработчики только для первой части первого листа.
            return;
        }

        sheetHelper.refrashLastUpdatedFlag();
        resolveVkLinks(sheetHelper, logger);
        hashPins(sheetHelper, logger);
        extendNamedRanges(sheetHelper);
    } catch (ex) {
        log(LogLevel.Error, "Exception", ex.toString());
    }
}


function handleWebRequest(jsonData: string): GoogleAppsScript.Content.TextOutput {
    const sheetHelper = new SheetHelper();
    const logger = new LLogger(sheetHelper);
    const log = logger.getLoggerFor("EventHandlers");
    try {
        log(LogLevel.Debug, "Data received", jsonData.toString());

        var message = JSON.parse(jsonData) as WebMessage;
        if (message.secret.substring(0, WEB_SECRET.length) !== WEB_SECRET) {
            throw "Secrets not match";
        }
        log(LogLevel.Debug, "Secrets match");

        const result = routeRequest(sheetHelper, logger, message);
        log(LogLevel.Debug, "Data calculated", result);
    } catch (ex) {
        log(LogLevel.Error, "Exception", ex.toString());
    } finally {
        return ContentService.createTextOutput('ok');
    }
}

function routeRequest(sheetHelper: SheetHelper, logger: LLogger, message: WebMessage): string {
    const log = logger.getLoggerFor("routeRequest");

    switch (message.type) {
        case "confirmation": {
            log(LogLevel.Debug, "Routed", "Confirmation");
            return VK_CONFIRM_RESPONSE;
        }

        case "message_new": {
            log(LogLevel.Debug, "Routed", "message_new");

            const hasAlreadyBeenProcessed = sheetHelper.registerProcessedEvent(message.event_id);
            if (hasAlreadyBeenProcessed) {
                return 'ok';
            }
            log(LogLevel.Debug, "New event detected", message.event_id)
            const vkBot = new VkBot(logger, sheetHelper, new VkHelper(logger));
            vkBot.processMessage((message as VkWebMessage).object.message);
            
            return "ok";
        }

        case "get_open_door_flag": {
            log(LogLevel.Debug, "Routed", "get_open_door_flag");
            const api = new Api(sheetHelper, logger);
            return api.getOpenDoorFlagWhenUpdated().toString();
        }

        case "get_users_if_updated": {
            log(LogLevel.Debug, "Routed", "get_users_if_updated");
            const api = new Api(sheetHelper, logger);
            const timestring = message.event_id;
            const result = {
                users: api.getUserListUpdatedIfSince(timestring),
                lastUpdatedValue: sheetHelper.getLastUpdatedValue()
            }
            return JSON.stringify(result) ?? "no data";
        }
    }

    throw "Not routed";
}


function resolveVkLinks(sheetHelper: SheetHelper, logger: LLogger) {
    const log = logger.getLoggerFor("EventHander");

    const vkRange = sheetHelper.getRangeByName(RangeNames.VkIds);
    if (!vkRange) {
        log(LogLevel.Error, "Not found", RangeNames.VkIds);
    }
    const rangeValues = vkRange.getValues();

    try {
        if (!rangeValues.some(v => v[0].toString().indexOf("vk.com") > -1)) {
            return;
        }
        const vkHelper = new VkHelper(logger);

        for (var rowIndex = 0; rowIndex < rangeValues.length - 1; rowIndex++) {
            if (rangeValues[rowIndex][0].toString().indexOf("vk.com") === -1) {
                continue;
            }

            const linkParts = rangeValues[rowIndex][0].split('/');
            const username = linkParts[linkParts.length - 1];
            const userId = vkHelper.getUseridByScreenName(username);
            vkRange?.getCell(rowIndex + 1, 1).setValue(userId)
        };
    } catch (ex) {
        log(LogLevel.Error, "Link cannot be resolved", ex.toString());
    }
}

function hashPins(sheetHelper: SheetHelper, logger: LLogger) {
    const log = logger.getLoggerFor("EventHander");

    const pinRange = sheetHelper.getRangeByName(RangeNames.PinHashes);
    if (!pinRange) {
        log(LogLevel.Error, "Not found. Hashing...", RangeNames.PinHashes);
    }
    const rangeValues = pinRange.getValues();

    if (!rangeValues.some(v => v[0].toString().length !== PinLength)) {
        return;
    }
    log(LogLevel.Info, "Unhashed pins found");

    for (var rowIndex = 0; rowIndex < rangeValues.length - 1; rowIndex++) {
        const stringedValue = rangeValues[rowIndex][0].toString();
        if (stringedValue.length !== PinLength) {
            continue;
        }

        const hash = CryptoHelper.getHash(stringedValue);
        pinRange?.getCell(rowIndex + 1, 1).setValue(hash);
    };
}

function extendNamedRanges(sheetHelper: SheetHelper) {
    sheetHelper.maintananceRanges();
}