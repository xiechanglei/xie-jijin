/**
 * 基金回涨概率分析 - 增强版
 * 支持指定时间范围统计并以表格形式输出
 */
const cheerio = require('cheerio');
const {getHttpContent} = require('./http.util');

// 2025-12-23|3.0571|3.0571|-0.0062|-0.20%|-0.36%|-0.0110|3.0461|3.0633|2025-12-24|10:55:00
async function getFundCurrent(code, shares = 0) {
    try {
            const currentData = await getFundBaseValue(code)
            // 计算持仓盈亏
            let profitLossAmount = 0;
            // 计算持仓总额
            let profitValue = 0;
            if (shares > 0) {
                profitLossAmount = (currentData.netValue - currentData.baseValue) * shares; // 持仓盈亏金额
                profitValue = shares * currentData.netValue
            }

            const hisData = await getFundHistoryStatics(code)

            return {
                ...hisData,
                ...currentData,
                code,
                shares,
                profitValue,
                profitLossAmount // 持仓盈亏金额
            };
    } catch (e) {
        return {code, shares}
    }
}

// 获取基金的基准净值
async function getFundBaseValue(code) {
    try {
        const content = await getHttpContent("https://fundgz.1234567.com.cn/js/"+code+".js")
        const match = content.match(/jsonpgz\((.*)\);/)
        const params = JSON.parse(match[1]);
        if (params) {
            return {
                baseValue: parseFloat(params.dwjz),
                dailyChangePercent: parseFloat(params.gszzl),
                netValue:  parseFloat(params.gsz),
                time: params.gztime,
                fundName: params.name,
            };
        }
    } catch (e) {
    }
    throw new Error(`无法获取基金 ${code} 的净值数据。请检查基金代码是否正确，或稍后重试。`);
}

// 获取基金历史汇总信息
async function getFundHistoryStatics(code) {
    try {
        const content = await getHttpContent("https://www.dayfund.cn/fundinfo/" + code + ".html");
        const $ = cheerio.load(content)
        const dataRows = $(" .boxList .row2");
        return {
            lastWeek: parseFloat(dataRows.children("td:eq(2)").text()),
            lastMonth: parseFloat(dataRows.children("td:eq(3)").text()),
            lastSeason: parseFloat(dataRows.children("td:eq(4)").text()),
            lastYear: parseFloat(dataRows.children("td:eq(5)").text()),
        }
    } catch (e) {
        return {};
    }
}
module.exports = {
    getFundCurrent,
    getFundBaseValue
};