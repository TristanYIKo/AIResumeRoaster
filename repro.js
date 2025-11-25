const fs = require('fs');

async function run() {
    const formData = new FormData();
    const file = new Blob([fs.readFileSync('test.txt')], { type: 'text/plain' });
    formData.append('file', file, 'test.txt');

    try {
        const res = await fetch('http://localhost:3003/api/roast', {
            method: 'POST',
            body: formData,
        });
        console.log('Status:', res.status);
        const text = await res.text();
        console.log('Response:', text.substring(0, 500)); // Print first 500 chars
    } catch (e) {
        console.error(e);
    }
}

run();
