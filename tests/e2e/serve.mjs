import process from 'node:process';
import { spawn, spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { closeSync, mkdirSync, mkdtempSync, openSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';

const root = process.cwd();
const port = Number(process.argv[2]);
const directory = mkdtempSync(join(tmpdir(), 'gannam-e2e-'));
const storage = join(directory, 'storage');
const database = join(directory, 'database.sqlite');
const publicDir = join(directory, 'public');
const env = {
    ...process.env,
    APP_ENV: 'testing',
    APP_DEBUG: 'false',
    APP_KEY: `base64:${randomBytes(32).toString('base64')}`,
    APP_URL: `http://127.0.0.1:${port}`,
    APP_CONFIG_CACHE: join(directory, 'config.php'),
    APP_ROUTES_CACHE: join(directory, 'routes.php'),
    APP_EVENTS_CACHE: join(directory, 'events.php'),
    APP_MAINTENANCE_DRIVER: 'file',
    DB_CONNECTION: 'sqlite',
    DB_DATABASE: database,
    DB_URL: '',
    DB_FOREIGN_KEYS: 'true',
    LARAVEL_STORAGE_PATH: storage,
    VIEW_COMPILED_PATH: join(storage, 'framework/views'),
    SESSION_DRIVER: 'file',
    SESSION_DOMAIN: '',
    SESSION_SECURE_COOKIE: 'false',
    SANCTUM_STATEFUL_DOMAINS: `127.0.0.1:${port}`,
    CACHE_STORE: 'array',
    QUEUE_CONNECTION: 'sync',
    BCRYPT_ROUNDS: '4',
};

function run(args) {
    const command = spawnSync(args[0], args.slice(1), { env, stdio: 'inherit' });
    if (command.error) throw command.error;
    if (command.status !== 0) throw new Error(`Falha ao executar ${args.join(' ')}`);
}

try {
    for (const path of ['app/public', 'framework/views', 'framework/sessions', 'logs']) {
        mkdirSync(join(storage, path), { recursive: true });
    }
    mkdirSync(publicDir);
    closeSync(openSync(database, 'wx'));
    symlinkSync(resolve(root, 'public/images'), join(publicDir, 'images'), 'dir');
    symlinkSync(resolve(root, 'public/build'), join(publicDir, 'build'), 'dir');
    symlinkSync(join(storage, 'app/public'), join(publicDir, 'storage'), 'dir');

    run(['npm', 'run', 'build']);
    run(['php', 'artisan', 'migrate', '--force']);
    run(['php', 'tests/e2e/fixture.php']);

    const server = spawn('php', ['-S', `127.0.0.1:${port}`, '-t', publicDir, 'tests/e2e/router.php'], { env, stdio: 'inherit' });
    for (const signal of ['SIGINT', 'SIGTERM']) {
        process.on(signal, () => server.kill(signal));
    }
    const exitCode = await new Promise((resolve, reject) => {
        server.on('error', reject);
        server.on('exit', code => resolve(code ?? 0));
    });
    process.exitCode = exitCode;
} finally {
    rmSync(directory, { recursive: true, force: true });
}
