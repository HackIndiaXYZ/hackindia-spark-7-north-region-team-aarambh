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

async function test1() {
    try {
        const path = `/resources/accessTokens?userId=test_user&levelName=basic-kyc-level`;
        const headers = {
            ...createSignature('POST', path),
            'Content-Type': 'application/json'
        };
        const res = await axios.post(`https://api.sumsub.com${path}`, null, { headers });
        console.log("Test 1 (null body) success:", res.data);
    } catch (e) {
        console.log("Test 1 (null body) error:", e.response?.data?.errorName);
    }
}

async function test2() {
    try {
        const path = `/resources/accessTokens?userId=test_user&levelName=basic-kyc-level`;
        const headers = {
            ...createSignature('POST', path),
            'Content-Type': 'application/json'
        };
        const res = await axios.post(`https://api.sumsub.com${path}`, undefined, { headers });
        console.log("Test 2 (undefined body) success:", res.data);
    } catch (e) {
        console.log("Test 2 (undefined body) error:", e.response?.data?.errorName);
    }
}

async function run() {
    await test1();
    await test2();
}
run();
