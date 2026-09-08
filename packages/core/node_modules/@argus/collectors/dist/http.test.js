import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { createServer } from 'node:http';
import { collectHttp } from './http.js';
test('HTTP collector handles timeout', async () => {
    // Create a server that never responds
    const server = createServer(() => {
        // Never send response
    });
    await new Promise((resolve) => {
        server.listen(0, () => resolve());
    });
    const address = server.address();
    if (!address || typeof address === 'string') {
        throw new Error('Failed to get server address');
    }
    const port = address.port;
    const url = `http://127.0.0.1:${port}/`;
    try {
        const result = await collectHttp(url, 'test-run', 'test-target', {
            timeoutMs: 1000
        });
        const errorObs = result.observations.find(obs => obs.type === 'HTTP_ERROR');
        assert.ok(errorObs, 'Should have HTTP_ERROR observation');
        assert.equal(errorObs.rawValue.error, 'TIMEOUT');
    }
    finally {
        server.close();
    }
});
test('HTTP collector validates redirects', async () => {
    const server = createServer((req, res) => {
        if (req.url === '/redirect') {
            res.writeHead(302, { 'Location': 'http://forbidden.example/' });
            res.end();
        }
        else {
            res.writeHead(200);
            res.end('OK');
        }
    });
    await new Promise((resolve) => {
        server.listen(0, () => resolve());
    });
    const address = server.address();
    if (!address || typeof address === 'string') {
        throw new Error('Failed to get server address');
    }
    const port = address.port;
    const url = `http://127.0.0.1:${port}/redirect`;
    try {
        const result = await collectHttp(url, 'test-run', 'test-target', {
            validateRedirect: async (redirectUrl) => {
                return !redirectUrl.includes('forbidden');
            }
        });
        const errorObs = result.observations.find(obs => obs.type === 'HTTP_ERROR');
        assert.ok(errorObs, 'Should have HTTP_ERROR observation');
        assert.equal(errorObs.rawValue.error, 'REDIRECT_TO_FORBIDDEN_TARGET');
    }
    finally {
        server.close();
    }
});
test('HTTP collector limits redirects', async () => {
    const server = createServer((req, res) => {
        // Always redirect to itself
        res.writeHead(302, { 'Location': req.url || '/' });
        res.end();
    });
    await new Promise((resolve) => {
        server.listen(0, () => resolve());
    });
    const address = server.address();
    if (!address || typeof address === 'string') {
        throw new Error('Failed to get server address');
    }
    const port = address.port;
    const url = `http://127.0.0.1:${port}/loop`;
    try {
        const result = await collectHttp(url, 'test-run', 'test-target', {
            maxRedirects: 3
        });
        const errorObs = result.observations.find(obs => obs.type === 'HTTP_ERROR');
        assert.ok(errorObs, 'Should have HTTP_ERROR observation');
        assert.equal(errorObs.rawValue.error, 'TOO_MANY_REDIRECTS');
    }
    finally {
        server.close();
    }
});
test('HTTP collector does not send Cookie or Authorization headers', async () => {
    let receivedHeaders = {};
    const server = createServer((req, res) => {
        receivedHeaders = req.headers;
        res.writeHead(200);
        res.end('OK');
    });
    await new Promise((resolve) => {
        server.listen(0, () => resolve());
    });
    const address = server.address();
    if (!address || typeof address === 'string') {
        throw new Error('Failed to get server address');
    }
    const port = address.port;
    const url = `http://127.0.0.1:${port}/`;
    try {
        await collectHttp(url, 'test-run', 'test-target');
        assert.ok(!receivedHeaders['cookie'], 'Should not send Cookie header');
        assert.ok(!receivedHeaders['authorization'], 'Should not send Authorization header');
        assert.ok(receivedHeaders['user-agent']?.toString().includes('ARGUS'), 'Should send ARGUS User-Agent');
    }
    finally {
        server.close();
    }
});
test('HTTP collector does not persist Set-Cookie values', async () => {
    const server = createServer((req, res) => {
        res.writeHead(200, {
            'Set-Cookie': 'session=secret123; HttpOnly',
            'Content-Type': 'text/html'
        });
        res.end('OK');
    });
    await new Promise((resolve) => {
        server.listen(0, () => resolve());
    });
    const address = server.address();
    if (!address || typeof address === 'string') {
        throw new Error('Failed to get server address');
    }
    const port = address.port;
    const url = `http://127.0.0.1:${port}/`;
    try {
        const result = await collectHttp(url, 'test-run', 'test-target');
        const responseObs = result.observations.find(obs => obs.type === 'HTTP_RESPONSE');
        assert.ok(responseObs, 'Should have HTTP_RESPONSE observation');
        assert.ok(!responseObs.rawValue.headers['set-cookie'], 'Should not persist Set-Cookie header');
        assert.ok(responseObs.rawValue.headers['content-type'], 'Should persist other headers');
    }
    finally {
        server.close();
    }
});
test('HTTP collector handles redirect without Location header', async () => {
    const server = createServer((req, res) => {
        res.writeHead(302); // No Location header
        res.end();
    });
    await new Promise((resolve) => {
        server.listen(0, () => resolve());
    });
    const address = server.address();
    if (!address || typeof address === 'string') {
        throw new Error('Failed to get server address');
    }
    const port = address.port;
    const url = `http://127.0.0.1:${port}/`;
    try {
        const result = await collectHttp(url, 'test-run', 'test-target');
        const errorObs = result.observations.find(obs => obs.type === 'HTTP_ERROR');
        assert.ok(errorObs, 'Should have HTTP_ERROR observation');
        assert.equal(errorObs.rawValue.error, 'REDIRECT_WITHOUT_LOCATION');
    }
    finally {
        server.close();
    }
});
test('HTTP collector follows valid redirects', async () => {
    const server = createServer((req, res) => {
        if (req.url === '/start') {
            res.writeHead(302, { 'Location': '/middle' });
            res.end();
        }
        else if (req.url === '/middle') {
            res.writeHead(302, { 'Location': '/end' });
            res.end();
        }
        else if (req.url === '/end') {
            res.writeHead(200);
            res.end('Success');
        }
        else {
            res.writeHead(404);
            res.end();
        }
    });
    await new Promise((resolve) => {
        server.listen(0, () => resolve());
    });
    const address = server.address();
    if (!address || typeof address === 'string') {
        throw new Error('Failed to get server address');
    }
    const port = address.port;
    const url = `http://127.0.0.1:${port}/start`;
    try {
        const result = await collectHttp(url, 'test-run', 'test-target');
        assert.equal(result.redirectChain.length, 3);
        assert.ok(result.finalUrl.includes('/end'));
        const responseObs = result.observations.filter(obs => obs.type === 'HTTP_RESPONSE');
        assert.equal(responseObs.length, 3); // start, middle, end
    }
    finally {
        server.close();
    }
});
//# sourceMappingURL=http.test.js.map