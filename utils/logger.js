const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

const errorLogPath = path.join(logDir, 'error.log');
const accessLogPath = path.join(logDir, 'access.log');

const logger = {
    info: (message) => {
        const timestamp = new Date().toISOString();
        const log = `[${timestamp}] [INFO]: ${message}\n`;
        process.stdout.write(log); // Also write to stdout for real-time viewing if needed
        fs.appendFileSync(accessLogPath, log);
    },
    error: (message, error) => {
        const timestamp = new Date().toISOString();
        const errorStack = error ? `\nStack: ${error.stack}` : '';
        const log = `[${timestamp}] [ERROR]: ${message} ${error ? error.message : ''}${errorStack}\n`;
        process.stderr.write(log);
        fs.appendFileSync(errorLogPath, log);
        // Also append to main log for continuity
        fs.appendFileSync(accessLogPath, log);
    },
    // Middleware to log HTTP requests
    requestLogger: (req, res, next) => {
        const start = Date.now();
        res.on('finish', () => {
            const duration = Date.now() - start;
            const log = `[${new Date().toISOString()}] [HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms\n`;
            fs.appendFileSync(accessLogPath, log);
        });
        next();
    }
};

module.exports = logger;
