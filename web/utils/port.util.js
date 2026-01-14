import net from 'net';

/**
 * Find an available port starting from a random port number
 * @returns {Promise<number>} An available port number
 */
function getPort(startPort = 10086) {
    return new Promise((resolve, reject) => {
        const server = net.createServer();

        server.listen(startPort, () => {
            const port = server.address().port;
            server.close(() => {
                resolve(port);
            });
        });

        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                // Port is busy, try next one
                getPort(startPort + 1).then(resolve).catch(reject);
            } else {
                reject(err);
            }
        });
    });
}

export {
    getPort
};