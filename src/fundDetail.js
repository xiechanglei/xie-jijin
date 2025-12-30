const {getHttpContent} = require("./http.util");
const cheerio = require('cheerio');

async function getFundDetail(code, limit = 10) {
    let result = await getHttpContent(`http://fundf10.eastmoney.com/FundArchivesDatas.aspx?type=jjcc&code=${code}&topline=${limit}`)
    result += "return apidata";
    // 构造一个function，
    const func = new Function(result);
    const apiData = func.call();
    const gpdmCode = cheerio.load(apiData.content)(".hide:eq(1)").html()
    if (gpdmCode !== "") {
        let codeArr = gpdmCode.split(",");
        let size = 120;
        let num = Math.ceil(codeArr.length / size);
        let codeArrGrouped = [];
        let startIndex = 0;
        let endIndex = 0;
        let codeArrSlice = [];
        let strCode = "";
        for (let i = 0; i < num; i++) {
            startIndex = i * size;
            endIndex = startIndex + size;
            codeArrSlice = codeArr.slice(startIndex, endIndex);
            strCode = codeArrSlice.join(",");
            codeArrGrouped.push(strCode)
        }
        if (codeArrGrouped.length > 0) {
            let apiurl = "https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&invt=2&fields=f1,f2,f3,f4,f5,f6,f7,f8,f9,f10,f11,f12,f13,f14,f15,f16,f17,f18&ut=267f9ad526dbe6b0262ab19316f5a25b&secids=" + strCode;
            const content = await getHttpContent(apiurl);
            return JSON.parse(content).data;
        }
    }
    throw new Error("未发现持仓信息")
}


module.exports = {
    getFundDetail
}

