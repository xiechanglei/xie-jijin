/**
 * 用ANSI颜色代码美化文本
 * @param {string} text - 文本
 * @param {string} color - 颜色名称
 * @returns {string} 带颜色的文本
 */
function colorize(text, color) {
    const colors = {
        red: '\x1b[31m',
        green: '\x1b[32m',
        yellow: '\x1b[33m',
        blue: '\x1b[34m',
        magenta: '\x1b[35m',
        cyan: '\x1b[36m',
        white: '\x1b[37m',
        reset: '\x1b[0m'
    };
    return colors[color] + text + colors.reset;
}


function colorPresents(num, model) {
    return model ? colorize(num + "%", "red") : colorize(num + "%", "green")
}

function colorNumber(num, model) {
    return model ? colorize(num.toFixed(2), "red") : colorize(num.toFixed(2), "green")
}

function colorSub(num, model) {
    return model ? colorize("+" + num.toFixed(2), "red") : colorize(num.toFixed(2), "green")
}

module.exports = {
    colorize, colorPresents, colorNumber, colorSub
}