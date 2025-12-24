#!/usr/bin/env node

const {colorize, getFundCurrent} = require('./src/fundAnalysisEnhanced');
const Table = require('cli-table3');
const {addCode, removeCode, getStoredCodes, setMoney, updateFundShares} = require("./src/store");
const {getCommandOptions} = require("./src/command");

/**
 * 生成综合分析报告
 */
async function generateComprehensiveReport(fundCodes) {
    if (fundCodes.length === 0) {
        console.log("当前没有任何基金代码，请使用 --add <code> 添加基金代码");
        return;
    }

    const headers = ['基金代码', '基金名称', '统计时间', '基准净值', '最新净值', '实时涨幅', '持仓份额', '盈亏金额'];
    const headerWidths = [10, 30, 12, 10, 10, 10, 15, 15];

    // 获取所有基金详情
    const fundDetails = [];
    for (const fund of fundCodes) {
        const code = fund.code;
        const shares = fund.shares || 0;
        let currentDay = await getFundCurrent(code, shares);

        // 如果基金有持仓金额但份额为0（即未计算过），则根据基准净值计算份额
        if (fund.money > 0 && fund.shares === 0 && currentDay.baseValue > 0) {
            const calculatedShares = fund.money / currentDay.baseValue;
            // Update the currentDay object with the correct shares
            currentDay.shares = calculatedShares;
            currentDay.profitLossAmount = (currentDay.netValue - currentDay.baseValue) * calculatedShares;
            // 更新存储中的份额
            updateFundShares(code, currentDay.baseValue);
        }

        fundDetails.push(currentDay);
    }
    // 使用 console.table 直接打印数据表
    const table = new Table({
        head: headers,
        colWidths: headerWidths
    });

    fundDetails.forEach(res => {
        if (res.fundName) {
            table.push([
                res.code,
                colorize(res.fundName, "cyan"),
                res.time,
                res.baseValue,
                res.netValue < res.baseValue ? colorize(res.netValue, "green") : colorize(res.netValue, "red"),
                res.dailyChangePercent >= 0 ? colorize(res.dailyChangePercent + "%", "red") : colorize(res.dailyChangePercent + "%", "green"),
                res.shares ? res.shares.toFixed(2) : "0.00",
                res.profitLossAmount ? (res.profitLossAmount >= 0 ? colorize("+" + res.profitLossAmount.toFixed(2), "red") : colorize(res.profitLossAmount.toFixed(2), "green")) : "0.00"
            ]);
        } else {
            table.push([res.code, "N/A", "N/A", "N/A", "N/A", "N/A", "N/A", "N/A"]);
        }
    })
    console.log(table.toString());
    console.log("数据来源于新浪财经，更新时间可能有延迟，仅供参考，不作为投资依据。");
}


function main() {
    const options = getCommandOptions();

    if (options.add) {
        if (options.money) {
            // 添加基金并设置持仓金额
            addCode(options.add, options.money);
        } else {
            // 添加基金但不设置持仓金额（份额默认为0）
            addCode(options.add);
        }
    }

    if (options.remove) {
        removeCode(options.remove);
    }

    if (options.set) {
        // 需要同时提供基金代码和金额
        if (!options.money) {
            console.log("错误: 使用 --set 命令时必须同时提供 --money 参数");
            console.log("用法: jijin --set <code> --money <amount>");
            process.exit(1);
        }
        setMoney(options.set, options.money);
    }

    // 显示基金信息
    generateComprehensiveReport(getStoredCodes());
}

// 运行主程序
main();