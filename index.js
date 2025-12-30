#!/usr/bin/env node

const {getFundCurrent} = require('./src/fundAnalysisEnhanced');
const {colorize, colorPresents, colorSub, colorNumber} = require('./src/color.out');
const Table = require('cli-table3');
const {addCode, removeCode, getStoredCodes, setMoney, updateFundShares} = require("./src/store");
const {getCommandOptions} = require("./src/command");
const {getFundDetail} = require("./src/fundDetail");
const {formatNumber} = require("./src/number");

/**
 * 生成综合分析报告
 */
async function generateComprehensiveReport(fundCodes) {
    if (fundCodes.length === 0) {
        console.log("当前没有任何基金代码，请使用 --add <code> 添加基金代码");
        return;
    }

    const headers = ['基金代码', '基金名称', '统计时间',
        // '基准净值',
        '最近一周', '最近一月', '最近一季', '最近一年',
        // '最新净值',
        '实时涨幅', '持仓份额', '当日盈亏', '持仓金额'];
    const headerWidths = [10, 30, 20,
        // 10,
        10, 10, 10, 10, 12,
        // 10,
        15, 15, 15];

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
                // res.baseValue,
                colorPresents(res.lastWeek, res.lastWeek > 0),
                colorPresents(res.lastMonth, res.lastMonth > 0),
                colorPresents(res.lastSeason, res.lastSeason > 0),
                colorPresents(res.lastYear, res.lastYear > 0),
                // res.netValue < res.baseValue ? colorize(res.netValue, "green") : colorize(res.netValue, "red"),
                colorPresents(res.dailyChangePercent, res.dailyChangePercent > 0),
                res.shares ? res.shares.toFixed(2) : "0.00",
                colorSub(res.profitLossAmount, res.profitLossAmount >= 0),
                res.profitValue.toFixed(2)
            ]);
        } else {
            table.push([res.code, "N/A", "N/A", "N/A", "N/A", "N/A", "N/A", "N/A"]);
        }
    })

    // 计算总盈亏金额
    const totalProfitLoss = fundDetails.reduce((sum, res) => {
        return sum + (res.profitLossAmount || 0);
    }, 0);
    // 计算总金额
    const totalVotes = fundDetails.reduce((sum, res) => {
        return sum + (res.profitValue || 0)
    }, 0)
    // 添加汇总行
    table.push([
        {colSpan: headers.length - 2, content: colorize('总计:', 'cyan')},
        totalProfitLoss >= 0 ? colorize("+" + totalProfitLoss.toFixed(2), "red") : colorize(totalProfitLoss.toFixed(2), "green"),
        totalVotes.toFixed(2)
    ]);

    console.log(table.toString());
    console.log("数据来源于新浪财经，更新时间可能有延迟，仅供参考，不作为投资依据。");
}


async function watchFund(code, top) {
   try {
       const data = await getFundDetail(code, top)
       // f2 最新价  f3涨跌幅百分比 f4 涨跌价格 f5 成交量 f6 成交额 f7 振幅 f8 换手率  f9 动态市盈率  f10 量比  f12 股票代码  f14 股票名称 f15 最高  f16 最低 F17 开盘价格  f18 昨天收盘价格
       const head = ['股票代码', '股票名称', '开盘价格', '昨日收盘价', '最低价', '最高价格', '当前价格', '涨跌幅', '成交量', '成交额', '换手率', '动态市盈率', '量比', '振幅'];
       const colWidths = [10, 15, 10, 12, 10, 10, 10, 10, 10, 10, 10, 12, 10, 10]
       const table = new Table({head, colWidths});
       data.diff.forEach((row) => {
           table.push([row.f12,
                   row.f14,
                   colorNumber(row.f17, row.f17 > row.f18),
                   row.f18.toFixed(2),
                   colorNumber(row.f16, row.f16 > row.f18),
                   colorNumber(row.f15, row.f15 > row.f18),
                   colorNumber(row.f2, row.f2 > row.f18),
                   colorPresents(row.f3, row.f3 > 0),
                   formatNumber(row.f5),
                   formatNumber(row.f6),
                   row.f8 + "%",
                   colorSub(row.f9),
                   colorNumber(row.f10, row.f10 > 1),
                   row.f7 + "%"
               ]
           );
       })
       //clear the screen
       console.clear()
       console.log("数据获取时间:", new Date().toLocaleString());
       console.log(table.toString());
   }catch (e){}
}


async function main() {
    const options = getCommandOptions();
    if (options.watch) {
        setInterval(() => {
                watchFund(options.watch, options.top)
        }, 10 * 1000)
        return;
    }


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