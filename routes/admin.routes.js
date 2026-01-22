const router = require('express').Router();
const { User } = require('../models');
const { generateApiKey } = require('../utils/keygen');

// TEMP admin route
router.post('/create-user', async (req, res) => {
    const { name } = req.body;
    if (!name) {
        // return res.json({ message: "Name is required! ", status: 401 })
        return res.status(401).json({ error: "name is required!" })
    }



    const apiKey = generateApiKey();

    const user = await User.create({
        name,
        api_key: apiKey
    });

    res.json({
        message: 'User created',
        api_key: apiKey
    });
});

module.exports = router;
