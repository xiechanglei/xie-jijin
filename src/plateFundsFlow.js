import { getHttpContent } from './http.util.js';

// 板块资金流API端点
const PLATE_FUNDS_API = {
    today: 'https://push2.eastmoney.com/api/qt/clist/get?fid=f62&po=1&pz=999&pn=1&np=1&fltt=2&invt=2&ut=8dec03ba335b81bf4ebdf7b29ec27d15&fs=m%3A90+t%3A2&fields=f12%2Cf14%2Cf2%2Cf3%2Cf62%2Cf184%2Cf66%2Cf69%2Cf72%2Cf75%2Cf78%2Cf81%2Cf84%2Cf87%2Cf204%2Cf205%2Cf124%2Cf1%2Cf13',
    fiveDay: 'https://push2.eastmoney.com/api/qt/clist/get?fid=f164&po=1&pz=999&pn=1&np=1&fltt=2&invt=2&ut=8dec03ba335b81bf4ebdf7b29ec27d15&fs=m%3A90+t%3A2&fields=f12%2Cf14%2Cf2%2Cf109%2Cf164%2Cf165%2Cf166%2Cf167%2Cf168%2Cf169%2Cf170%2Cf171%2Cf172%2Cf173%2Cf257%2Cf258%2Cf124%2Cf1%2Cf13',
    tenDay: 'https://push2.eastmoney.com/api/qt/clist/get?fid=f174&po=1&pz=99&pn=1&np=1&fltt=2&invt=2&ut=8dec03ba335b81bf4ebdf7b29ec27d15&fs=m%3A90+t%3A2&fields=f12%2Cf14%2Cf2%2Cf160%2Cf174%2Cf175%2Cf176%2Cf177%2Cf178%2Cf179%2Cf180%2Cf181%2Cf182%2Cf183%2Cf260%2Cf261%2Cf124%2Cf1%2Cf13'
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

export {
    getPlateFundsFlow
};