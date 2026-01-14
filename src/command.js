import {program} from "commander";

/**
 * 从命令行参数中获取所有选项
 * @return {Object} 包含所有命令选项的对象
 */
export const getCommandOptions = () => {
    program.option("--user [user]", "网页展示", "xie").parse(process.argv);

    const options = program.opts();
    return {
        user: options.user || "xie",
    };
}