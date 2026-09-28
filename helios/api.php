<?php
declare(strict_types=1);
session_start();

header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

$profiles = [
  ['id'=>'alexey','name'=>'Алексей Морозов','initials'=>'АМ','color'=>'#5b6ee1','bio'=>'Бэкенд, кофе и дедлайны.'],
  ['id'=>'maria','name'=>'Мария Соколова','initials'=>'МС','color'=>'#d4517a','bio'=>'Учусь, рисую и сохраняю мемы.'],
  ['id'=>'ilya','name'=>'Илья Кузнецов','initials'=>'ИК','color'=>'#298f72','bio'=>'Пишу код до первого зелёного теста.'],
  ['id'=>'sofia','name'=>'София Волкова','initials'=>'СВ','color'=>'#a05ab5','bio'=>'Фронтенд и слишком много открытых вкладок.'],
  ['id'=>'denis','name'=>'Денис Орлов','initials'=>'ДО','color'=>'#c16b35','bio'=>'Всё работает. Причины выясняются.'],
  ['id'=>'anna','name'=>'Анна Лебедева','initials'=>'АЛ','color'=>'#3978a8','bio'=>'Делаю лабораторные и хорошие фотографии.'],
  ['id'=>'mikhail','name'=>'Михаил Петров','initials'=>'МП','color'=>'#6c7b3a','bio'=>'Тестирую даже то, что проверять не просили.'],
  ['id'=>'ekaterina','name'=>'Екатерина Смирнова','initials'=>'ЕС','color'=>'#ad4f4f','bio'=>'Собираю понятные интерфейсы.'],
  ['id'=>'iskandar','name'=>'Гарифуллин Искандар','initials'=>'ГИ','color'=>'#2563eb','bio'=>'Моя страница в учебной ленте мемов.']
];

$memes = [
  ['template'=>'drake','lines'=>['делать лабораторную заранее','открыть задание в ночь перед сдачей'],'caption'=>'Каждый раз один и тот же план.','comments'=>['У меня этот план повторяется каждую неделю.','Первый вариант звучит слишком рискованно.','Главное — не забыть сохранить файл.','Узнаю расписание по одной картинке.']],
  ['template'=>'db','lines'=>['я','ещё одна серия','лабораторная'],'caption'=>'Приоритеты расставлены правильно.','comments'=>['Серия хотя бы закончится вовремя.','Лабораторная всё видит.','Завтра точно начну с задания.','Так и пропал весь вечер.']],
  ['template'=>'fine','lines'=>['сервер упал','за пять минут до показа'],'caption'=>'Главное — сохранять спокойствие.','comments'=>['Перезапуск перед демонстрацией — классика.','А локально всё работало.','В этот момент особенно приятно видеть резервную копию.','Пять минут — ещё много времени.']],
  ['template'=>'gru','lines'=>['написать код','запустить тесты','увидеть 47 ошибок','47 ошибок'],'caption'=>'План был хороший. Исполнение тоже интересное.','comments'=>['Зато тесты действительно что-то проверяют.','Первая ошибка обычно самая важная.','После исправления станет 48.','Пора читать сообщение целиком.']],
  ['template'=>'cmm','lines'=>['если работает — не трогай'],'caption'=>'Правило, которое понимаешь только после первого курса.','comments'=>['Но сначала всё равно сделаем небольшой рефакторинг.','Нужен комментарий, почему это нельзя трогать.','История изменений подтверждает.','Работает — уже документация.']],
  ['template'=>'doge','lines'=>['код на паре','тот же код дома'],'caption'=>'Среда выполнения имеет значение.','comments'=>['Наверняка дело в одной переменной окружения.','На компьютере преподавателя будет третий вариант.','Проверено на двух устройствах — две разные ошибки.','Контейнеры были придуманы именно после этого.']],
  ['template'=>'disastergirl','lines'=>['я просто поменял одну строчку','проект'],'caption'=>'Небольшой рефакторинг прошёл успешно.','comments'=>['Эта строчка явно была несущей.','Хорошо, что есть история изменений.','Откатываем и делаем вид, что ничего не было.','Зато теперь понятно, зачем нужны тесты.']],
  ['template'=>'astronaut','lines'=>['это всё дедлайн?','всегда был дедлайн','подожди','что?'],'caption'=>'Календарь снова подаёт сигналы.','comments'=>['Уведомление пришло очень вовремя — вчера.','Открыл календарь и сразу закрыл.','Зато даты теперь выучены наизусть.','До полуночи технически ещё сегодня.']]
];

function jsonResponse(int $status, mixed $data): never {
  http_response_code($status);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}

function profilePublic(array $profile): array {
  return array_intersect_key($profile, array_flip(['id','name','initials','color','bio']));
}

function profileById(string $id): ?array {
  global $profiles;
  foreach ($profiles as $profile) if ($profile['id'] === $id) return $profile;
  return null;
}

function makePost(int $id, ?array $forcedProfile = null, ?int $forcedMeme = null): array {
  global $profiles, $memes;
  $uploads = $_SESSION['uploads'] ?? [];
  if (isset($uploads[(string)$id])) return $uploads[(string)$id];
  $memeIndex = $forcedMeme ?? (($id - 1) % count($memes));
  $meme = $memes[$memeIndex];
  $author = $forcedProfile ?? $profiles[($id * 5 + 3) % (count($profiles) - 1)];
  $round = intdiv(max(0, $id - 1), count($memes));
  $lines = $meme['lines'];
  if ($forcedProfile === null && $round > 0) {
    if ($memeIndex === 0) $lines[1] = 'открыть задание за '.($round + 1).' часа до сдачи';
    if ($memeIndex === 1) $lines[1] = 'ещё '.($round + 1).' серии';
    if ($memeIndex === 2) $lines[1] = 'за '.($round + 5).' минут до показа';
    if ($memeIndex === 3) $lines[2] = $lines[3] = (string)(47 + $round).' ошибок';
    if ($memeIndex === 4) $lines[0] = 'если работает — не трогай · сборка '.($round + 1);
    if ($memeIndex === 5) $lines[1] = 'тот же код дома · запуск '.($round + 1);
    if ($memeIndex === 6) $lines[0] = 'я поменял '.($round + 1).' строчки';
    if ($memeIndex === 7) $lines[0] = 'это дедлайн №'.($round + 1).'?';
  }
  $comments = [];
  $candidates = array_values(array_filter($profiles, fn($p) => $p['id'] !== $author['id'] && $p['id'] !== 'iskandar'));
  foreach ($meme['comments'] as $index => $text) {
    $commenter = $candidates[($id + $index * 3) % count($candidates)];
    $comments[] = ['id'=>$id.'-'.($index+1),'author'=>profilePublic($commenter),'text'=>$text,'createdAt'=>gmdate('c', time() - ($index+1)*420)];
  }
  $encoded = array_map('rawurlencode', $lines);
  return [
    'id'=>(string)$id,
    'author'=>profilePublic($author),
    'createdAt'=>gmdate('c', time() - (($id * 733) % 86400)),
    'text'=>$meme['caption'],
    'image'=>'api.php?route=meme&id='.$id,
    'remoteImage'=>'https://api.memegen.link/images/'.$meme['template'].'/'.implode('/', $encoded).'.webp?font=notosans&width=640',
    'imageAlt'=>'Мем: '.implode(' — ', $lines),
    'memeIndex'=>$memeIndex,
    'comments'=>$comments,
    'stats'=>['likes'=>12+(($id*137)%1900),'comments'=>count($comments),'shares'=>1+(($id*17)%90)]
  ];
}

function serveMeme(int $id): never {
  $post = makePost($id);
  if (empty($post['remoteImage'])) { http_response_code(404); exit; }
  $cache = sys_get_temp_dir().'/s506911-meme-'.$id.'.webp';
  if (!is_file($cache) || filesize($cache) === 0) {
    $context = stream_context_create(['http'=>['timeout'=>12,'user_agent'=>'ITMO meme feed']]);
    $body = @file_get_contents($post['remoteImage'], false, $context);
    if ($body === false) { http_response_code(502); exit; }
    @file_put_contents($cache, $body, LOCK_EX);
  }
  header('Content-Type: image/webp');
  header('Cache-Control: public, max-age=86400');
  readfile($cache);
  exit;
}

$route = $_GET['route'] ?? '';

if ($route === 'feed') {
  header('Content-Type: application/x-ndjson; charset=utf-8');
  $limit = max(1, min(10, (int)($_GET['limit'] ?? 5)));
  $next = (int)($_SESSION['nextId'] ?? 1);
  if (($_GET['uploads'] ?? '') === '1') {
    foreach (array_reverse($_SESSION['uploads'] ?? []) as $post) echo json_encode($post, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES)."\n";
  }
  for ($i=0; $i<$limit; $i++) echo json_encode(makePost($next++), JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES)."\n";
  $_SESSION['nextId'] = $next;
  exit;
}

if ($route === 'meme') serveMeme((int)($_GET['id'] ?? 0));

if ($route === 'post') jsonResponse(200, makePost((int)($_GET['id'] ?? 0)));

if ($route === 'profile') {
  $profile = profileById((string)($_GET['id'] ?? ''));
  if (!$profile) jsonResponse(404, ['error'=>'Профиль не найден.']);
  $index = array_search($profile, $profiles, true);
  $posts = [];
  foreach ($_SESSION['uploads'] ?? [] as $post) if ($post['author']['id'] === $profile['id']) $posts[] = $post;
  for ($i=0; count($posts)<3; $i++) $posts[] = makePost(100000+$index*100+$i, $profile, ($index+$i)%count($memes));
  $reposts = [];
  for ($i=0; $i<3; $i++) {
    $original = makePost(200000+$index*100+$i, $profiles[($index+$i+2)%(count($profiles)-1)], ($index+$i+3)%count($memes));
    $original['repostedBy'] = profilePublic($profile);
    $reposts[] = $original;
  }
  jsonResponse(200, ['profile'=>profilePublic($profile),'posts'=>array_reverse(array_slice($posts,-6)),'reposts'=>$reposts]);
}

if ($route === 'posts' && $_SERVER['REQUEST_METHOD'] === 'POST') {
  $input = json_decode(file_get_contents('php://input'), true);
  $text = trim((string)($input['text'] ?? ''));
  $image = (string)($input['image'] ?? '');
  if ($text === '' || mb_strlen($text) > 280) jsonResponse(400, ['error'=>'Введите подпись до 280 символов.']);
  if (!preg_match('#^data:image/(jpeg|png|webp|gif);base64,#', $image)) jsonResponse(400, ['error'=>'Выберите изображение JPG, PNG, WebP или GIF.']);
  $id = (int)($_SESSION['nextId'] ?? 1);
  $_SESSION['nextId'] = $id + 1;
  $author = profileById('iskandar');
  $comments = [
    ['id'=>$id.'-1','author'=>profilePublic(profileById('maria')),'text'=>'Отличный выбор мема.','createdAt'=>gmdate('c')],
    ['id'=>$id.'-2','author'=>profilePublic(profileById('ilya')),'text'=>'Сохраняю себе.','createdAt'=>gmdate('c',time()-60)]
  ];
  $post = ['id'=>(string)$id,'author'=>profilePublic($author),'createdAt'=>gmdate('c'),'text'=>$text,'image'=>$image,'imageAlt'=>'Мем, загруженный пользователем '.$author['name'],'comments'=>$comments,'stats'=>['likes'=>0,'comments'=>2,'shares'=>0],'uploaded'=>true];
  $_SESSION['uploads'][(string)$id] = $post;
  jsonResponse(201, $post);
}

jsonResponse(404, ['error'=>'Маршрут не найден.']);
