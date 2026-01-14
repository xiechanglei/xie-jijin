#!/usr/bin/env node

import WebServer from './web/WebServer.js';
async function main() {
    console.log('启动Web服务器...');
    const server = new WebServer();
    try {
        await server.start();
        // 保持服务器运行
    } catch (error) {
        console.error('启动Web服务器失败:', error);
        process.exit(1);
    }
}

// 运行主程序
main().catch(error => {
    console.log(`程序执行出错: ${error.message}`);
    process.exit(1);
});