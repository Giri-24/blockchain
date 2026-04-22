const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

app.use(cors());
app.use(express.json());

// This is the part that talks to Pinata (IPFS)
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
        res.status(500).json({ error: "Pinata Upload Failed: " + error.message });
    }
});

// IMPORTANT: Export for Vercel
module.exports = app;
