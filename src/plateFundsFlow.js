import { getHttpContent } from '../src/http.util.js';

// 板块资金流API端点
const PLATE_FUNDS_API = {
    today: 'https://push2.eastmoney.com/api/qt/clist/get?fid=f62&po=1&pz=999&pn=1&np=1&fltt=2&invt=2&ut=8dec03ba335b81bf4ebdf7b29ec27d15&fs=m%3A90+t%3A2&fields=f12%2Cf14%2Cf2%2Cf3%2Cf62%2Cf184%2Cf66%2Cf69%2Cf72%2Cf75%2Cf78%2Cf81%2Cf84%2Cf87%2Cf204%2Cf205%2Cf124%2Cf1%2Cf13',
    fiveDay: 'https://push2.eastmoney.com/api/qt/clist/get?fid=f164&po=1&pz=999&pn=1&np=1&fltt=2&invt=2&ut=8dec03ba335b81bf4ebdf7b29ec27d15&fs=m%3A90+t%3A2&fields=f12%2Cf14%2Cf2%2Cf3%2Cf62%2Cf184%2Cf66%2Cf69%2Cf72%2Cf75%2Cf78%2Cf81%2Cf84%2Cf87%2Cf204%2Cf205%2Cf124%2Cf1%2Cf13',
    tenDay: 'https://push2.eastmoney.com/api/qt/clist/get?fid=f174&po=1&pz=999&pn=1&np=1&fltt=2&invt=2&ut=8dec03ba335b81bf4ebdf7b29ec27d15&fs=m%3A90+t%3A2&fields=f12%2Cf14%2Cf2%2Cf3%2Cf62%2Cf184%2Cf66%2Cf69%2Cf72%2Cf75%2Cf78%2Cf81%2Cf84%2Cf87%2Cf204%2Cf205%2Cf124%2Cf1%2Cf13'
};

/**
 * 获取板块资金流数据
 * @param {string} period - 时间周期 ('today', 'fiveDay', 'tenDay')
 * @returns {Promise<Object>} 板块资金流数据
 */
async function getPlateFundsFlow(period = 'today') {
    try {
        const apiUrl = PLATE_FUNDS_API[period];
        if (!apiUrl) {
            throw new Error(`不支持的时间周期: ${period}`);
        }

        const response = await getHttpContent(apiUrl);
        const data = JSON.parse(response);

        if (data?.rc !== 0) {
            throw new Error(`API返回错误: ${data?.message || '未知错误'}`);
        }

        return data;
    } catch (error) {
        console.error(`获取${period}板块资金流数据失败:`, error);
        throw error;
    }
}

/**
 * 格式化板块资金流数据，便于前端显示
 * @param {Array} diffData - 来自API的diff数组
 * @returns {Array} 格式化后的数据
 */
function formatPlateFundsData(diffData) {
    if (!Array.isArray(diffData)) {
        return [];
    }

    return diffData.map(item => ({
        code: item.f12,           // 板块代码
        name: item.f14,           // 板块名称
        price: item.f2,           // 板块股价
        changePercent: item.f3,   // 涨跌幅%
        mainNetInflow: item.f62,  // 主力净流入-净额
        mainInflowRatio: item.f184, // 主力流入-净占比%
        superLargeNetInflow: item.f66, // 超大单净流入-净额
        superLargeInflowRatio: item.f69, // 超大单净流入-净占比%
        largeNetInflow: item.f72,       // 大单净流入-净额
        largeInflowRatio: item.f75,     // 大单净流入-净占比%
        midNetInflow: item.f78,         // 中单净流入-净额
        midInflowRatio: item.f81,       // 中单净流入-净占比%
        smallNetInflow: item.f84,       // 小单净流入-净额
        smallInflowRatio: item.f87,     // 小单净流入-净占比%
        topStock: item.f204,            // 主力净流入最大股
        topStockCode: item.f205         // 主力净流入最大股代码
    }));
}

export {
    getPlateFundsFlow,
    formatPlateFundsData
};