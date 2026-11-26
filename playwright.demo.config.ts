import { defineConfig } from '@playwright/test';

const port = Number(process.env.DEMO_TEST_PORT ?? 8171);
const baseURL = `http://127.0.0.1:${port}/gannamelage/`;

export default defineConfig({
    testDir: './tests/demo',
    outputDir: 'test-results/demo',
    forbidOnly: Boolean(process.env.CI),
    use: {
        baseURL,
        browserName: 'chromium',
        launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH },
        trace: 'retain-on-failure',
    },
    projects: [
        { name: 'mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
        { name: 'desktop', use: { viewport: { width: 1366, height: 768 } } },
    ],
    webServer: {
        command: `npm run build:demo && npm run preview:demo -- --host 127.0.0.1 --port ${port} --strictPort`,
        url: baseURL,
        reuseExistingServer: false,
        timeout: 60_000,
    },
});
