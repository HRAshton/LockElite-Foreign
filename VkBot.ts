declare interface VkWebMessage extends WebMessage {
    type: string;
    object: VkObject;
    secret: string;
}

declare interface VkObject {
    message: VkMessageObject;
}

declare interface VkMessageObject {
    date: number;
    text: string;
    from_id: number;
}

class VkBot extends LoggingBase {
    constructor(logger: LLogger, sheetHelper: SheetHelper, vkHelper: VkHelper) {
        super(logger);
        this.sheetHelper = sheetHelper;
        this.vkHelper = vkHelper;
    }

    private sheetHelper: SheetHelper;
    private vkHelper: VkHelper;

    public processMessage(msgObj: VkMessageObject): void {
        const timestamp = msgObj.date;
        const text = msgObj.text;
        const userId = msgObj.from_id;
        
        const isCommand = Object.entries(BotCommandsLowercased).find(v => text.toLowerCase() === v[1]);
        if (!isCommand) {
            return;
        }
        this.log(LogLevel.Info, "Command received", text);

        const successful = this.sheetHelper.checkIfVkIdExists(userId);
        this.log(LogLevel.Debug, "Access check", `${successful ? "granted" : "denied"} for ${userId}`);
        if (!successful) {
            this.sendMessage(userId, "Вы не зарегистрированы. Обратитесь к Вашему куратору.", timestamp);
            this.log(LogLevel.Warning, "Access denied", userId.toString());
            return;
        }

        this.sendMessage(userId, "Дверь успешно открыта.", timestamp);
        this.sheetHelper.setOpenDoorFlag(true);
        return;
    }

    
    private sendMessage(target_id: number, text: string, randomId: number): void {
        this.log(LogLevel.Debug, "Sending message", JSON.stringify([target_id, text, randomId]));
        this.vkHelper.fetchVk("messages.send", { peer_id: target_id, message: text, random_id: (randomId ? randomId : Math.random()) });
    }
}