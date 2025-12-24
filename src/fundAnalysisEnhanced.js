/**
 * 基金回涨概率分析 - 增强版
 * 支持指定时间范围统计并以表格形式输出
 */

const https = require('https');
const http = require('http');
const vm = require('vm');

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
                        console.warn(`无法使用 ${charset} 解码响应，尝试使用UTF-8`);
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


async function getFundCurrent(code, shares = 0) {
    try {
        const content = await getHttpContent("https://hq.sinajs.cn/list=fu_" + code, {headers: {'Referer': 'https://finance.sina.com.cn/'}});
        // the response is var hq_str_fu_018993="中欧数字经济混合发起A,09:59:00,2.9356,2.9568,2.9568,0.2733,-0.717,2025-12-16";
        const match = content.match(/var hq_str_fu_\d+="([^"]+)"/);
        if (match) {
            const data = match[1].split(',');
            const baseValue = parseFloat(data[3]);
            const netValue = parseFloat(data[2]);
            const dailyChangePercent = parseFloat(data[6]);

            // 计算持仓盈亏
            let profitLoss = 0;
            let profitLossAmount = 0;
            if (shares > 0) {
                profitLossAmount = (netValue - baseValue) * shares; // 持仓盈亏金额
                profitLoss = ((netValue - baseValue) / baseValue) * 100; // 盈亏百分比（基于基准净值）
            }

            return {
                code,
                fundName: data[0],
                time: data[1],
                baseValue,
                netValue,
                dailyChangePercent,
                shares,
                profitLossAmount, // 持仓盈亏金额
                profitLossPercent: dailyChangePercent // 日涨跌幅
            };
        } else {
            return {code, shares}
        }
    } catch (e) {
        return {code, shares}
    }
}

// 获取基金的基准净值
async function getFundBaseValue(code) {
    try {
        const content = await getHttpContent("https://hq.sinajs.cn/list=fu_" + code, {headers: {'Referer': 'https://finance.sina.com.cn/'}});
        const match = content.match(/var hq_str_fu_\d+="([^"]+)"/);
        if (match) {
            const data = match[1].split(',');
            if (data.length > 3) {
                const baseValue = parseFloat(data[3]);
                return isNaN(baseValue) ? null : baseValue;
            }
        }
        return null;
    } catch (e) {
        return null;
    }
}

module.exports = {
    colorize,
    getFundCurrent,
    getFundBaseValue
};