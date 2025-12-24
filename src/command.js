const {program} = require("commander");

/**
 * 从package.json中获取版本号
 */
const packageJson = require('../package.json');

/**
 * 从命令行参数中获取所有选项
 * @return {Object} 包含所有命令选项的对象
 */
const getCommandOptions = () => {
    program.version(packageJson.version)
        .description(packageJson.description)
        .option("--add <code>", "添加基金代码")
        .option("--money <amount>", "设置持仓金额")
        .option("--remove <code>", "移除基金代码")
        .option("--set <code>", "设置指定基金的持仓金额")
        .parse(process.argv);

    const options = program.opts();
    return {
        add: options.add || undefined,
        money: options.money || undefined,
        remove: options.remove || null,
        set: options.set || undefined
    };
}

module.exports = {
    getCommandOptions,
    packageJson
}