const fs = require('fs');
const userHome = require('os').homedir();
const filePath = `${userHome}/.xie_jijin.json`;

let cache_data = undefined;
// 读取存储的基金数据
const readStoredData = () => {
    if (cache_data) {
        return {data: cache_data, filePath};
    }
    let data = {};
    if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        data = JSON.parse(fileContent);
    }
    return {data, filePath};
};

// 写入基金数据到存储
const writeStoredData = (fundData) => {
    fs.writeFileSync(filePath, JSON.stringify(fundData, null, 2), 'utf-8');
    cache_data = fundData
};

const addCode = async (code, money = 0) => {
    // 添加基金代码和金额到本地存储
    console.log(`添加基金代码: ${code}, 持仓金额: ${money}`);
    const {data} = readStoredData();

    // 如果提供了金额，需要根据基准净值计算份额
    let shares = 0;
    if (money > 0) {
        // 动态导入以避免循环依赖
        const {getFundBaseValue} = require('./fundAnalysisEnhanced');
        const {baseValue} = await getFundBaseValue(code);
        shares = parseFloat(money) / baseValue;
        console.log(`基金 ${code} 基准净值: ${baseValue}, 计算份额: ${shares.toFixed(4)}`);
    }

    // 如果基金代码不存在，则添加
    if (!data[code]) {
        data[code] = {
            code: code,
            money: parseFloat(money) || 0,
            shares: shares
        };
        writeStoredData(data);
    } else {
        // 如果基金已存在，更新金额和重新计算份额
        data[code].money = parseFloat(money) || 0;
        data[code].shares = shares; // 重新计算份额
        writeStoredData(data);
    }
};

const removeCode = (code) => {
    // 从本地存储中移除基金代码
    console.log(`移除基金代码: ${code}`);
    const {data} = readStoredData();

    if (data[code]) {
        delete data[code];
        writeStoredData(data);
    }
};

const setMoney = async (code, money) => {
    // 设置指定基金的持仓金额
    console.log(`设置基金 ${code} 的持仓金额为: ${money}`);
    const {data} = readStoredData();

    // 计算份额：根据基准净值计算
    let shares = 0;
    if (money > 0) {
        // 动态导入以避免循环依赖
        const {getFundBaseValue} = require('./fundAnalysisEnhanced');
        const {baseValue} = await getFundBaseValue(code);
        if (baseValue && baseValue > 0) {
            shares = parseFloat(money) / baseValue;
            console.log(`基金 ${code} 基准净值: ${baseValue}, 计算份额: ${shares.toFixed(4)}`);
        } else {
            throw new Error(`无法获取基金 ${code} 的基准净值。请检查基金代码是否正确，或稍后重试。`);
        }
    }

    if (data[code]) {
        // 更新金额和重新计算份额
        data[code].money = parseFloat(money);
        data[code].shares = shares;
        writeStoredData(data);
    } else {
        // 如果基金不存在，添加基金记录
        data[code] = {
            code: code,
            money: parseFloat(money),
            shares: shares
        };
        writeStoredData(data);
    }
};

const getStoredCodes = () => {
    const {data} = readStoredData();
    return Object.keys(data).map(code => {
        return data[code]
    });
};

const updateFundShares = (code, baseValue) => {
    // 根据基准净值更新基金份额
    const {data} = readStoredData();

    if (data[code] && data[code].money > 0 && baseValue > 0) {
        data[code].shares = data[code].money / baseValue;
        writeStoredData(data);
    }
};

const getDateCacheKey = () => {
    return new Date().toLocaleDateString();
}

// 获取历史数据
const getHisData = (code) => {
    const {data} = readStoredData();
    if (data[code]?.hisData?.cacheKey === getDateCacheKey()) {
        return data[code].hisData.data;
    }
}

const setHisData = (code, hisdata) => {
    const {data} = readStoredData();
    if (data[code]) {
        data[code].hisData = {
            cacheKey: getDateCacheKey(),
            data: hisdata
        }
    }
    writeStoredData(data)
}

module.exports = {
    addCode,
    removeCode,
    getStoredCodes,
    setMoney,
    updateFundShares,
    getHisData,
    setHisData
};