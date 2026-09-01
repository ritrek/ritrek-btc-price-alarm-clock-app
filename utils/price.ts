import { BtcPrice } from '@/types';

const KRAKEN_TICKER = 'https://api.kraken.com/0/public/Ticker?pair=XBTUSD';
const KRAKEN_OHLC = 'https://api.kraken.com/0/public/OHLC?pair=XBTUSD&interval=15';
const ATTEMPTS = 3;
const RETRY_DELAY_MS = 5_000;
const REQUEST_TIMEOUT_MS = 10_000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetries<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < ATTEMPTS) {
        await delay(RETRY_DELAY_MS);
      }
    }
  }
  throw lastError;
}

async function fetchKrakenJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch Bitcoin price: ${response.status}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

function readTickerUsd(data: unknown): number {
  const result = (data as { result?: { XXBTZUSD?: { c?: string[] } } })?.result?.XXBTZUSD?.c?.[0];
  const usd = Number(result);
  if (!Number.isFinite(usd) || usd <= 0) {
    throw new Error('Failed to parse Bitcoin price');
  }
  return usd;
}

export type LatestBtcUsd = {
  usd: number;
  collectedAt: number;
};

let latestBtcUsd: LatestBtcUsd | null = null;
const latestListeners = new Set<(value: LatestBtcUsd) => void>();

function rememberCurrentBtcUsd(usd: number, collectedAt: number = Date.now()): LatestBtcUsd {
  latestBtcUsd = { usd, collectedAt };
  for (const listener of latestListeners) {
    listener(latestBtcUsd);
  }
  return latestBtcUsd;
}

export function getLatestBtcUsd(): LatestBtcUsd | null {
  return latestBtcUsd;
}

export function subscribeLatestBtcUsd(listener: (value: LatestBtcUsd) => void): () => void {
  latestListeners.add(listener);
  if (latestBtcUsd) {
    listener(latestBtcUsd);
  }
  return () => {
    latestListeners.delete(listener);
  };
}

export function noteLiveBtcUsd(usd: number): void {
  rememberCurrentBtcUsd(usd);
}

export async function getCurrentBtcUsd(): Promise<BtcPrice> {
  return withRetries(async () => {
    const usd = readTickerUsd(await fetchKrakenJson(KRAKEN_TICKER));
    const collectedAt = Date.now();
    rememberCurrentBtcUsd(usd, collectedAt);
    return { usd, at: new Date(collectedAt).toISOString() };
  });
}

export async function getBtcUsdHoursAgo(hours: number = 8): Promise<BtcPrice> {
  return withRetries(async () => {
    const target = Math.floor(Date.now() / 1000) - hours * 3600;
    const since = target - 3600;
    const data = (await fetchKrakenJson(`${KRAKEN_OHLC}&since=${since}`)) as {
      result?: { XXBTZUSD?: [number, string, string, string, string, string, string, number][] };
    };
    const candles = data.result?.XXBTZUSD;
    if (!candles?.length) {
      throw new Error('Failed to parse Bitcoin history');
    }
    let closest = candles[0];
    let closestDelta = Math.abs(closest[0] - target);
    for (const candle of candles) {
      const delta = Math.abs(candle[0] - target);
      if (delta < closestDelta) {
        closest = candle;
        closestDelta = delta;
      }
    }
    const usd = Number(closest[4]);
    if (!Number.isFinite(usd) || usd <= 0) {
      throw new Error('Failed to parse historical Bitcoin price');
    }
    return { usd, at: new Date(closest[0] * 1000).toISOString() };
  });
}

export function formatUsd(usd: number): string {
  return usd.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: usd >= 1000 ? 0 : 2,
  });
}

const ONES = [
  '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
  'seventeen', 'eighteen', 'nineteen',
];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

function chunkToWords(n: number): string {
  if (n === 0) {
    return '';
  }
  if (n < 20) {
    return ONES[n];
  }
  if (n < 100) {
    const remainder = n % 10;
    return remainder ? `${TENS[Math.floor(n / 10)]}-${ONES[remainder]}` : TENS[Math.floor(n / 10)];
  }
  const remainder = n % 100;
  const hundred = `${ONES[Math.floor(n / 100)]} hundred`;
  return remainder ? `${hundred} ${chunkToWords(remainder)}` : hundred;
}

export function usdToSpokenWords(usd: number): string {
  const rounded = Math.round(usd);
  if (rounded === 0) {
    return 'zero US dollars';
  }
  const parts: string[] = [];
  const millions = Math.floor(rounded / 1_000_000);
  const thousands = Math.floor((rounded % 1_000_000) / 1000);
  const rest = rounded % 1000;
  if (millions) {
    parts.push(`${chunkToWords(millions)} million`);
  }
  if (thousands) {
    parts.push(`${chunkToWords(thousands)} thousand`);
  }
  if (rest) {
    parts.push(chunkToWords(rest));
  }
  return `${parts.join(', ')} US dollars`;
}
