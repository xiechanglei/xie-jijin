//格式化输出钱
function formatNumber(num) {
    // 万  亿
    if (num < 10000) {
        return num;
    }
    num = num / 10000
    if (num < 10000) {
        return num.toFixed(2) + "万";
    }
    num = num / 10000;
    if (num < 10000) {
        return num.toFixed(2) + "亿";
    }
}

module.exports.formatNumber = formatNumber;