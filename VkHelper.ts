class VkHelper extends LoggingBase {
    public fetchVk(method: string, parameters: { [k: string]: any | any[] }) {
        const params: { [k: string]: any | any[] } =
            { ...parameters, v: "5.103", access_token: VK_TOKEN };
        const queryString = Object.keys(params)
            .map(k => k + '=' + params[k]) // JS склеит значения через запятую, если массив
            .join('&')

        const url = `https://api.vk.com/method/${method}?${queryString}`;

        this.log(LogLevel.Debug, "Fetching data from VK", url);
        const text = UrlFetchApp.fetch(url).getContentText();
        this.log(LogLevel.Debug, "Data fetched from VK", text);

        const response = JSON.parse(text).response;

        return response;
    }

    public getUseridByScreenName(screenName: string): number {
        const response = this.fetchVk("users.get", { user_ids: screenName });
        const vkId = response[0].id;

        this.log(LogLevel.Debug, "Screen name resolved", vkId);
        return vkId;
    }
}