// 当日板块资金流数据
const today = "/api/plate-funds-flow/today"
// 近5日板块资金流数据
const fiveDay = "/api/plate-funds-flow/fiveDay"
// 近10日块资金流数据
const tenDay = "/api/plate-funds-flow/tenDay"

/**
 * 股票板块资金流数据管理器
 */
export class PlateFundManager {
    fiveDayData = [] // 近5日
    tenDayData = [] // 近10日
    todayData = []

    // 当日
    constructor() {
        this.load();
    }

    async load() {
        // 加载数据，并且开启自动刷新当日数据的功能
        await this.loadFiveDayData()
        await this.loadTenDayData()
        await this.loadTodayData()
    }

    async loadFiveDayData() {
        const data = await fetch(fiveDay).then(res => res.json());
    }

    async loadTenDayData() {


    }

    async loadTodayData() {

    }
}