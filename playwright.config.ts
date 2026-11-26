import { defineConfig } from '@playwright/test';

const port = Number(process.env.E2E_PORT ?? 8123);
const baseURL = `http://127.0.0.1:${port}`;
const sizes = [[360, 800], [375, 812], [390, 844], [430, 932], [768, 1024], [1366, 768]];

export default defineConfig({
    testDir: './tests/e2e',
    workers: 2,
    forbidOnly: Boolean(process.env.CI),
    reporter: [['list'], ['html', { open: 'never' }]],
    use: {
        baseURL,
        browserName: 'chromium',
        launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH },
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
    },
    projects: sizes.map(([width, height]) => ({
        name: `${width}x${height}`,
        use: { viewport: { width, height }, isMobile: width < 1024, hasTouch: width < 1024 },
    })),
    webServer: {
        command: `node tests/e2e/serve.mjs ${port}`,
        url: baseURL,
        timeout: 60_000,
        reuseExistingServer: false,
        gracefulShutdown: { signal: 'SIGTERM', timeout: 3000 },
    },
});
