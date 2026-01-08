const {getFundHistoryData} = require("./src/fundAnalysisEnhanced");

async function test() {
    const data = await getFundHistoryData("015790")
    console.log(data)
}

test()