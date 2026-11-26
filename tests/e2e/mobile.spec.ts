import { expect, test, type Page } from '@playwright/test';

const email = 'corretora@example.test';
const password = 'teste-local-2026';
const searchLabel = 'Buscar por título, localização ou código';

async function login(page: Page) {
    await page.goto('/login');
    await page.getByLabel('E-mail').fill(email);
    await page.getByLabel('Senha').fill(password);
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Imóveis', exact: true })).toBeVisible();
}

async function noOverflow(page: Page) {
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

async function screenshot(page: Page, name: string) {
    if (process.env.E2E_SCREENSHOTS && page.viewportSize()?.width === 390) {
        await page.screenshot({ path: `playwright-screenshots/${name}.png` });
    }
}

test('login Sanctum, sessão persistida, saída e navegação por toque', async ({ page, hasTouch }) => {
    await page.goto('/properties/1/view');
    await expect(page).toHaveURL(/\/login$/);
    await page.getByLabel('E-mail').fill(email);
    await page.getByLabel('Senha').fill('incorreta');
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('incorretas');
    await page.getByLabel('Senha').fill(password);
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    await expect(page).toHaveURL(/\/properties\/1\/view$/);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Casa Jardim 0' })).toBeVisible();

    const navigation = page.getByRole('navigation', { name: 'Navegação interna' });
    const search = navigation.getByRole('link', { name: 'Buscar' });
    const box = await search.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
    expect(box?.width).toBeGreaterThanOrEqual(44);
    if (hasTouch) await search.tap();
    else await search.click();
    await expect(page.getByLabel(searchLabel)).toBeFocused();

    const add = navigation.getByRole('link', { name: 'Cadastrar' });
    if (hasTouch) await add.tap();
    else await add.click();
    await expect(page.getByRole('heading', { name: 'Novo imóvel' })).toBeVisible();
    await noOverflow(page);
    await page.getByRole('button', { name: 'Sair' }).click();
    await expect(page).toHaveURL(/\/login$/);
});

test('busca com debounce, título, localização, código e estado vazio', async ({ page }) => {
    await login(page);
    await expect(page.getByRole('heading', { name: 'Casa Jardim 0' })).toBeVisible();
    const requests: string[] = [];
    page.on('request', request => {
        const url = new URL(request.url());
        const search = url.searchParams.get('search');
        if (url.pathname === '/api/properties' && search) requests.push(search);
    });
    const input = page.getByLabel(searchLabel);
    await page.clock.install();
    await page.clock.pauseAt(new Date(Date.now() + 1000));
    await input.fill('Casa');
    await input.fill('Casa Jardim 0');
    await page.clock.runFor(400);
    await page.clock.resume();
    await expect(page.getByRole('status').filter({ hasText: '1 imóvel encontrado' })).toBeVisible();
    expect(requests).toEqual(['Casa Jardim 0']);
    await input.fill('Santa Lúcia');
    await expect(page.getByRole('heading', { name: 'Casa Jardim 0' })).toBeVisible();
    await expect(page).toHaveURL(/search=Santa/);
    await input.fill('#2');
    await expect(page.getByRole('heading', { name: 'Casa Jardim 1' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Casa Jardim 0' })).toHaveCount(0);
    await input.fill('Localização inexistente');
    await expect(page.getByRole('heading', { name: 'Nenhum imóvel encontrado' })).toBeVisible();
    await noOverflow(page);
});

test('filtros combinados, remoção, paginação e ordenação preservam a URL', async ({ page }) => {
    await login(page);
    await page.getByRole('button', { name: 'Disponível', exact: true }).click();
    await page.getByRole('button', { name: 'Filtros', exact: true }).click();
    const sheet = page.getByRole('dialog', { name: 'Filtrar imóveis' });
    await expect(sheet).toBeVisible();
    await sheet.getByRole('combobox', { name: 'Tipo', exact: true }).selectOption('casa');
    await sheet.getByRole('combobox', { name: 'Cidade', exact: true }).selectOption('Belo Horizonte');
    await sheet.getByLabel('Quartos mínimos').fill('3');
    await expect(sheet.getByRole('combobox', { name: 'Bairro', exact: true })).toBeEnabled();
    await sheet.getByLabel('Preço mínimo (R$ mil)').fill('300');
    await sheet.getByLabel('Preço máximo (R$ mil)').fill('950');
    await screenshot(page, 'melhorias-filtros');
    await screenshot(page, '02-filtros');
    await sheet.getByText('Filtros avançados', { exact: true }).click();
    await sheet.getByLabel('IPTU máximo').fill('1000');
    await noOverflow(page);
    await expect(sheet.getByRole('button', { name: 'Aplicar filtros' })).toBeInViewport();
    await sheet.getByRole('button', { name: 'Aplicar filtros' }).click();
    await expect(page).toHaveURL(/max_iptu=1000/);
    await expect(page.getByRole('heading', { name: 'Casa Jardim 3' })).toHaveCount(0);
    await page.getByRole('button', { name: /Remover filtro IPTU máximo/ }).click();
    await expect(page.getByRole('heading', { name: 'Casa Jardim 3' })).toBeVisible();
    await page.getByRole('combobox', { name: 'Imóveis por página', exact: true }).selectOption('5');
    await page.getByLabel('Ordenação').selectOption('price_asc');
    await expect(page.getByRole('article').first()).toContainText('Casa Jardim 5');
    await page.getByRole('button', { name: 'Próxima' }).click();
    await expect(page).toHaveURL(/page=2/);
    const url = new URL(page.url());
    expect(Object.fromEntries(url.searchParams)).toMatchObject({ sort: 'price_asc', status: 'available', bedrooms: '3', address_city: 'Belo Horizonte', min_price: '300000.00', max_price: '950000.00' });
    await expect(page.getByRole('article').first()).toContainText('Casa Jardim 3');
    await page.reload();
    await expect(page.getByRole('article').first()).toContainText('Casa Jardim 3');
    await page.getByRole('button', { name: 'Limpar filtros' }).click();
    await expect(page).not.toHaveURL(/address_city|bedrooms|status|page=2/);
    await expect(page.getByRole('article').first()).toContainText('Casa Jardim 2');
});

test('detalhes privados e página pública com Open Graph', async ({ page }) => {
    await login(page);
    await page.getByRole('link', { name: 'Visualizar Casa Jardim 0', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Dados do proprietário' })).toBeVisible();
    await page.getByRole('button', { name: 'Ampliar foto principal' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.getByRole('link', { name: 'Ver página pública' }).click();
    await expect(page.getByRole('heading', { name: 'Casa Jardim 0' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Navegação interna' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Dados do proprietário' })).toHaveCount(0);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', 'Casa Jardim 0');
    const html = await (await page.request.get(page.url())).text();
    expect(html).toContain('content="R$ 610.000,00');
    expect(html).toContain('property="og:image:type" content="image/jpeg"');
    const cover = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect((await page.request.get(cover!)).headers()['content-type']).toContain('image/jpeg');
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /\/storage\/properties\/1\/capa\.jpg$/);
    await noOverflow(page);
    await screenshot(page, '05-pagina-publica');
});

test('criação, foto multipart, edição, publicação, compartilhamento e exclusão confirmada', async ({ page, context }, info) => {
    const title = `Ficha ${info.project.name}`;
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.addInitScript(() => {
        Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    });
    await login(page);
    await page.getByRole('navigation', { name: 'Navegação interna' }).getByRole('link', { name: 'Cadastrar' }).click();
    await page.getByRole('button', { name: 'Salvar imóvel' }).click();
    await expect(page.getByRole('alert')).toContainText('Informe um valor de venda');
    await page.getByRole('button', { name: 'Editar título manualmente' }).click();
    await page.getByLabel('Título do imóvel').fill(title);
    await page.getByLabel('Valor de venda (R$ mil)').fill('620,5');
    await page.getByLabel('IPTU anual').fill('875');
    await page.getByRole('button', { name: 'Proprietário', exact: true }).click();
    await page.getByLabel('Nome', { exact: true }).fill('Proprietária de teste');
    await page.getByRole('button', { name: 'Fotos', exact: true }).click();

    const photo = await page.request.get('/storage/properties/1/capa.jpg');
    expect(photo.ok()).toBe(true);
    await page.getByLabel('Foto principal', { exact: true }).setInputFiles({
        name: 'capa.jpg', mimeType: 'image/jpeg', buffer: await photo.body(),
    });
    await page.getByRole('button', { name: 'Salvar imóvel' }).click();
    const card = page.getByRole('article').filter({ has: page.getByRole('heading', { name: title, exact: true }) });
    await expect(card).toBeVisible();
    await expect(card.getByRole('button', { name: 'Compartilhar' })).toBeDisabled();
    const edit = card.getByRole('link', { name: 'Editar' });
    await edit.click();
    await expect(page.getByLabel('IPTU anual')).toHaveValue('875.00');
    await expect(page.getByAltText('Prévia da capa')).toBeVisible();
    await expect(page.getByLabel('Valor de venda (R$ mil)')).toHaveValue('620,5');
    await screenshot(page, 'melhorias-edicao');
    await screenshot(page, '04-edicao');
    await page.getByLabel('Título do imóvel').fill(title + ' editada');
    await page.getByRole('button', { name: 'Salvar imóvel' }).click();
    const edited = page.getByRole('article').filter({ has: page.getByRole('heading', { name: title + ' editada', exact: true }) });
    await edited.getByRole('button', { name: 'Mais opções' }).click();
    let dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('button', { name: 'Vender', exact: true })).toHaveCount(0);
    await dialog.getByRole('button', { name: 'Publicar', exact: true }).click();
    await dialog.getByRole('button', { name: 'Confirmar publicar' }).click();
    await expect(edited.getByRole('button', { name: 'Compartilhar' })).toBeEnabled();
    await edited.getByRole('button', { name: 'Compartilhar' }).click();
    dialog = page.getByRole('dialog', { name: 'Compartilhar imóvel' });
    const link = await dialog.getByLabel('Link público').inputValue();
    expect(link).toMatch(/\/p\/ficha-\d+x\d+-[a-f\d]+$/);
    expect(decodeURIComponent((await dialog.getByRole('link', { name: 'WhatsApp' }).getAttribute('href'))!)).toContain(link);
    await dialog.getByRole('button', { name: 'Copiar link' }).click();
    await expect(dialog.getByRole('status')).toContainText('Link copiado');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(link);
    await screenshot(page, 'melhorias-compartilhamento');
    await screenshot(page, '03-compartilhar');
    const publicPage = await context.newPage();
    await publicPage.goto(link);
    await expect(publicPage.getByRole('heading', { name: title + ' editada' })).toBeVisible();
    await publicPage.close();

    await dialog.getByRole('button', { name: 'Fechar' }).click();
    await edited.getByRole('button', { name: 'Mais opções' }).click();
    await page.getByRole('button', { name: 'Excluir', exact: true }).click();
    await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
    await expect(edited).toBeVisible();
    await page.getByRole('button', { name: 'Excluir', exact: true }).click();
    await page.getByRole('button', { name: 'Confirmar excluir' }).click();
    await expect(edited).toHaveCount(0);
    await noOverflow(page);
});

test('falha de rede recuperável e dashboard sem sobreposição', async ({ page }) => {
    await page.route('**/api/properties', route => route.abort(), { times: 1 });
    await login(page);
    await expect(page.getByRole('alert')).toBeVisible();
    await page.getByRole('button', { name: 'Tentar novamente' }).click();
    await expect(page.getByRole('heading', { name: 'Casa Jardim 0' })).toBeVisible();
    await noOverflow(page);
    const nav = page.getByRole('navigation', { name: 'Navegação interna' });
    await expect(nav).toBeInViewport();
    if ((page.viewportSize()?.width ?? 0) < 1024) {
        const perPage = page.getByRole('combobox', { name: 'Imóveis por página', exact: true });
        await perPage.scrollIntoViewIfNeeded();
        await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
        const control = await perPage.boundingBox();
        const bar = await nav.boundingBox();
        expect(control!.y + control!.height).toBeLessThanOrEqual(bar!.y);
        await page.evaluate(() => window.scrollTo(0, 0));
    }
    await screenshot(page, '01-dashboard');
});

test('cancela busca antiga quando a consulta muda', async ({ page }) => {
    await login(page);
    const obsolete = /\/api\/properties\?search=consulta-antiga$/;
    let release!: () => void;
    const delay = new Promise<void>(resolve => { release = resolve; });
    await page.route(obsolete, async route => {
        await delay;
        await route.abort().catch(() => {});
    });
    const old = page.waitForRequest(obsolete);
    const failed = page.waitForEvent('requestfailed', { predicate: request => obsolete.test(request.url()) });
    try {
        await page.getByLabel(searchLabel).fill('consulta-antiga');
        await old;
        await page.getByLabel(searchLabel).fill('#1');
        expect((await failed).failure()?.errorText).toContain('ERR_ABORTED');
        await expect(page.getByRole('heading', { name: 'Casa Jardim 0' })).toBeVisible();
    } finally {
        release();
    }
});

test('Web Share recebe o slug definitivo e mantém fallback ao falhar', async ({ page }) => {
    await page.addInitScript(() => {
        let attempts = 0;
        Object.defineProperty(navigator, 'canShare', { value: () => true });
        Object.defineProperty(navigator, 'share', {
            value: async ({ url }: ShareData) => {
                if (attempts++ === 0) throw new Error('Falha simulada');
                sessionStorage.setItem('shared-url', url ?? '');
            },
        });
    });
    await login(page);
    const card = page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'Casa Jardim 0', exact: true }) });
    await card.getByRole('button', { name: 'Compartilhar' }).click();
    const dialog = page.getByRole('dialog', { name: 'Compartilhar imóvel' });
    const native = dialog.getByRole('button', { name: 'Compartilhar pelo dispositivo' });
    await native.click();
    await expect(dialog.getByRole('status')).toContainText('compartilhamento do dispositivo falhou');
    await expect(dialog.getByRole('link', { name: 'WhatsApp' })).toBeVisible();
    await native.click();
    await expect(dialog).toHaveCount(0);
    expect(await page.evaluate(() => sessionStorage.getItem('shared-url'))).toBe(new URL('/p/casa-jardim-0', page.url()).href);
});

test('API valida parâmetros e mantém busca textual avançada e desempate', async ({ page }) => {
    await login(page);
    const token = await page.evaluate(() => localStorage.getItem('token'));
    const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' };
    for (const query of ['sort=inexistente', 'bedrooms=-1', 'min_price=100&max_price=5', 'search%5B%5D=Casa']) {
        const response = await page.request.get('/api/properties', { headers, params: new URLSearchParams(query) });
        expect(response.status()).toBe(422);
    }
    const response = await page.request.get('/api/properties', {
        headers, params: { search: 'casa 3 quartos iptu até 1.000', sort: 'price_asc' },
    });
    expect(response.status()).toBe(200);
    expect((await response.json()).data.map(({ id }: { id: number }) => id)).toEqual([6, 1, 5, 7, 2]);
    const mixed = await page.request.get('/api/properties', {
        headers, params: { min_price: '500000.50', max_price: '610000', sort: 'price_asc', address_city: 'Belo Horizonte' },
    });
    expect(mixed.status()).toBe(200);
    expect((await mixed.json()).total).toBe(3);
});

test('duplica com novo slug, vende e mantém o anúncio público existente', async ({ page }, info) => {
    await login(page);
    const token = await page.evaluate(() => localStorage.getItem('token'));
    const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' };
    const title = `Imóvel para venda ${info.project.name}`;
    const response = await page.request.post('/api/properties', {
        headers, data: { title, property_type: 'casa', status: 'available', sale_price: 300000 },
    });
    expect(response.status()).toBe(201);
    const original = await response.json();
    await page.goto(`/?search=%23${original.id}`);
    const card = page.getByRole('article').filter({ hasText: title });
    await card.getByRole('button', { name: 'Mais opções' }).click();
    await page.getByRole('button', { name: 'Duplicar', exact: true }).click();
    const copyResponse = page.waitForResponse(result => result.url().endsWith(`/api/properties/${original.id}/duplicate`));
    await page.getByRole('button', { name: 'Confirmar duplicar' }).click();
    const copy = await (await copyResponse).json();
    expect(copy.status).toBe('draft');
    expect(copy.slug).not.toBe(original.slug);
    expect((await page.request.get(`/api/public/properties/${copy.slug}`, { headers })).status()).toBe(404);

    await card.getByRole('button', { name: 'Mais opções' }).click();
    await page.getByRole('button', { name: 'Vender', exact: true }).click();
    await page.getByRole('button', { name: 'Confirmar vender' }).click();
    await expect(card).toContainText('Vendido');
    await card.getByRole('button', { name: 'Mais opções' }).click();
    await expect(page.getByRole('button', { name: 'Vender', exact: true })).toHaveCount(0);
    await page.getByRole('link', { name: 'Ver página pública' }).click();
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
    await expect(page.locator('.status.sold')).toHaveText('Vendido');
    const fallback = new URL('/images/og-institucional.jpg', page.url()).href;
    const html = await (await page.request.get(page.url())).text();
    expect(html).toContain(`property="og:image" content="${fallback}"`);
    const image = await page.request.get(fallback);
    expect(image.ok()).toBe(true);
    expect(image.headers()['content-type']).toContain('image/jpeg');
    for (const id of [copy.id, original.id]) {
        expect((await page.request.delete(`/api/properties/${id}`, { headers })).ok()).toBe(true);
    }
});

test('link público volta após login e recupera falha de rede ao reservar', async ({ page }, info) => {
    const session = await page.request.post('/api/login', { data: { email, password } });
    const { token } = await session.json();
    const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' };
    const response = await page.request.post('/api/properties', {
        headers, data: { title: `Visita em teste ${info.project.name}`, property_type: 'casa', status: 'available', sale_price: 300000 },
    });
    expect(response.status()).toBe(201);
    const property = await response.json();
    const route = `/api/properties/${property.id}/reserve`;
    await page.goto(`/p/${property.slug}`);
    await expect(page.getByRole('heading', { name: 'Área do corretor' })).toHaveCount(0);
    await page.getByRole('link', { name: 'Acesso para corretores' }).click();
    await page.getByLabel('E-mail').fill(email);
    await page.getByLabel('Senha').fill(password);
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/p/${property.slug}$`));
    await noOverflow(page);
    await page.route(`**${route}`, intercepted => intercepted.abort(), { times: 1 });
    await page.getByRole('button', { name: 'RESERVAR', exact: true }).click();
    await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('Verifique sua conexão e tente novamente.');

    const other = await page.request.post('/api/login', { data: { email: 'outro-corretor@example.test', password } });
    const otherToken = (await other.json()).token;
    const otherHeaders = { ...headers, Authorization: `Bearer ${otherToken}` };
    const attempts = await Promise.all([
        page.request.post(route, { headers }),
        page.request.post(route, { headers: otherHeaders }),
    ]);
    expect(attempts.map(attempt => attempt.status()).sort()).toEqual([201, 409]);
    if (attempts[1].status() === 201) {
        const { active_reservation } = await attempts[1].json();
        const release = await page.request.post(`/api/properties/${property.id}/release-reservation`, {
            headers: otherHeaders, data: { reservation_id: active_reservation.id },
        });
        expect(release.status()).toBe(200);
        expect((await page.request.post(route, { headers })).status()).toBe(201);
    }
    await page.reload();
    await expect(page.getByText('Reservado por você')).toBeVisible();
    await page.getByRole('button', { name: 'Liberar imóvel' }).click();
    await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
    await expect(page.getByText('Imóvel liberado para visitas.')).toBeVisible();
    await page.getByRole('button', { name: 'Sair da área do corretor' }).click();
    await expect(page.getByRole('heading', { name: 'Área do corretor' })).toHaveCount(0);
    expect((await page.request.get(`/api/properties/${property.id}/internal`, {
        headers: { Accept: 'application/json' },
    })).status()).toBe(401);
    await page.request.delete(`/api/properties/${property.id}`, { headers });
});
