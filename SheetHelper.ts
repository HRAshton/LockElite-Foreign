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
     * Зарегистрировать запись в списке обработанных событий.
     * @param eventId Идентификатор события.
     * @returns Было ли событие уже было обработано ранее.
     */
    public registerProcessedEvent(eventId: string): boolean {
        const asyncQueueSheet = this.getSheetByName(SheetNames.ProcessedEvents);

        const values = asyncQueueSheet.getSheetValues(2, 1, asyncQueueSheet.getLastRow(), 1);
        const hasAlreadyBeenProcessed = values.some(v => v[0] === eventId);
        if (hasAlreadyBeenProcessed) {
            return true;
        }

        const lock = LockService.getDocumentLock();
        lock.waitLock(20000);

        asyncQueueSheet.appendRow([eventId]);

        lock.releaseLock();
        return false;
    }


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
        const logSheet = this.getSheetByName(SheetNames.Logs);

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
        return this.getSheetByName(SheetNames.Logs).getMaxRows();
    }

    /**
     * Удалить последние rowsToDelete строк таблицы лога.
     * @param rowsToDelete Количество удаляемых строк.
     */
    public deleteOldLogs(rowsToDelete: number): void {
        const logSheet = this.getSheetByName(SheetNames.Logs);

        if (logSheet.getMaxRows() + 1 < rowsToDelete) {
            return;
        }

        logSheet.deleteRows(logSheet.getMaxRows() - rowsToDelete, rowsToDelete);
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
        const staffSheet = this.getSheetByName(SheetNames.Staff);

        return staffSheet.getRange(2, 0, staffSheet.getLastRow()).getValues();
    }

    /**
     * 
     */
    public maintananceRanges(): void {
        const staffSheet = this.getSheetByName(SheetNames.Staff);

        if (staffSheet.getMaxRows() - 1 <= this.getRangeByName(RangeNames.PinHashes).getNumRows()
            || staffSheet.getMaxRows() - 1 <= this.getRangeByName(RangeNames.CardHashes).getNumRows()) {
            return;
        }

        staffSheet.getNamedRanges().forEach(r => {
            if (Object.keys(RangeNames).includes(r.getName())) {
                this.fixNamedRange(staffSheet, r);
            }
        });
    }


    /**
     * Отобразить всплывающее окно в таблице.
     * @param content Содержимое окна.
     * @param title Заголовок окна.
     */
    public toast(content: string, title?: string): void {
        this.spreadsheet.toast(content, title ?? '');
    }


    /**
     * Получить лист по названию.
     * @param name Назваие листа.
     */
    public getSheetByName(name: string): GoogleAppsScript.Spreadsheet.Sheet {
        var range = this.spreadsheet.getSheetByName(name);
        if (!range) {
            throw `Sheet '${name}' not found!`;
        }

        return range;
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
     * 
     * @param name 
     */
    private fixNamedRange(sheet: GoogleAppsScript.Spreadsheet.Sheet, range: GoogleAppsScript.Spreadsheet.NamedRange) {
        const startRow = range.getRange().getRow();
        const startCol = range.getRange().getColumn();
        const rowCount = sheet.getMaxRows() - 1;
        const colCount = range.getRange().getNumColumns();
        range.setRange(
            sheet.getRange(
                startRow, startCol,
                rowCount, colCount
            )
        )
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