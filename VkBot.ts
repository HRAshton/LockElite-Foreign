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

        if (text.toLowerCase() !== "открой") {
            return;
        }

        const successful = this.sheetHelper.checkIfVkIdExists(userId);
        this.log(LogLevel.Debug, "access check", (successful ? "granted" : "denied") + " for " + userId);
        if (!successful) {
            this.sendMessage(userId, "Вы не зарегистрированы. Обратитесь к Вашему куратору.", timestamp);
            return;
        }

        this.sendMessage(userId, "Дверь успешно открыта.", timestamp);
        this.sheetHelper.setOpenDoorFlag(true);
        return;
    }

    private sendMessage(target_id: number, text: string, randomId: number) {
        var t = this.vkHelper.fetchVk("messages.send", { peer_id: target_id, message: text, random_id: (randomId ? randomId : Math.random()) });
        return t;
    }
}