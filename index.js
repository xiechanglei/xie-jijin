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
    for (let i = 0; i < fundCodes.length; i++) {
        const fund = fundCodes[i];
        const code = fund.code;
        const shares = fund.shares || 0;

        // 显示当前正在获取的基金信息
        process.stdout.write(`\r正在获取基金 ${code} 的信息... (${i + 1}/${fundCodes.length})`);

        let currentDay = await getFundCurrent(code, shares);

        // 确保使用存储中的份额，而不是getFundCurrent函数中的份额
        // 因为份额是在添加时根据当时的基准净值计算的
        currentDay.shares = fund.shares || 0;
        currentDay.profitLossAmount = (currentDay.netValue - currentDay.baseValue) * currentDay.shares;

        fundDetails.push(currentDay);
    }

    // 清空进度信息
    process.stdout.write('\r\x1b[K'); // 清除当前行
    // 使用 console.table 直接打印数据表
    const table = new Table({
        head: headers,
        colWidths: headerWidths
    });

    // 按份额倒序排列
    fundDetails.sort((a, b) => (b.shares || 0) - (a.shares || 0));

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

    // 计算总盈亏金额
    const totalProfitLoss = fundDetails.reduce((sum, res) => {
        return sum + (res.profitLossAmount || 0);
    }, 0);

    // 添加汇总行
    table.push([
        {colSpan: 7, content: colorize('总盈亏:', 'cyan')},
        totalProfitLoss >= 0 ? colorize("+" + totalProfitLoss.toFixed(2), "red") : colorize(totalProfitLoss.toFixed(2), "green")
    ]);

    console.log(table.toString());
    console.log("数据来源于新浪财经，更新时间可能有延迟，仅供参考，不作为投资依据。");
}


async function main() {
    const options = getCommandOptions();

    if (options.add) {
        if (options.money) {
            // 添加基金并设置持仓金额
            try {
                await addCode(options.add, options.money);
            } catch (error) {
                console.log(`错误: ${error.message}`);
                process.exit(1);
            }
        } else {
            // 添加基金但不设置持仓金额（份额默认为0）
            await addCode(options.add);
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

        // 检查基金代码是否存在
        const existingFunds = getStoredCodes();
        const fundExists = existingFunds.some(fund => fund.code === options.set);

        if (!fundExists) {
            console.log(`错误: 基金代码 ${options.set} 不存在，请先使用 --add 添加该基金`);
            process.exit(1);
        }

        try {
            await setMoney(options.set, options.money);
        } catch (error) {
            console.log(`错误: ${error.message}`);
            process.exit(1);
        }
    }

    // 显示基金信息
    await generateComprehensiveReport(getStoredCodes());
}

// 运行主程序
main().catch(error => {
    console.log(`程序执行出错: ${error.message}`);
    process.exit(1);
});