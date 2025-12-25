/**
 * 基金回涨概率分析 - 增强版
 * 支持指定时间范围统计并以表格形式输出
 */

const https = require('https');
const http = require('http');
const cheerio = require('cheerio');
const {text} = require("node:stream/consumers");

/**
 * 用ANSI颜色代码美化文本
 * @param {string} text - 文本
 * @param {string} color - 颜色名称
 * @returns {string} 带颜色的文本
 */
function colorize(text, color) {
    const colors = {
        red: '\x1b[31m',
        green: '\x1b[32m',
        yellow: '\x1b[33m',
        blue: '\x1b[34m',
        magenta: '\x1b[35m',
        cyan: '\x1b[36m',
        white: '\x1b[37m',
        reset: '\x1b[0m'
    };
    return colors[color] + text + colors.reset;
}

async function getHttpContent(requestUrl, config = {}) {
    return new Promise((resolve, reject) => {
        const lib = requestUrl.startsWith('https') ? https : http;

        // 收集完整的响应数据为Buffer
        const chunks = [];
        lib.get(requestUrl, config, (res) => {
            res.on('data', (chunk) => {
                chunks.push(chunk);
            });
            res.on('end', () => {
                // 合并所有chunks成一个完整的Buffer
                const buffer = Buffer.concat(chunks);

                // 检查Content-Type头部以确定编码
                const contentType = res.headers['content-type'] || '';
                let charset = 'utf-8'; // 默认编码

                // 从Content-Type头部提取字符集
                const charsetMatch = contentType.match(/charset=(.+)$/i);
                if (charsetMatch) {
                    charset = charsetMatch[1].trim().toLowerCase();
                }

                // 如果不是UTF-8编码，需要进行转码
                let data;
                if (charset && charset !== 'utf-8' && charset !== 'utf8') {
                    // 尝试使用 iconv-lite 解码（如果已安装）
                    try {
                        // Node.js 内置的TextDecoder可以处理多种编码
                        if (typeof TextDecoder !== 'undefined') {
                            const decoder = new TextDecoder(charset, {fatal: false});
                            data = decoder.decode(buffer);
                        } else {
                            // 如果没有合适的解码器，则按UTF-8处理
                            data = buffer.toString('utf8');
                        }
                    } catch (e) {
                        // console.warn(`无法使用 ${charset} 解码响应，尝试使用UTF-8`);
                        // 如果编码转换失败，直接使用UTF-8解码
                        data = buffer.toString('utf8');
                    }
                } else {
                    // 如果是UTF-8或未指定编码，直接转换
                    data = buffer.toString('utf8');
                }
                resolve(data);
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

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
    colorize,
    getFundCurrent,
    getFundBaseValue
};