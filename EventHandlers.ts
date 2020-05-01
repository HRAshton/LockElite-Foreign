declare type WebMessage = {
    type: string;
    secret: string;
    eventId: string;
}

function doGet(e: GoogleAppsScript.Events.DoGet) { return handleWebRequest(decodeURIComponent(e.queryString)) }
function doPost(e: GoogleAppsScript.Events.DoPost) { return handleWebRequest(e.postData.contents) }

function onSheetChange(e: GoogleAppsScript.Events.SheetsOnEdit): void {
    const sheetHelper = new SheetHelper();
    const logger = new LLogger(sheetHelper);
    
    logger.getLoggerFor("onSheetChange")(LogLevel.Debug, "Sheet chaned", JSON.stringify(e));

    if (e.range.getSheet().getName() !== "Staff" || e.range.getLastColumn() > 6) {
        // Особые обработчики только для первой части первого листа.
        return;
    }

    sheetHelper.refrashLastUpdatedFlag();
    resolveVkLinks(sheetHelper, logger);
}


function handleWebRequest(jsonData: string): GoogleAppsScript.Content.TextOutput {
    const sheetHelper = new SheetHelper();
    const logger = new LLogger(sheetHelper);

    const log = logger.getLoggerFor("EventHandlers");

    log(LogLevel.Debug, "Data received", jsonData.toString());

    try {
        var message = JSON.parse(jsonData) as WebMessage;
        if (message.secret !== WEB_SECRET) {
            throw "Secrets not match.";
        }
        log(LogLevel.Debug, "Secrets match.");

        const result = routeRequest(sheetHelper, logger, message);
        log(LogLevel.Debug, "Data calculated", result);
        return ContentService.createTextOutput(result);
    } catch (ex) {
        log(LogLevel.Debug, "Exception", jsonData + ex.toString())
        return ContentService.createTextOutput('ok');
    }
}

function routeRequest(sheetHelper: SheetHelper, logger: LLogger, message: WebMessage): string {
    const log = logger.getLoggerFor("routeRequest");

    switch (message.type) {
        case "confirmation":{
            log(LogLevel.Debug, "Routed", "Confirmation");
            return VK_CONFIRM_RESPONSE;
        }
        
        case "message_new": {
            log(LogLevel.Debug, "Routed", "message_new");
            const vkBot = new VkBot(logger, sheetHelper, new VkHelper(logger));
            const data = message as VkWebMessage;
            vkBot.processMessage(data.object.message);
            return "ok";
        }

        case "get_open_door_flag": {
            log(LogLevel.Debug, "Routed", "get_open_door_flag");
            const api = new LApi(sheetHelper, logger);
            return api.getOpenDoorFlagWhenUpdated().toString();
        }

        case "get_users_if_updated": {
            log(LogLevel.Debug, "Routed", "get_users_if_updated");
            const api = new LApi(sheetHelper, logger);
            const timestring = message.eventId;
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

    const vkRange = sheetHelper.getRangeByName("VkIds");
    if (!vkRange) {
        log(LogLevel.Debug, "RANGE VKIDS NOT FOUND!!!!!");
    }
    const rangeValues = vkRange!.getValues();

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
        log(LogLevel.Debug, "Link cannot be resolved", ex.toString());
    }
}
