import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parsePriceThousands, reaisToThousands } from '../../resources/js/utils/price.ts';

test('interpreta milhares, agrupadores e milhões em português brasileiro', () => {
    assert.equal(parsePriceThousands('250'), '250000.00');
    assert.equal(parsePriceThousands('650,5'), '650500.00');
    assert.equal(parsePriceThousands('1.200'), '1200000.00');
    assert.equal(parsePriceThousands('1,5 milhão'), '1500000.00');
    assert.equal(parsePriceThousands('2 milhões'), '2000000.00');
    assert.equal(parsePriceThousands('0'), '0.00');
});

test('preserva os centavos e valores existentes já expressos em reais', () => {
    for (const reais of ['250000.00', '1200000.00', '650500.37', '0.01', '9999999999999.99']) {
        assert.equal(parsePriceThousands(reaisToThousands(reais)), reais);
    }
});

test('rejeita entradas inválidas, ambíguas ou fora da precisão monetária', () => {
    for (const input of ['', '-650', '650.5', '1,200.5', '1.20.0', '12e3', '1,000001', '10.000.000.000']) {
        assert.equal(parsePriceThousands(input), null, input);
    }
});
