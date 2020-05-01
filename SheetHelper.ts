/**
 * Класс для инкапсуляции работы с Google Spreadsheet.
 */
class SheetHelper {
    constructor() {
        this.spreadsheet = SpreadsheetApp.getActive();
    }

    private readonly spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet;

    /**
     * Проверить, есть ли пользователь с данным VkId в базе.
     * @param userId Идентификатор пользователя.
     */
    public checkIfVkIdExists(userId: number): boolean {
        const vkids = this.spreadsheet.getRangeByName(RangeNames.VkIds)?.getValues();
        const result = !!vkids?.some(cell => cell[0].toString() == userId);
        return result;
    }
  
    /**
     * Установить флаг открытия двери в TRUE.
     * @param value Новое состояние.
     */
    public setOpenDoorFlag(value: boolean): void {
        this.spreadsheet.getRangeByName(CellNames.OpenDoorFlag)?.setValue(value);
    }

    /**
     * Получить значение флага открытия двери.
     */
    public getOpenDoorFlag(): boolean {
        this.haltCache();
        return this.getCellValueByName(CellNames.OpenDoorFlag);
    }


    /**
     * Обновить флаг последнего обновления списка членов клуба.
     */
    public refrashLastUpdatedFlag(): void {
        this.spreadsheet.getRange(CellNames.LastUpdated).setValue(new Date().toISOString());
    }

    /**
     * Получить дату последнего обновления списка членов клуба.
     */
    public getLastUpdatedValue(): string {
        return this.getCellValueByName(CellNames.LastUpdated);
    };


    /**
     * Добавить запись в лог.
     * @param dateTime Дата и время операции.
     * @param logLevel Уровень логгирования.
     * @param traceColorHex Шестнадцатеричный RGB-код цвета без '#'.
     * @param sourceName Имя источника сообщения.
     * @param eventName Тип сообщения.
     * @param details Подробная информация.
     */
    public addRowToLogSheet(dateTime: Date, traceColorHex: string, sourceName: string, logLevel: LogLevel, eventName: string, details?: string): void {
        const logSheet = this.spreadsheet.getSheetByName(SheetNames.Logs);
        if (!logSheet) {
            throw `Sheet '${SheetNames.Logs}' not found!`;
        }

        const lock = LockService.getScriptLock();
        lock.tryLock(20000);
        logSheet.insertRowAfter(1);
        logSheet.getRange(2, 1, 1, 6).setValues([[dateTime, traceColorHex, sourceName, logLevel, eventName, details]])
        logSheet.getRange(2, 2).setBackground(traceColorHex);
        lock.releaseLock();
    }

    /**
     * Получить количество строк в таблице лога.
     */
    public getLogEntriesCount(): number {
        return this.spreadsheet.getSheetByName(SheetNames.Logs)?.getLastRow() ?? 0
    }

    /**
     * Удалить последние rowsToDelete строк таблицы лога.
     * @param rowsToDelete Количество удаляемых строк.
     */
    public deleteOldLogs(rowsToDelete: number): void {
        this.spreadsheet.getSheetByName(SheetNames.Logs)?.deleteRows(2, rowsToDelete);
    }
    

    /**
     * Получить имя значение ячейки "LogLevel".
     */
    public getLogLevelValue(): string {
        return this.getCellValueByName(CellNames.LogLevel);
    };

    /**
     * Получить значения строк таблицы "Staff" без заголовков.
     */
    public getStaffRows(): any[][] {
        const sheet = this.spreadsheet.getSheetByName(SheetNames.Staff);
        if (!sheet) {
            throw `Sheet '${SheetNames.Staff}' not found!`;
        }

        return sheet.getRange(2, 0, sheet.getLastRow()).getValues();
    }


    /**
     * Получить диапазон по названию.
     * @param name Назваие именованного диапазона.
     */
    public getRangeByName(name: string): GoogleAppsScript.Spreadsheet.Range {
        var range = this.spreadsheet.getRangeByName(name);
        if (!range) {
            throw `Sheet '${name}' not found!`;
        }

        return range;
    }

    /**
     * Получить значение ячейки по названию.
     * @param name Название именованной ячейки. 
     */
    private getCellValueByName(name: string): any {
        const cell = this.getRangeByName(name);
        if (!cell) {
            throw `Cell '${name}' not found!`;
        }

        return cell.getValue();
    }

    /**
     * Сбросить кэш значений ячеек обновлением содержимого одной из них.
     */
    private haltCache(): void {
        const cell = this.getRangeByName(CellNames.TempCacheHaltCell);
        cell?.setValue(Math.random());
    }
}