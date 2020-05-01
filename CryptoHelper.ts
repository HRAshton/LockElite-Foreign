/**
 * Хелпер для работы с криптографическими методами.
 */
class CryptoHelper {
    /**
     * Посчитать хэш строки либо числа.
     * Общий алгоритм:
     * 1. Получить коды символов в UTF-16.
     * 2. Получить Sha256 массива кодов символов.
     * 3. Получить Sha1 от результата Sha256.
     * 4. Преобразовать результат Sha1 в hex-строку.
     * @param input Строка либо число, для которой надо найти хэш.
     */
    public static getHash(input: string | number): string {
        const charCodes = input.toString().split('').map(x => x.charCodeAt(0));
        
        let bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, charCodes);
        bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_1, bytes);

        var txtHash = '';
        for (let j = 0; j < bytes.length; j++) {
            var hashVal = bytes[j];
            if (hashVal < 0)
                hashVal += 256;
            if (hashVal.toString(16).length == 1)
                txtHash += "0";
            txtHash += hashVal.toString(16);
        }

        return txtHash;
    }
}
