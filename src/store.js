import fs from 'fs';
import {homedir} from 'os';
import {getCommandOptions} from "./command.js";

const userHome = homedir();

const options = getCommandOptions();

const filePath = `${userHome}/.${options.user}_jijin.json`;

// 读取存储的基金数据
const readStoredData = () => {
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
};

const addCode = async (code, shares = 0) => {
    // 添加基金代码和金额到本地存储
    const {data} = readStoredData();

    // 如果基金代码不存在，则添加
    if (!data[code]) {
        data[code] = {
            code: code,
            shares: shares
        };
        writeStoredData(data);
    } else {
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

const setMoney = async (code, shares = 0) => {
    // 设置指定基金的持仓金额
    const {data} = readStoredData();

    if (data[code]) {
        // 更新金额和重新计算份额
        data[code].shares = shares;
        writeStoredData(data);
    } else {
        // 如果基金不存在，添加基金记录
        data[code] = {
            code: code,
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

export {
    addCode,
    removeCode,
    getStoredCodes,
    setMoney
};