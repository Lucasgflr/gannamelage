import { expect, test as base, type Page } from '@playwright/test';

const search = 'Buscar por título, localização ou código';

const test = base.extend<{ staticOnly: void }>({
    staticOnly: [async ({ page, baseURL }, use) => {
        const forbidden: string[] = [];
        const origin = new URL(baseURL!);
        await page.route('**/*', route => {
            const request = route.request();
            const url = new URL(request.url());
            if (url.origin !== origin.origin || !url.pathname.startsWith(origin.pathname) ||
                ['xhr', 'fetch'].includes(request.resourceType())) {
                forbidden.push(url.href);
                return route.abort();
            }
            return route.continue();
        });
        await use();
        expect(forbidden).toEqual([]);
    }, { auto: true }],
});

async function enter(page: Page) {
    await page.getByRole('button', { name: 'Entrar na demo' }).click();
}

test('login fictício, sessão por aba, link direto e saída', async ({ page }) => {
    await page.goto('#/properties/1/view');
    await expect(page).toHaveURL(/\/gannamelage\/#\/login$/);
    await expect(page.getByLabel('Ambiente demonstrativo')).toContainText('Dados fictícios');
    await expect(page.locator('input[type=password]')).toHaveCount(0);
    await page.getByRole('combobox', { name: 'Perfil fictício' }).selectOption('Rafael Modelo');
    await enter(page);
    await expect(page.getByRole('heading', { name: 'Casa de demonstração no Bosque' })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Casa de demonstração no Bosque' })).toBeVisible();
    await page.getByRole('button', { name: 'Sair' }).click();
    await expect(page).toHaveURL(/#\/login$/);
});

test('cards, pesquisa por código, filtros combinados e paginação', async ({ page }) => {
    await page.goto('./');
    await enter(page);
    await expect(page.getByRole('status')).toHaveText('9 imóveis encontrados');
    const photo = page.getByRole('article').first().locator('img');
    await expect(photo).toHaveJSProperty('complete', true);
    expect(await photo.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
    await expect(photo).toHaveAttribute('src', /^\/gannamelage\/assets\//);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

    await page.getByLabel(search).fill('BOSQUE');
    await expect(page.getByRole('status')).toHaveText('1 imóvel encontrado');
    await page.getByLabel(search).fill('código 1');
    await expect(page).toHaveURL(/search=c%C3%B3digo\+1/);
    await expect(page.getByRole('status')).toHaveText('1 imóvel encontrado');
    await expect(page.getByRole('heading', { name: 'Casa de demonstração no Bosque' })).toBeVisible();
    await page.getByRole('button', { name: 'Limpar filtros' }).click();
    await page.getByRole('button', { name: 'Disponível', exact: true }).click();
    await page.getByRole('button', { name: 'Filtros', exact: true }).click();
    const sheet = page.getByRole('dialog');
    await sheet.getByRole('combobox', { name: 'Tipo', exact: true }).selectOption('casa');
    await sheet.getByRole('combobox', { name: 'Cidade', exact: true }).selectOption('Vila Exemplo');
    await sheet.getByRole('combobox', { name: 'Bairro', exact: true }).selectOption('Jardim Modelo');
    await sheet.getByRole('combobox', { name: 'Cidade', exact: true }).selectOption('Cidade Modelo');
    await expect(sheet.getByRole('combobox', { name: 'Bairro', exact: true })).toHaveValue('Jardim Modelo');
    await sheet.getByRole('combobox', { name: 'Cidade', exact: true }).selectOption('Vila Exemplo');
    await sheet.getByLabel('Quartos mínimos').fill('3');
    await sheet.getByLabel('Preço mínimo (R$ mil)').fill('300');
    await sheet.getByLabel('Preço máximo (R$ mil)').fill('800');
    await sheet.getByRole('button', { name: 'Aplicar filtros' }).click();
    await expect(page.getByRole('status')).toHaveText('2 imóveis encontrados');
    expect(new URL(page.url()).hash).toContain('address_city=Vila+Exemplo');
    await page.getByRole('button', { name: 'Limpar filtros' }).click();
    await expect(page.getByRole('status')).toHaveText('9 imóveis encontrados');
    await page.getByRole('combobox', { name: 'Imóveis por página' }).selectOption('5');
    await expect(page.getByRole('article')).toHaveCount(5);
    await page.getByRole('combobox', { name: 'Ordenação' }).selectOption('price_asc');
    await expect(page).toHaveURL(/per_page=5&sort=price_asc/);
    await page.getByRole('button', { name: 'Próxima' }).click();
    await expect(page.getByRole('status')).toHaveText('9 imóveis encontrados');
    expect(new URL(page.url()).hash).toContain('page=2');
    expect(new URL(page.url()).hash).toContain('sort=price_asc');
    await expect(page.getByRole('article')).toHaveCount(4);
});

test('cadastro e edição locais, publicação simulada e anúncio público por hash', async ({ page }) => {
    await page.goto('./');
    await enter(page);
    await page.getByRole('link', { name: 'Cadastrar', exact: true }).click();
    await page.getByRole('button', { name: 'Editar título manualmente' }).click();
    await page.getByLabel('Título do imóvel').fill('Imóvel inventado pelo teste');
    await page.getByLabel('Valor de venda (R$ mil)').fill('650,5');
    await page.getByRole('combobox', { name: 'Cidade', exact: true }).fill('Caxambu');
    await page.getByRole('option', { name: 'Caxambu', exact: true }).click();
    await page.getByRole('combobox', { name: 'Bairro', exact: true }).fill('Bairro Novo Fictício');
    await page.getByRole('button', { name: 'Fotos', exact: true }).click();
    await page.getByLabel('Foto principal', { exact: true }).setInputFiles({
        name: 'foto-ficticia.png',
        mimeType: 'image/png',
        buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMBAAZ/tmpAAAAASUVORK5CYII=', 'base64'),
    });
    await expect(page.getByAltText('Prévia da capa')).toHaveAttribute('src', /^blob:/);
    await page.getByRole('button', { name: 'Salvar imóvel' }).click();
    const original = page.getByRole('article').filter({ hasText: 'Imóvel inventado pelo teste' });
    await expect(original.getByRole('button', { name: 'Compartilhar' })).toBeDisabled();
    await expect(original.locator('img')).toHaveAttribute('src', /^\/gannamelage\/assets\/casa-/);
    await page.getByRole('button', { name: 'Filtros', exact: true }).click();
    const sheet = page.getByRole('dialog');
    await expect(sheet.getByRole('combobox', { name: 'Bairro', exact: true })).toBeDisabled();
    await expect(sheet.getByText('Selecione uma cidade primeiro')).toBeVisible();
    const city = sheet.getByRole('combobox', { name: 'Cidade', exact: true });
    const neighborhood = sheet.getByRole('combobox', { name: 'Bairro', exact: true });
    await city.selectOption('Caxambu');
    await neighborhood.selectOption('Bairro Novo Fictício');
    await city.selectOption('Vila Exemplo');
    await expect(neighborhood).toHaveValue('');
    await expect(neighborhood.getByRole('option', { name: 'Bairro Novo Fictício' })).toHaveCount(0);
    await sheet.getByRole('button', { name: 'Fechar' }).click();
    await original.getByRole('link', { name: 'Editar' }).click();
    await expect(page.getByLabel('Valor de venda (R$ mil)')).toHaveValue('650,5');
    await page.getByLabel('Título do imóvel').fill('Imóvel inventado e editado');
    await page.getByRole('button', { name: 'Salvar imóvel' }).click();
    await page.reload();
    const edited = page.getByRole('article').filter({ hasText: 'Imóvel inventado e editado' });
    await edited.getByRole('button', { name: 'Mais opções' }).click();
    await page.getByRole('button', { name: 'Publicar', exact: true }).click();
    await page.getByRole('button', { name: 'Confirmar publicar' }).click();
    await edited.getByRole('button', { name: 'Mais opções' }).click();
    await page.getByRole('link', { name: 'Ver página pública' }).click();
    await expect(page).toHaveURL(/\/gannamelage\/#\/p\/imovel-demo-10$/);
    await expect(page.getByRole('heading', { name: 'Imóvel inventado e editado' })).toBeVisible();
    await expect(page.getByText(/650\.500,00/)).toBeVisible();
    await expect(page.getByLabel('Ambiente demonstrativo')).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Navegação interna' })).toHaveCount(0);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Imóvel inventado e editado' })).toBeVisible();
});

test('valida localização antiga da URL e mantém valores em reais', async ({ page }) => {
    await page.goto('#/?address_city=Vila+Exemplo&address_neighborhood=Bairro+Inexistente&min_price=450000');
    await enter(page);
    await expect(page).not.toHaveURL(/Bairro\+Inexistente/);
    await expect(page).toHaveURL(/min_price=450000/);
    await page.getByRole('button', { name: 'Filtros', exact: true }).click();
    await expect(page.getByLabel('Preço mínimo (R$ mil)')).toHaveValue('450');
});

test('a miniatura geral está no HTML estático', async ({ page }) => {
    await page.goto('#/p/imovel-demo-1');
    const response = await page.request.get(page.url());
    const html = await response.text();
    expect(html).toContain('property="og:image" content="https://lucasgflr.github.io/gannamelage/og-institucional.jpg"');
    const image = await page.request.get('./og-institucional.jpg');
    expect(image.ok()).toBe(true);
    expect(image.headers()['content-type']).toContain('image/jpeg');
});

test('catálogo local e título automático com complemento persistente', async ({ page }) => {
    await page.goto('./');
    await enter(page);
    await page.getByRole('link', { name: 'Cadastrar', exact: true }).click();
    await expect(page.getByRole('combobox', { name: 'Estado', exact: true })).toHaveValue(/MG/);
    await expect(page.getByRole('combobox', { name: 'Cidade', exact: true })).toHaveValue('São Lourenço');
    const preview = page.locator('fieldset').getByText('Título do imóvel', { exact: true }).locator('..');
    const neighborhood = page.getByRole('combobox', { name: 'Bairro', exact: true });
    const type = page.getByRole('combobox', { name: 'Tipo do imóvel' });
    await expect(preview).toContainText('Casa em São Lourenço');
    await neighborhood.fill('Centro');
    await expect(preview).toContainText('Casa no Centro');
    await type.selectOption('apartamento');
    await neighborhood.fill('Federal');
    await expect(preview).toContainText('Apartamento no Federal');
    const city = page.getByRole('combobox', { name: 'Cidade', exact: true });
    await city.fill('Caxambu');
    await page.getByRole('option', { name: 'Caxambu', exact: true }).click();
    await expect(neighborhood).toHaveValue('');
    await type.selectOption('casa');
    await expect(preview).toContainText('Casa em Caxambu');
    await city.fill('sao lourenco');
    await page.getByRole('option', { name: 'São Lourenço', exact: true }).click();
    await neighborhood.fill('Vila Nova');
    await page.getByLabel('Complemento do título').fill('com piscina');
    await expect(page.getByText('Casa na Vila Nova com piscina', { exact: false }).first()).toBeVisible();

    const state = page.getByRole('combobox', { name: 'Estado', exact: true });
    await state.fill('rio de janeiro');
    await state.press('ArrowDown');
    await state.press('Enter');
    await expect(city).toHaveValue('');
    await expect(neighborhood).toBeDisabled();
    await city.fill('petropolis');
    await page.getByRole('option', { name: 'Petrópolis', exact: true }).click();
    await expect(page.getByText('Casa em Petrópolis com piscina', { exact: false }).first()).toBeVisible();
    await page.getByLabel('Valor de venda (R$ mil)').fill('650');
    await page.getByRole('button', { name: 'Salvar imóvel' }).click();
    const created = page.getByRole('article').filter({ hasText: 'Casa em Petrópolis com piscina' });
    await created.getByRole('link', { name: 'Editar' }).click();
    await expect(page.getByLabel('Complemento do título')).toHaveValue('com piscina');
});

test('área privada, perfis, filtros, liberação e expiração das visitas', async ({ page }) => {
    await page.goto('#/p/imovel-demo-1');
    await expect(page.getByRole('heading', { name: 'Casa de demonstração no Bosque' })).toBeVisible();
    const brokerArea = page.getByRole('heading', { name: 'Área do corretor' });
    await expect(brokerArea).toHaveCount(0);
    await page.getByRole('link', { name: 'Acesso para corretores' }).click();
    await enter(page);
    await expect(page).toHaveURL(/#\/p\/imovel-demo-1$/);
    await expect(brokerArea).toBeVisible();
    const reserve = page.getByRole('button', { name: 'RESERVAR', exact: true });
    await reserve.click();
    await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
    await expect(page.getByText('Imóvel reservado com sucesso até o final do dia.')).toBeVisible();
    await page.goto('#/?visit=mine');
    await expect(page.getByRole('article')).toHaveCount(1);
    await expect(page.getByRole('article').first()).toContainText('Reservado por você');

    await page.goto('#/p/imovel-demo-1');
    await page.getByRole('button', { name: 'Sair da área do corretor' }).click();
    await expect(brokerArea).toHaveCount(0);
    await page.getByRole('link', { name: 'Acesso para corretores' }).click();
    await page.getByRole('combobox', { name: 'Perfil fictício' }).selectOption('Rafael Modelo');
    await enter(page);
    await expect(page.getByText('Reservado por Ana Exemplo')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Liberar imóvel' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Simular próximo dia' }).click();
    await expect(reserve).toBeVisible();
    await reserve.click();
    await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
    await page.getByRole('button', { name: 'Liberar imóvel' }).click();
    await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
    await expect(page.getByText('Imóvel liberado para visitas.')).toBeVisible();
    await expect(reserve).toBeVisible();
});
