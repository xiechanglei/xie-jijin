const fs = require('fs');

// 读取存储的基金数据
const readStoredData = () => {
    const userHome = require('os').homedir();
    const filePath = `${userHome}/.xie_jijin.json`;
    let data = {};
    if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        data = JSON.parse(fileContent);
    }
    return { data, filePath };
};

// 写入基金数据到存储
const writeStoredData = (fundData, filePath) => {
    fs.writeFileSync(filePath, JSON.stringify(fundData, null, 2), 'utf-8');
};

const addCode = (code, money = 0) => {
    // 添加基金代码和金额到本地存储
    console.log(`添加基金代码: ${code}, 持仓金额: ${money}`);
    const { data, filePath } = readStoredData();

    // 如果基金代码不存在，则添加
    if (!data[code]) {
        data[code] = {
            code: code,
            money: parseFloat(money) || 0,
            shares: 0 // 份额将在获取基准净值后计算
        };
        writeStoredData(data, filePath);
    } else {
        // 如果基金已存在，只更新金额，份额将重新计算 when base value is available
        data[code].money = parseFloat(money) || 0;
        writeStoredData(data, filePath);
    }
};

const removeCode = (code) => {
    // 从本地存储中移除基金代码
    console.log(`移除基金代码: ${code}`);
    const { data, filePath } = readStoredData();

    if (data[code]) {
        delete data[code];
        writeStoredData(data, filePath);
    }
};

const setMoney = (code, money) => {
    // 设置指定基金的持仓金额
    console.log(`设置基金 ${code} 的持仓金额为: ${money}`);
    const { data, filePath } = readStoredData();

    if (data[code]) {
        // 更新金额，份额将在获取基准净值后重新计算
        data[code].money = parseFloat(money);
        data[code].shares = 0; // 重置份额，等待后续计算
        writeStoredData(data, filePath);
    } else {
        // 如果基金不存在，添加基金记录
        data[code] = {
            code: code,
            money: parseFloat(money),
            shares: 0 // 初始份额为0，直到获取基准净值后计算
        };
        writeStoredData(data, filePath);
    }
};

const getStoredCodes = () => {
    const { data } = readStoredData();
    return Object.keys(data).map(code => data[code]);
};

const updateFundShares = (code, baseValue) => {
    // 根据基准净值更新基金份额
    const { data, filePath } = readStoredData();

    if (data[code] && data[code].money > 0 && baseValue > 0) {
        data[code].shares = data[code].money / baseValue;
        writeStoredData(data, filePath);
    }
};

module.exports = {
    addCode,
    removeCode,
    getStoredCodes,
    setMoney,
    updateFundShares
};