require('dotenv').config({path: '../.env'});
const axios = require('axios');
const crypto = require('crypto');

const SUMSUB_APP_TOKEN = process.env.SUMSUB_APP_TOKEN;
const SUMSUB_SECRET_KEY = process.env.SUMSUB_SECRET_KEY;

function createSignature(method, path, body = '') {
    const ts = Math.floor(Date.now() / 1000);
    const signature = crypto.createHmac('sha256', SUMSUB_SECRET_KEY);
    signature.update(ts + method.toUpperCase() + path + (body ? body : ''));
    return {
        'X-App-Token': SUMSUB_APP_TOKEN,
        'X-App-Access-Sig': signature.digest('hex'),
        'X-App-Access-Ts': ts,
    };
}

async function test(bodyValue, useData) {
    try {
        const path = `/resources/accessTokens?userId=test_user&levelName=basic-kyc-level`;
        const headers = {
            ...createSignature('POST', path, bodyValue === undefined ? '' : bodyValue),
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };

        const config = {
            method: 'post',
            url: `https://api.sumsub.com${path}`,
            headers
        };
        if (useData) config.data = bodyValue;

        const res = await axios(config);
        console.log(`Success with body=${bodyValue}, useData=${useData}:`, res.data);
    } catch (e) {
        console.log(`Error with body=${bodyValue}, useData=${useData}:`, e.response?.data || e.message);
    }
}

async function run() {
    console.log("Testing with no data field...");
    await test(undefined, false);
    
    console.log("Testing with empty string...");
    await test('', true);
    
    console.log("Testing with empty object...");
    await test('{}', true); // signature expects string representation
}
run();
