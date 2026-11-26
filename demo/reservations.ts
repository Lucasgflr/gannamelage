import type { VisitReservation } from '../resources/js/types/property';

export const profiles = ['Ana Exemplo', 'Rafael Modelo'];
export const sessionKey = 'gannamelage-demo:v1:profile';
const historyKey = 'gannamelage-demo:v1:reservations';
const offsetKey = 'gannamelage-demo:v1:clock';
const brasilia = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
});

interface Entry extends Omit<VisitReservation, 'mine'> {
    propertyId: number;
    releasedAt?: string;
    releasedBy?: string;
    releaseReason?: 'manual' | 'commercial_status' | 'deleted';
}

function history(): Entry[] {
    return JSON.parse(localStorage.getItem(historyKey) ?? '[]') as Entry[];
}

function now() {
    return new Date(Date.now() + Number(localStorage.getItem(offsetKey) ?? 0));
}

function nextMidnight(date: Date) {
    const [year, month, day] = brasilia.format(date).split('-').map(Number);
    // Brazil uses UTC−03:00 year-round under the current time-zone rules.
    return new Date(Date.UTC(year, month - 1, day + 1, 3));
}

export function advanceDemoDay() {
    localStorage.setItem(offsetKey, String(nextMidnight(now()).getTime() - Date.now()));
}

export function activeReservation(propertyId: number, profile: string): VisitReservation | null {
    const time = now().getTime();
    const entry = history().find(item => item.propertyId === propertyId && !item.releasedAt && Date.parse(item.expires_at) > time);
    if (!entry) return null;
    const { id, broker, reserved_at, expires_at } = entry;
    return { id, broker, reserved_at, expires_at, mine: broker === profile };
}

export function reserve(propertyId: number, profile: string) {
    const entries = history();
    const date = now();
    const entry = {
        id: Math.max(0, ...entries.map(item => item.id)) + 1, propertyId, broker: profile,
        reserved_at: date.toISOString(), expires_at: nextMidnight(date).toISOString(),
    };
    localStorage.setItem(historyKey, JSON.stringify([...entries, entry]));
    return activeReservation(propertyId, profile);
}

export function release(id: number, profile: string, reason: Entry['releaseReason']) {
    const time = now().toISOString();
    const entries = history().map(entry => entry.id === id
        ? { ...entry, releasedAt: time, releasedBy: profile, releaseReason: reason } : entry);
    localStorage.setItem(historyKey, JSON.stringify(entries));
}
