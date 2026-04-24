const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

app.use(cors());
app.use(express.json());

app.post('/api/upload-ipfs', async (req, res) => {
    try {
        const response = await axios.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', req.body, {
            headers: {
                pinata_api_key: process.env.PINATA_KEY,
                pinata_secret_api_key: process.env.PINATA_SECRET,
            }
        });
        res.json({ cid: response.data.IpfsHash });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const serverless = require('serverless-http');
module.exports = app;
module.exports.handler = serverless(app);

// Start server if running directly (e.g., on Render)
if (require.main === module) {
    const port = process.env.PORT || 3001;
    app.listen(port, () => {
        console.log(`Server listening on port ${port}`);
    });
}
