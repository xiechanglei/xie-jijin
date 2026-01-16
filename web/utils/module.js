import path from 'node:path';
import fs from 'node:fs';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);


export const resolveModulePath = (moduleName) => {
    try {
        const entryFilePath = require.resolve(moduleName);
        let currentDir = path.dirname(entryFilePath);
        while (currentDir !== path.dirname(currentDir)) { // 防止无限循环到根目录
            const packageJsonPath = path.join(currentDir, 'package.json');
            if (fs.existsSync(packageJsonPath)) {
                const contents = fs.readFileSync(packageJsonPath);
                const json = JSON.parse(contents.toString());
                if (json.name === moduleName) {
                    return currentDir;
                }
            }
            currentDir = path.dirname(currentDir);
        }
    } catch (error) {
    }
    throw new Error(`模块不存在`);
}