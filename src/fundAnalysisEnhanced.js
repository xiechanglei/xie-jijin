/**
 * 基金回涨概率分析 - 增强版
 * 支持指定时间范围统计并以表格形式输出
 */
import * as cheerio from 'cheerio';
import {getHttpContent} from './http.util.js';

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


        return {
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

// 获取基金的实时数据
async function getFundBaseValue(code) {
    try {
        const content = await getHttpContent("https://fundgz.1234567.com.cn/js/" + code + ".js")
        const match = content.match(/jsonpgz\((.*)\);/)
        const params = JSON.parse(match[1]);
        if (params) {
            return {
                baseValue: parseFloat(params.dwjz),
                dailyChangePercent: parseFloat(params.gszzl),
                netValue: parseFloat(params.gsz),
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
    let result = {};
    try {
        const content = await getHttpContent("https://www.dayfund.cn/fundinfo/" + code + ".html");
        const $ = cheerio.load(content)
        const dataRows = $(" .boxList .row2");
        result = {
            lastWeek: parseFloat(dataRows.children("td:eq(2)").text()),
            lastMonth: parseFloat(dataRows.children("td:eq(3)").text()),
            lastSeason: parseFloat(dataRows.children("td:eq(4)").text()),
            lastYear: parseFloat(dataRows.children("td:eq(5)").text()),
        }
    } catch (e) {
    }
    return result;
}




export {
    getFundCurrent,
    getFundBaseValue
};