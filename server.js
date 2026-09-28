import http from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';

const root = join(fileURLToPath(new URL('.', import.meta.url)), 'public');
const port = Number(process.env.PORT) || 3000;

const profiles = [
  { id: 'alexey', name: 'Алексей Морозов', initials: 'АМ', color: '#5b6ee1', bio: 'Бэкенд, кофе и дедлайны.' },
  { id: 'maria', name: 'Мария Соколова', initials: 'МС', color: '#d4517a', bio: 'Учусь, рисую и сохраняю мемы.' },
  { id: 'ilya', name: 'Илья Кузнецов', initials: 'ИК', color: '#298f72', bio: 'Пишу код до первого зелёного теста.' },
  { id: 'sofia', name: 'София Волкова', initials: 'СВ', color: '#a05ab5', bio: 'Фронтенд и слишком много открытых вкладок.' },
  { id: 'denis', name: 'Денис Орлов', initials: 'ДО', color: '#c16b35', bio: 'Всё работает. Причины выясняются.' },
  { id: 'anna', name: 'Анна Лебедева', initials: 'АЛ', color: '#3978a8', bio: 'Делаю лабораторные и хорошие фотографии.' },
  { id: 'mikhail', name: 'Михаил Петров', initials: 'МП', color: '#6c7b3a', bio: 'Тестирую даже то, что проверять не просили.' },
  { id: 'ekaterina', name: 'Екатерина Смирнова', initials: 'ЕС', color: '#ad4f4f', bio: 'Собираю понятные интерфейсы.' },
  { id: 'iskandar', name: 'Гарифуллин Искандар', initials: 'ГИ', color: '#2563eb', bio: 'Моя страница в учебной ленте мемов.' }
];

const memes = [
  { template: 'drake', lines: ['делать лабораторную заранее', 'открыть задание в ночь перед сдачей'], caption: 'Каждый раз один и тот же план.', comments: ['У меня этот план повторяется каждую неделю.', 'Первый вариант звучит слишком рискованно.', 'Главное — не забыть сохранить файл.', 'Узнаю расписание по одной картинке.'] },
  { template: 'db', lines: ['я', 'ещё одна серия', 'лабораторная'], caption: 'Приоритеты расставлены правильно.', comments: ['Серия хотя бы закончится вовремя.', 'Лабораторная всё видит.', 'Завтра точно начну с задания.', 'Так и пропал весь вечер.'] },
  { template: 'fine', lines: ['сервер упал', 'за пять минут до показа'], caption: 'Главное — сохранять спокойствие.', comments: ['Перезапуск перед демонстрацией — классика.', 'А локально всё работало.', 'В этот момент особенно приятно видеть резервную копию.', 'Пять минут — ещё много времени.'] },
  { template: 'gru', lines: ['написать код', 'запустить тесты', 'увидеть 47 ошибок', '47 ошибок'], caption: 'План был хороший. Исполнение тоже интересное.', comments: ['Зато тесты действительно что-то проверяют.', 'Первая ошибка обычно самая важная.', 'После исправления станет 48.', 'Пора читать сообщение целиком.'] },
  { template: 'cmm', lines: ['если работает — не трогай'], caption: 'Правило, которое понимаешь только после первого курса.', comments: ['Но сначала всё равно сделаем небольшой рефакторинг.', 'Нужен комментарий, почему это нельзя трогать.', 'История изменений подтверждает.', 'Работает — уже документация.'] },
  { template: 'doge', lines: ['код на паре', 'тот же код дома'], caption: 'Среда выполнения имеет значение.', comments: ['Наверняка дело в одной переменной окружения.', 'На компьютере преподавателя будет третий вариант.', 'Проверено на двух устройствах — две разные ошибки.', 'Контейнеры были придуманы именно после этого.'] },
  { template: 'disastergirl', lines: ['я просто поменял одну строчку', 'проект'], caption: 'Небольшой рефакторинг прошёл успешно.', comments: ['Эта строчка явно была несущей.', 'Хорошо, что есть история изменений.', 'Откатываем и делаем вид, что ничего не было.', 'Зато теперь понятно, зачем нужны тесты.'] },
  { template: 'astronaut', lines: ['это всё дедлайн?', 'всегда был дедлайн', 'подожди', 'что?'], caption: 'Календарь снова подаёт сигналы.', comments: ['Уведомление пришло очень вовремя — вчера.', 'Открыл календарь и сразу закрыл.', 'Зато даты теперь выучены наизусть.', 'До полуночи технически ещё сегодня.'] }
];

const postStore = new Map();
const uploadedPosts = [];
const memeCache = new Map();
let nextId = 1;

function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = seed + 0x6D2B79F5 | 0;
    let value = Math.imul(seed ^ seed >>> 15, 1 | seed);
    value = value + Math.imul(value ^ value >>> 7, 61 | value) ^ value;
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

function publicProfile(profile) {
  return { id: profile.id, name: profile.name, initials: profile.initials, color: profile.color, bio: profile.bio };
}

function commentsFor(postId, memeIndex, ownerId) {
  const source = memes[memeIndex].comments;
  const candidates = profiles.filter(profile => profile.id !== ownerId && profile.id !== 'iskandar');
  return source.map((text, index) => {
    const profile = candidates[(postId + index * 3) % candidates.length];
    return {
      id: `${postId}-${index + 1}`,
      author: publicProfile(profile),
      text,
      createdAt: new Date(Date.now() - (index + 1) * 420_000 - postId * 1000).toISOString()
    };
  });
}

function makePost(id, forcedProfile, forcedMemeIndex) {
  if (postStore.has(String(id))) return postStore.get(String(id));
  const random = mulberry32(Number(id) * 97);
  const author = forcedProfile ?? profiles[Math.floor(random() * (profiles.length - 1))];
  const memeIndex = forcedMemeIndex ?? ((Number(id) - 1) % memes.length);
  const meme = memes[memeIndex];
  const round = Math.floor((Number(id) - 1) / memes.length);
  const lines = [...meme.lines];
  if (!forcedProfile && round > 0) {
    if (memeIndex === 0) lines[1] = `открыть задание за ${round + 1} часа до сдачи`;
    if (memeIndex === 1) lines[1] = `ещё ${round + 1} серии`;
    if (memeIndex === 2) lines[1] = `за ${round + 5} минут до показа`;
    if (memeIndex === 3) lines[2] = lines[3] = `${47 + round} ошибок`;
    if (memeIndex === 4) lines[0] = `если работает — не трогай · сборка ${round + 1}`;
    if (memeIndex === 5) lines[1] = `тот же код дома · запуск ${round + 1}`;
    if (memeIndex === 6) lines[0] = `я поменял ${round + 1} строчки`;
    if (memeIndex === 7) lines[0] = `это дедлайн №${round + 1}?`;
  }
  const imageLines = lines.map(line => encodeURIComponent(line));
  const comments = commentsFor(Number(id), memeIndex, author.id);
  const remoteImage = `https://api.memegen.link/images/${meme.template}/${imageLines.join('/')}.webp?font=notosans&width=640`;
  const post = {
    id: String(id),
    author: publicProfile(author),
    createdAt: new Date(Date.now() - Math.floor(random() * 86_400_000)).toISOString(),
    text: meme.caption,
    image: `/api/memes/${id}`,
    remoteImage,
    imageAlt: `Мем: ${lines.join(' — ')}`,
    memeIndex,
    comments,
    stats: {
      likes: Math.floor(12 + random() * 1900),
      comments: comments.length,
      shares: Math.floor(1 + random() * 90)
    }
  };
  postStore.set(post.id, post);
  return post;
}

function loadMeme(post) {
  if (!memeCache.has(post.id)) {
    memeCache.set(post.id, fetch(post.remoteImage).then(async result => {
      if (!result.ok) throw new Error(`Meme API: ${result.status}`);
      return {
        body: Buffer.from(await result.arrayBuffer()),
        type: result.headers.get('content-type') || 'image/webp'
      };
    }).catch(error => {
      memeCache.delete(post.id);
      throw error;
    }));
  }
  return memeCache.get(post.id);
}

async function serveMeme(response, id) {
  const post = findOrCreatePost(id);
  if (!post?.remoteImage) return response.writeHead(404).end();
  try {
    const image = await loadMeme(post);
    response.writeHead(200, { 'content-type': image.type, 'content-length': image.body.length, 'cache-control': 'public, max-age=86400' });
    response.end(image.body);
  } catch {
    response.writeHead(502).end();
  }
}

async function* endlessPosts(signal, includeUploads) {
  if (includeUploads) {
    for (const post of uploadedPosts.slice().reverse()) yield post;
  }
  while (!signal.aborted) {
    yield makePost(nextId++);
    await new Promise(resolve => setTimeout(resolve, 8));
  }
}

function apiFeed(request, response, url) {
  const requested = Number(url.searchParams.get('limit'));
  const limit = Number.isFinite(requested) ? Math.min(Math.max(requested, 1), 20) : 6;
  const includeUploads = url.searchParams.get('uploads') === '1';
  const controller = new AbortController();
  request.on('close', () => controller.abort());
  const stream = new ReadableStream({
    async start(streamController) {
      const encoder = new TextEncoder();
      let sent = 0;
      try {
        for await (const post of endlessPosts(controller.signal, includeUploads)) {
          streamController.enqueue(encoder.encode(`${JSON.stringify(post)}\n`));
          if (++sent >= limit) break;
        }
        streamController.close();
        for (let offset = 0; offset < limit + 2; offset += 1) {
          loadMeme(makePost(nextId + offset)).catch(() => {});
        }
      } catch (error) {
        streamController.error(error);
      }
    },
    cancel() { controller.abort(); }
  });
  response.writeHead(200, { 'content-type': 'application/x-ndjson; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
  Readable.fromWeb(stream).pipe(response);
}

function sendJson(response, status, data) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  response.end(JSON.stringify(data));
}

function findOrCreatePost(id) {
  const numericId = Number(id);
  if (!Number.isSafeInteger(numericId) || numericId < 1) return null;
  return postStore.get(String(id)) ?? makePost(numericId);
}

function profileData(profile) {
  const index = profiles.indexOf(profile);
  const authored = [...postStore.values()].filter(post => post.author.id === profile.id && (post.uploaded || Number(post.id) < 200_000));
  const usedMemes = new Set(authored.map(post => post.memeIndex).filter(Number.isInteger));
  let candidate = 0;
  while (authored.length < 3) {
    const memeIndex = (index + candidate++) % memes.length;
    if (usedMemes.has(memeIndex)) continue;
    usedMemes.add(memeIndex);
    authored.push(makePost(100_000 + index * 100 + authored.length, profile, memeIndex));
  }
  const reposts = [0, 1, 2].map(offset => {
    const originalAuthor = profiles[(index + offset + 2) % (profiles.length - 1)];
    const original = makePost(200_000 + index * 100 + offset, originalAuthor, (index + offset + 3) % memes.length);
    return { ...original, repostedBy: publicProfile(profile) };
  });
  return { profile: publicProfile(profile), posts: authored.slice(-6).reverse(), reposts };
}

async function readJson(request, maxBytes = 8_000_000) {
  let body = '';
  for await (const chunk of request) {
    body += chunk;
    if (Buffer.byteLength(body) > maxBytes) throw new Error('payload_too_large');
  }
  return JSON.parse(body || '{}');
}

async function createPost(request, response) {
  try {
    const input = await readJson(request);
    if (typeof input.text !== 'string' || !input.text.trim() || input.text.length > 280) return sendJson(response, 400, { error: 'Введите подпись до 280 символов.' });
    if (typeof input.image !== 'string' || !/^data:image\/(jpeg|png|webp|gif);base64,/.test(input.image)) return sendJson(response, 400, { error: 'Выберите изображение JPG, PNG, WebP или GIF.' });
    const author = profiles.find(profile => profile.id === 'iskandar');
    const id = String(nextId++);
    const comments = [
      { id: `${id}-1`, author: publicProfile(profiles[1]), text: 'Отличный выбор мема.', createdAt: new Date().toISOString() },
      { id: `${id}-2`, author: publicProfile(profiles[2]), text: 'Сохраняю себе.', createdAt: new Date(Date.now() - 60_000).toISOString() }
    ];
    const post = {
      id,
      author: publicProfile(author),
      createdAt: new Date().toISOString(),
      text: input.text.trim(),
      image: input.image,
      imageAlt: `Мем, загруженный пользователем ${author.name}`,
      comments,
      stats: { likes: 0, comments: comments.length, shares: 0 },
      uploaded: true
    };
    postStore.set(id, post);
    uploadedPosts.push(post);
    sendJson(response, 201, post);
  } catch (error) {
    sendJson(response, error.message === 'payload_too_large' ? 413 : 400, { error: error.message === 'payload_too_large' ? 'Файл слишком большой.' : 'Не удалось сохранить публикацию.' });
  }
}

const mimeTypes = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml; charset=utf-8' };

async function serveStatic(response, pathname) {
  const requestedPath = pathname === '/' ? '/index.html' : pathname;
  const filePath = normalize(join(root, requestedPath));
  if (!filePath.startsWith(root)) return response.writeHead(403).end('Forbidden');
  try {
    const info = await stat(filePath);
    if (!info.isFile()) throw new Error('Not a file');
    response.writeHead(200, { 'content-type': mimeTypes[extname(filePath)] ?? 'application/octet-stream', 'cache-control': 'no-cache' });
    createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('Not found');
  }
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);
  if (request.method === 'GET' && url.pathname === '/api/feed') return apiFeed(request, response, url);
  if (request.method === 'POST' && url.pathname === '/api/posts') return createPost(request, response);

  const memeMatch = url.pathname.match(/^\/api\/memes\/(\d+)$/);
  if (request.method === 'GET' && memeMatch) return serveMeme(response, memeMatch[1]);

  const postMatch = url.pathname.match(/^\/api\/posts\/(\d+)$/);
  if (request.method === 'GET' && postMatch) {
    const post = findOrCreatePost(postMatch[1]);
    if (post?.remoteImage) await loadMeme(post).catch(() => {});
    return post ? sendJson(response, 200, post) : sendJson(response, 404, { error: 'Публикация не найдена.' });
  }

  const profileMatch = url.pathname.match(/^\/api\/profiles\/([a-z-]+)$/);
  if (request.method === 'GET' && profileMatch) {
    const profile = profiles.find(item => item.id === profileMatch[1]);
    if (!profile) return sendJson(response, 404, { error: 'Профиль не найден.' });
    const data = profileData(profile);
    await Promise.allSettled([...data.posts, ...data.reposts].filter(post => post.remoteImage).map(loadMeme));
    return sendJson(response, 200, data);
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') return response.writeHead(405, { allow: 'GET, HEAD, POST' }).end();
  await serveStatic(response, decodeURIComponent(url.pathname));
});

server.listen(port, () => {
  console.log(`Лента мемов запущена: http://localhost:${port}`);
  for (let id = 1; id <= 8; id += 1) loadMeme(makePost(id)).catch(() => {});
});
function shutdown() { server.close(() => process.exit(0)); }
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
