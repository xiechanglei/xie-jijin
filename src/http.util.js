import https from 'https';
import http from 'http';

async function getHttpContent(requestUrl, config = {}) {
    return new Promise((resolve, reject) => {
        const lib = requestUrl.startsWith('https') ? https : http;

        // 收集完整的响应数据为Buffer
        const chunks = [];
        lib.get(requestUrl, config, (res) => {
            res.on('data', (chunk) => {
                chunks.push(chunk);
            });
            res.on('end', () => {
                // 合并所有chunks成一个完整的Buffer
                const buffer = Buffer.concat(chunks);

                // 检查Content-Type头部以确定编码
                const contentType = res.headers['content-type'] || '';
                let charset = 'utf-8'; // 默认编码

                // 从Content-Type头部提取字符集
                const charsetMatch = contentType.match(/charset=(.+)$/i);
                if (charsetMatch) {
                    charset = charsetMatch[1].trim().toLowerCase();
                }

                // 如果不是UTF-8编码，需要进行转码
                let data;
                if (charset && charset !== 'utf-8' && charset !== 'utf8') {
                    // 尝试使用 iconv-lite 解码（如果已安装）
                    try {
                        // Node.js 内置的TextDecoder可以处理多种编码
                        if (typeof TextDecoder !== 'undefined') {
                            const decoder = new TextDecoder(charset, {fatal: false});
                            data = decoder.decode(buffer);
                        } else {
                            // 如果没有合适的解码器，则按UTF-8处理
                            data = buffer.toString('utf8');
                        }
                    } catch (e) {
                        // console.warn(`无法使用 ${charset} 解码响应，尝试使用UTF-8`);
                        // 如果编码转换失败，直接使用UTF-8解码
                        data = buffer.toString('utf8');
                    }
                } else {
                    // 如果是UTF-8或未指定编码，直接转换
                    data = buffer.toString('utf8');
                }
                resolve(data);
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

export {
    getHttpContent
};