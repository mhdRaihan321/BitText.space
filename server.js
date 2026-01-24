require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { sequelize } = require('./models');
const cors = require('cors');

const app = express();

// 2. Configure CORS
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3008', // Allow your frontend origin
    credentials: true                // Required if using sessions/cookies/passport
}));
app.use(bodyParser.json());
app.use(express.static('web'));

app.use('/api/sms', require('./routes/sms.routes'));
app.use('/api/device', require('./routes/device.routes'));
app.use('/admin', require('./routes/admin.routes'));
app.use('/auth', require('./routes/auth.routes'));
app.use('/api/user', require('./routes/user.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));
require('./config/passport');


// GET /health
app.get('/', async (req, res) => {
    let dbStatus = 'down';

    try {
        await sequelize.authenticate();
        dbStatus = 'connected';
    } catch (e) {
        dbStatus = 'error';
    }

    const now = new Date();
    const istTime = new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'full',
        timeStyle: 'long'
    }).format(now);

    res.json({
        status: 'ok',
        message: 'SMS Gateway API is running',
        timezone: 'Asia/Kolkata',
        server_time: istTime,
        iso_time: now.toISOString(),
        uptime_seconds: Math.floor(process.uptime()),
        environment: process.env.NODE_ENV || 'development',
        services: {
            api: 'operational',
            database: dbStatus
        }
    });
});

sequelize.sync({}).then(() => {
    app.listen(process.env.PORT, () =>
        console.log(`SMS Gateway running on ${process.env.PORT}`)
    );
});
