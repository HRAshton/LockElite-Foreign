declare interface User {
    name: string;
    eliteGroup: string;
    role: string;
    vkId: number;
    pinHash: string;
    cardHash: string;
}

class Api extends LoggingBase {
    constructor (sheetHelper: SheetHelper, logger: LLogger) {
      super(logger);
      this.sheetHelper = sheetHelper;
    }

    sheetHelper: SheetHelper;

    getUserList(): User[] {
        const staff = this.sheetHelper.getStaffRows();
        const models = staff.map(row => ({
            name: row[0],
            eliteGroup: row[1],
            role: row[2],
            vkId: row[3],
            pinHash: row[4],
            cardHash: row[5]
        } as User));

        return models;
    }

    getUserListUpdatedIfSince(date: string): User[] | null {
        if (this.sheetHelper.getLastUpdatedValue() === date) {
            return null;
        }

        const users = this.getUserList();
        return users;
    }

    getOpenDoorFlag(): boolean {
        const shouldBeOpened = this.sheetHelper.getOpenDoorFlag();
        return shouldBeOpened;
    }

    getOpenDoorFlagWhenUpdated(): boolean {
        const initTimeMs = (new Date()).getTime()
        while (new Date().getTime() - initTimeMs < 25000) {
            if (this.getOpenDoorFlag()) {
                this.sheetHelper.setOpenDoorFlag(false);
                return true;
            }

            Utilities.sleep(500);
        }

        return false;
    }
}