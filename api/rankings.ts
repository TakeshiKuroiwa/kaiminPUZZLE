import { Redis } from '@upstash/redis';

type Difficulty = 'easy' | 'normal' | 'hard' | 'veryhard';

interface RankingEntry {
  name: string;
  score: number;
  date: string;
  difficulty: Difficulty;
}

interface ApiRequest {
  method?: string;
  query: Record<string, string | string[] | undefined>;
  body?: unknown;
}

interface ApiResponse {
  setHeader(name: string, value: string): void;
  status(code: number): ApiResponse;
  json(data: unknown): void;
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

function parseRankingEntry(value: unknown): RankingEntry | null {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) as RankingEntry : value as RankingEntry;
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

function parseBody(body: unknown) {
  if (typeof body !== 'string') return body;

  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

async function readRankings(difficulty: Difficulty) {
  const rawEntries = await redis.zrange<unknown[]>(
    `rankings:${difficulty}`,
    0,
    maxVisibleEntries - 1,
    { rev: true },
  );

  return rawEntries
    .map(parseRankingEntry)
    .filter((entry): entry is RankingEntry => entry !== null);
}

export default async function handler(request: ApiRequest, response: ApiResponse) {
  response.setHeader('Cache-Control', 'no-store');

  if (request.method === 'GET') {
    const difficulty = Array.isArray(request.query.difficulty)
      ? request.query.difficulty[0]
      : request.query.difficulty;

    if (!isDifficulty(difficulty)) {
      return response.status(400).json({ error: 'Invalid difficulty' });
    }

    return response.status(200).json({ rankings: await readRankings(difficulty) });
  }

  if (request.method === 'POST') {
    const body = parseBody(request.body) as Partial<RankingEntry> | null;
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
      return response.status(400).json({ error: 'Invalid ranking entry' });
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

    return response.status(201).json({ rankings: await readRankings(difficulty) });
  }

  return response.status(405).json({ error: 'Method not allowed' });
}
