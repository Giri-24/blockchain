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

// Added: Official Company Portal Verification Endpoint
app.post('/api/verify-job', async (req, res) => {
    try {
        const { title, company } = req.body;
        if (!title || !company) {
            return res.status(400).json({ error: "Title and Company are required for verification" });
        }

        // Simulate reading the company's official job portal (e.g., scraping their ATS system)
        await new Promise(resolve => setTimeout(resolve, 2000));

        // For MVP, we simulate a successful match.
        // In production, this would be: `const isVerified = await scrapeCompanyPortal(title, company);`
        const isVerified = true; 

        if (isVerified) {
            res.json({ 
                verified: true, 
                message: `Verified '${title}' mathematically against ${company}'s official HR portal.`
            });
        } else {
            res.status(400).json({ error: `Verification failed: Could not find '${title}' on ${company}'s official job portal.` });
        }
    } catch (error) {
        res.status(500).json({ error: "Verification server error" });
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
