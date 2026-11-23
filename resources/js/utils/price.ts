const maxCents = 999_999_999_999_999n;
const formatThousands = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 5 });

export function parsePriceThousands(input: string): string | null {
    const match = input.trim().match(/^(\d+|\d{1,3}(?:\.\d{3})+)(?:,(\d+))?(?:\s*milh(?:ão|ões))?$/iu);
    if (!match) return null;
    const scale = /milh/iu.test(input) ? 8 : 5;
    const fraction = (match[2] ?? '').replace(/0+$/, '');
    if (fraction.length > scale) return null;
    const cents = BigInt(match[1].replaceAll('.', '') + fraction.padEnd(scale, '0'));
    if (cents > maxCents) return null;
    return `${cents / 100n}.${String(cents % 100n).padStart(2, '0')}`;
}

export function reaisToThousands(value?: string | number | null) {
    return value == null || value === '' || !Number.isFinite(Number(value))
        ? '' : formatThousands.format(Number(value) / 1000);
}
