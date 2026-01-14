import http from 'http';
import fs from 'fs';
import path from 'path';
import openModule from 'open';
import {fileURLToPath} from 'url';
import {dirname} from 'path';

const open = openModule.default || openModule;
import {getPort} from './utils/port.util.js';

// Import the store module to get fund data
import {getStoredCodes, addCode, removeCode, setMoney} from '../src/store.js';
import {getPlateFundsFlow} from '../src/plateFundsFlow.js';

// Define __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class WebServer {
    constructor() {
        this.port = null;
    }

    /**
     * Get MIME type for file extension
     */
    getMimeType(filePath) {
        const extname = path.extname(filePath).toLowerCase();
        const mimeTypes = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'text/javascript',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.wav': 'audio/wav',
            '.mp4': 'video/mp4',
            '.woff': 'application/font-woff',
            '.ttf': 'application/font-ttf',
            '.eot': 'application/vnd.ms-fontobject',
            '.otf': 'application/font-otf',
            '.wasm': 'application/wasm'
        };

        return mimeTypes[extname] || 'application/octet-stream';
    }

    /**
     * Handle incoming requests
     */
    handleRequest(req, res) {
        // Parse the URL to get the pathname - use a dummy hostname
        const parsedUrl = new URL(req.url, 'http://localhost');
        const pathname = parsedUrl.pathname;

        // Handle API routes
        if (pathname.startsWith('/api/')) {
            this.handleApiRequest(req, res, pathname);
            return;
        }

        // Handle requests for node_modules resources
        if (pathname.startsWith('/node_lib/')) {
            // Map /node_lib/ to node_modules directory
            const modulePath = pathname.substring('/node_lib/'.length);
            // Use the project's node_modules directory relative to the server file
            let moduleFilePath = path.join(__dirname, '..', '..', modulePath);

            // Check if file exists
            fs.access(moduleFilePath, fs.constants.F_OK, (err) => {
                if (err) {
                    // File not found, send 404
                    res.writeHead(404, {'Content-Type': 'text/html'});
                    res.end('<h1>404 Not Found</h1>');
                    return;
                }

                // Read and serve the file
                fs.readFile(moduleFilePath, (err, content) => {
                    if (err) {
                        res.writeHead(500);
                        res.end('Server Error');
                        return;
                    }

                    const contentType = this.getMimeType(moduleFilePath);
                    res.writeHead(200, {'Content-Type': contentType});
                    res.end(content, 'utf-8');
                });
            });
        } else {
            // Serve static files from web/res directory
            let filePath = path.join(__dirname, 'res', pathname);

            // If requesting root path, serve index.html
            if (pathname === '/' || pathname === '') {
                filePath = path.join(__dirname, 'res', 'index.html');
            }

            // Check if file exists
            fs.access(filePath, fs.constants.F_OK, (err) => {
                if (err) {
                    // File not found, send 404
                    res.writeHead(404, {'Content-Type': 'text/html'});
                    res.end('<h1>404 Not Found</h1>');
                    return;
                }

                // Read and serve the file
                fs.readFile(filePath, (err, content) => {
                    if (err) {
                        res.writeHead(500);
                        res.end('Server Error');
                        return;
                    }

                    const contentType = this.getMimeType(filePath);
                    res.writeHead(200, {'Content-Type': contentType});
                    res.end(content, 'utf-8');
                });
            });
        }
    }

    /**
     * Handle API requests
     */
    async handleApiRequest(req, res, pathname) {
        // Parse the pathname to extract fund codes for specific endpoints
        const pathParts = pathname.split('/');

        if (req.method === 'POST' && pathname === '/api/add-fund') {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', async () => {
                try {
                    const {code, amount} = JSON.parse(body); // amount represents shares

                    if (!code && amount === undefined) {
                        res.writeHead(400, {'Content-Type': 'application/json'});
                        res.end(JSON.stringify({error: 'Fund code and shares are required'}));
                        return;
                    }
                    await addCode(code, amount);

                    res.writeHead(200, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({success: true, message: 'Fund added successfully'}));
                } catch (error) {
                    console.error('Error adding fund:', error);
                    res.writeHead(500, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({
                        error: 'Failed to add fund',
                        message: error.message
                    }));
                }
            });
        } else if (pathname === '/api/funds') {
            try {
                const storedFunds = getStoredCodes();

                // Return only basic information (code and shares) for quick rendering
                const fundDetails = storedFunds.map(fund => ({
                    code: fund.code,
                    shares: fund.shares || 0
                }));

                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({
                    funds: fundDetails
                }));
            } catch (error) {
                console.error('Error fetching funds:', error);
                res.writeHead(500, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({
                    error: 'Failed to fetch fund data',
                    message: error.message
                }));
            }
        } else if (req.method === 'POST' && pathname === '/api/remove-fund') {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', async () => {
                try {
                    const {code} = JSON.parse(body);

                    if (!code) {
                        res.writeHead(400, {'Content-Type': 'application/json'});
                        res.end(JSON.stringify({error: 'Fund code is required'}));
                        return;
                    }

                    // Remove the fund from storage
                    removeCode(code);
                    res.writeHead(200, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({success: true, message: 'Fund removed successfully'}));
                } catch (error) {
                    console.error('Error removing fund:', error);
                    res.writeHead(500, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({
                        error: 'Failed to remove fund',
                        message: error.message
                    }));
                }
            });
        } else if (req.method === 'POST' && pathname === '/api/set-share') {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', async () => {
                try {
                    const {code, share} = JSON.parse(body);

                    if (!code) {
                        res.writeHead(400, {'Content-Type': 'application/json'});
                        res.end(JSON.stringify({error: 'Fund code and share are required'}));
                        return;
                    }
                    await setMoney(code, share);

                    res.writeHead(200, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({success: true, message: 'Fund share updated successfully'}));
                } catch (error) {
                    console.error('Error setting fund share:', error);
                    res.writeHead(500, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({
                        error: 'Failed to set fund share',
                        message: error.message
                    }));
                }
            });
        } else if (pathname.startsWith('/api/fund-share/')) {
            // Extract fund code from the path
            const pathParts = pathname.split('/');
            const fundCode = pathParts[3]; // /api/fund-share/{code}

            try {
                // Get fund data from storage
                const storedFunds = getStoredCodes();
                const fund = storedFunds.find(f => f.code === fundCode);

                if (!fund) {
                    res.writeHead(404, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({error: 'Fund not found'}));
                    return;
                }

                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({
                    code: fund.code,
                    shares: fund.shares || 0
                }));
            } catch (error) {
                console.error(`Error fetching fund share for ${fundCode}:`, error);
                res.writeHead(500, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({
                    error: 'Failed to fetch fund share',
                    message: error.message
                }));
            }
        } else if (pathname.startsWith('/api/fund-gz/')) {
            // Extract fund code from the path
            const pathParts = pathname.split('/');
            const fundCode = pathParts[3]; // /api/fund-gz/{code}

            try {
                // Fetch real-time estimate data from Sina Finance
                const gzResponse = await fetch(`http://fundgz.1234567.com.cn/js/${fundCode}.js`);
                const gzText = await gzResponse.text();

                // Extract JSONP response
                const jsonpData = gzText.replace(/^jsonpgz\(|\);$/g, '');
                const gzData = JSON.parse(jsonpData);

                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify(gzData));
            } catch (error) {
                console.error(`Error fetching fund gz data for ${fundCode}:`, error);
                res.writeHead(500, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({
                    error: 'Failed to fetch fund estimate data',
                    message: error.message
                }));
            }
        } else if (pathname.startsWith('/api/fund-history/')) {
            // Extract fund code from the path
            const pathParts = pathname.split('/');
            const fundCode = pathParts[3]; // /api/fund-history/{code}

            try {
                // Fetch historical data from East Money
                const historyResponse = await fetch(`https://fund.eastmoney.com/pingzhongdata/${fundCode}.js`);
                const historyText = await historyResponse.text();

                // Extract historical data
                const netWorthMatch = historyText.match(/Data_netWorthTrend\s*=\s*(\[.*?\]);/);
                const acWorthMatch = historyText.match(/Data_ACWorthTrend\s*=\s*(\[.*?\]);/);
                const nameMatch = historyText.match(/fS_name\s*=\s*["']([^"']*)["'];/);
                const codeMatch = historyText.match(/fS_code\s*=\s*["']([^"']*)["'];/);

                // Extract yield data
                const syl_1nMatch = historyText.match(/syl_1n\s*[:=]\s*["']([^"']*)["'];/);
                const syl_6yMatch = historyText.match(/syl_6y\s*[:=]\s*["']([^"']*)["'];/);
                const syl_3yMatch = historyText.match(/syl_3y\s*[:=]\s*["']([^"']*)["'];/);
                const syl_1yMatch = historyText.match(/syl_1y\s*[:=]\s*["']([^"']*)["'];/);

                if (!netWorthMatch) {
                    throw new Error('Could not parse historical data');
                }

                const netWorthData = eval('(' + netWorthMatch[1] + ')');
                const acWorthData = acWorthMatch ? eval('(' + acWorthMatch[1] + ')') : [];
                const fundName = nameMatch ? nameMatch[1] : 'Unknown';
                const fundCodeFromData = codeMatch ? codeMatch[1] : fundCode;

                // Extract yield values
                const syl_1n = syl_1nMatch ? syl_1nMatch[1] : null;
                const syl_6y = syl_6yMatch ? syl_6yMatch[1] : null;
                const syl_3y = syl_3yMatch ? syl_3yMatch[1] : null;
                const syl_1y = syl_1yMatch ? syl_1yMatch[1] : null;

                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({
                    fundCode: fundCodeFromData,
                    fundName,
                    netWorthTrend: netWorthData,
                    acWorthTrend: acWorthData,
                    syl_1n: syl_1n,
                    syl_6y: syl_6y,
                    syl_3y: syl_3y,
                    syl_1y: syl_1y
                }));
            } catch (error) {
                console.error(`Error fetching fund history data for ${fundCode}:`, error);
                res.writeHead(500, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({
                    error: 'Failed to fetch fund history data',
                    message: error.message
                }));
            }
        } else if (pathname.startsWith('/api/plate-funds-flow/')) {
            // Extract period from the path
            const pathParts = pathname.split('/');
            const period = pathParts[3]; // /api/plate-funds-flow/{period}

            try {
                // Validate period
                if (!['today', 'fiveDay', 'tenDay'].includes(period)) {
                    res.writeHead(400, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({error: 'Invalid period. Use: today, fiveDay, or tenDay'}));
                    return;
                }

                // Fetch plate funds flow data
                const data = await getPlateFundsFlow(period);

                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({
                    success: true,
                    data
                }));
            } catch (error) {
                console.error(`Error fetching plate funds flow data for ${period}:`, error);
                res.writeHead(500, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({
                    error: 'Failed to fetch plate funds flow data',
                    message: error.message
                }));
            }
        } else {
            res.writeHead(404, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({error: 'API endpoint not found'}));
        }
    }

    async start() {
        // Find a random available port
        this.port = await getPort();

        return new Promise((resolve, reject) => {
            const server = http.createServer((req, res) => {
                this.handleRequest(req, res);
            });

            server.listen(this.port, () => {
                console.log(`Web server running on http://localhost:${this.port}`);

                // Open browser automatically
                const openPromise = open(`http://localhost:${this.port}`).catch(err => {
                    console.error('Failed to open browser:', err);
                });

                // Wait for the browser to open (with a timeout) and then resolve
                Promise.race([
                    openPromise,
                    new Promise(resolve => setTimeout(resolve, 2000)) // 2 second timeout
                ]).then(() => {
                    resolve({
                        port: this.port,
                        url: `http://localhost:${this.port}`,
                        server
                    });
                }).catch(() => {
                    // Even if opening browser fails, resolve with server info
                    resolve({
                        port: this.port,
                        url: `http://localhost:${this.port}`,
                        server
                    });
                });
            });

            server.on('error', (err) => {
                reject(err);
            });
        });
    }
}

export default WebServer;