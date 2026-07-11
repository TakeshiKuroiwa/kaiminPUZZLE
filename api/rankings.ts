import { Redis } from '@upstash/redis';

type Difficulty = 'easy' | 'normal' | 'hard' | 'veryhard';

interface RankingEntry {
  name: string;
  score: number;
  date: string;
  difficulty: Difficulty;
}

const redisUrl = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

if (!redisUrl || !redisToken) {
  throw new Error('Redis environment variables are missing');
}

const redis = new Redis({
  url: redisUrl,
  token: redisToken,
});
const difficulties: Difficulty[] = ['easy', 'normal', 'hard', 'veryhard'];
const maxStoredEntries = 100;
const maxVisibleEntries = 10;

function isDifficulty(value: unknown): value is Difficulty {
  return typeof value === 'string' && difficulties.includes(value as Difficulty);
}

function sanitizeName(value: unknown) {
  return String(value ?? '')
    .trim()
    .replace(/[<>]/g, '')
    .slice(0, 12);
}

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, {
    ...init,
    headers: {
      'Cache-Control': 'no-store',
      ...init?.headers,
    },
  });
}

function parseRankingEntry(value: unknown): RankingEntry | null {
  if (typeof value !== 'string') return null;

  try {
    const parsed = JSON.parse(value) as RankingEntry;
    if (
      typeof parsed.name === 'string' &&
      typeof parsed.score === 'number' &&
      typeof parsed.date === 'string' &&
      isDifficulty(parsed.difficulty)
    ) {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
}

async function readRankings(difficulty: Difficulty) {
  const rawEntries = await redis.zrange<string[]>(
    `rankings:${difficulty}`,
    0,
    maxVisibleEntries - 1,
    { rev: true },
  );

  return rawEntries
    .map(parseRankingEntry)
    .filter((entry): entry is RankingEntry => entry !== null);
}

export default async function handler(request: Request) {
  const url = new URL(request.url);

  if (request.method === 'GET') {
    const difficulty = url.searchParams.get('difficulty');

    if (!isDifficulty(difficulty)) {
      return json({ error: 'Invalid difficulty' }, { status: 400 });
    }

    return json({ rankings: await readRankings(difficulty) });
  }

  if (request.method === 'POST') {
    const body = await request.json().catch(() => null);
    const name = sanitizeName(body?.name);
    const score = Number(body?.score);
    const difficulty = body?.difficulty;

    if (
      !name ||
      !Number.isFinite(score) ||
      score < 0 ||
      score > 999_999_999 ||
      !isDifficulty(difficulty)
    ) {
      return json({ error: 'Invalid ranking entry' }, { status: 400 });
    }

    const entry: RankingEntry = {
      name,
      score: Math.floor(score),
      date: new Date().toISOString(),
      difficulty,
    };
    const key = `rankings:${difficulty}`;

    await redis.zadd(key, {
      score: entry.score,
      member: JSON.stringify(entry),
    });
    await redis.zremrangebyrank(key, 0, -(maxStoredEntries + 1));

    return json({ rankings: await readRankings(difficulty) }, { status: 201 });
  }

  return json({ error: 'Method not allowed' }, { status: 405 });
}
