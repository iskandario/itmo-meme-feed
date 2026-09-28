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
  ['template'=>'drake','lines'=>['писать лабораторную по плану','переименовать final_final2 в ГОТОВО'],'caption'=>'Система контроля версий для сильных духом.','comments'=>['Главное потом не открыть final_final2_точно.','Git молча вышел из чата.','У меня ещё есть версия «последняя новая».','Архив ГОТОВО.zip уже готов.']],
  ['template'=>'db','lines'=>['я в 23:58','поменять шрифт','отправить работу'],'caption'=>'Когда до дедлайна две минуты, но душа просит дизайна.','comments'=>['Шрифт действительно всё решал.','Преподаватель оценит кернинг.','Отправка — задача для будущего меня.','Ещё тень у кнопки поправь.']],
  ['template'=>'fine','lines'=>['продакшен горит','зато линтер зелёный'],'caption'=>'Приоритеты команды расставлены.','comments'=>['Ноль предупреждений — ноль проблем.','Пожар соответствует кодстайлу.','Сначала форматирование, потом эвакуация.','ESLint спас всё, что мог.']],
  ['template'=>'gru','lines'=>['исправить один баг','удалить одну строчку','сломать авторизацию','это была важная строчка'],'caption'=>'Небольшой фикс уверенно стал новой лабораторной.','comments'=>['Строчка оказалась несущей.','Зато баг действительно исчез.','Вместе со всем приложением.','Возвращаем и больше не смотрим на неё.']],
  ['template'=>'cmm','lines'=>['«у меня работает» — это не тестирование'],'caption'=>'Непопулярное мнение перед показом лабораторной.','comments'=>['На ноутбуке преподавателя начинается интеграционное тестирование.','А скриншот считается?','Главное произнести это уверенно.','localhost подтвердил качество.']],
  ['template'=>'doge','lines'=>['мой код в голове','мой код после npm install'],'caption'=>'Зависимости внесли небольшие уточнения.','comments'=>['Всего 847 пакетов для одной кнопки.','Папка node_modules уже тяжелее проекта.','Удалить lock-файл — и в бой.','Уязвимости только средней тяжести, живём.']],
  ['template'=>'disastergirl','lines'=>['я: обновлю одну зависимость','package-lock на 14 тысяч строк'],'caption'=>'Очень локальное изменение.','comments'=>['Ревью займёт пару минут.','Dependabot одобряет этот хаос.','Коммит лучше назвать fix.','Главное не смотреть diff.']],
  ['template'=>'astronaut','lines'=>['это костыль?','весь проект — костыль','подожди','всегда был'],'caption'=>'Архитектурное ревью завершено.','comments'=>['Зато держится.','Не костыль, а временный адаптер.','Временный с первого курса.','Документация на него потеряна.']],
  ['template'=>'aag','lines'=>['почему CSS съехал?','ретроградный margin'],'caption'=>'Причина найдена, доказательства не требуются.','comments'=>['Попробуй ещё очистить чакры браузера.','Mercury in flexbox.','Поставь display: block и не спрашивай.','На моей натальной карте ровно.']],
  ['template'=>'balloon','lines'=>['я','ещё один быстрый фикс','лечь спать до трёх'],'caption'=>'Сон снова не прошёл code review.','comments'=>['Этот фикс точно последний.','Предыдущий последний был десять минут назад.','Спать можно после деплоя.','А после деплоя уже нельзя.']],
  ['template'=>'fry','lines'=>['не уверен, баг ли это','или скрытая возможность'],'caption'=>'Отдел маркетинга уже выбрал второй вариант.','comments'=>['Запиши в документацию — станет фичей.','Пользователи просто неправильно пользуются.','Работает не по ТЗ, зато стабильно.','Roadmap обновлён задним числом.']],
  ['template'=>'mordor','lines'=>['нельзя просто взять','и выйти из vim'],'caption'=>'Легенда гласит, что он всё ещё ищет кнопку.','comments'=>['Esc уже стёрся.','Попробуй выключить компьютер.','Сначала нужно стать достойным.','На экзамене интернет запрещён, vim остаётся.']],
  ['template'=>'oprah','lines'=>['тебе дедлайн','и тебе дедлайн'],'caption'=>'Преподаватель щедро раздаёт возможности проявить себя.','comments'=>['А можно вместо дедлайна автомат?','Всем досталось, никто не ушёл обиженным.','Подарок нельзя передарить.','Следующий дедлайн уже в пути.']],
  ['template'=>'pigeon','lines'=>['студент','console.log в каждой строке','это отладчик?'],'caption'=>'Профессиональные инструменты требуют профессионального подхода.','comments'=>['Ещё alert для надёжности.','Если логов много, ошибка испугается.','Debugger поставил дизлайк.','В проде тоже оставим, вдруг пригодится.']],
  ['template'=>'grumpycat','lines'=>['собралось с первого раза','подозрительно'],'caption'=>'Опыт подсказывает: радоваться рано.','comments'=>['Тесты точно запускались?','Проверь, тот ли проект открыл.','Сейчас выяснится, что это старая ветка.','Ошибка просто готовит эффектное появление.']]
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
    if ($memeIndex === 8) $lines[1] = 'ретроградный margin №'.($round + 1);
    if ($memeIndex === 9) $lines[1] = 'ещё один быстрый фикс №'.($round + 1);
    if ($memeIndex === 10) $lines[1] = 'или скрытая возможность №'.($round + 1);
    if ($memeIndex === 11) $lines[1] = 'и выйти из vim с попытки №'.($round + 1);
    if ($memeIndex === 12) $lines[1] = 'и тебе дедлайн №'.($round + 1);
    if ($memeIndex === 13) $lines[1] = 'console.log v'.($round + 1);
    if ($memeIndex === 14) $lines[0] = 'собралось с попытки №'.($round + 1);
  }
  $comments = [];
  $candidates = array_values(array_filter($profiles, fn($p) => $p['id'] !== $author['id'] && $p['id'] !== 'iskandar'));
  foreach ($meme['comments'] as $index => $text) {
    $commenter = $candidates[($id + $index * 3) % count($candidates)];
    $comments[] = ['id'=>$id.'-'.($index+1),'author'=>profilePublic($commenter),'text'=>$text,'createdAt'=>gmdate('c', time() - ($index+1)*420)];
  }
  return [
    'id'=>(string)$id,
    'author'=>profilePublic($author),
    'createdAt'=>gmdate('c', time() - (($id * 733) % 86400)),
    'text'=>$meme['caption'],
    'image'=>'api.php?route=meme&id='.$id,
    'remoteImage'=>'https://api.memegen.link/images/'.$meme['template'].'.jpg',
    'imageAlt'=>'Мем: '.implode(' — ', $lines),
    'memeLines'=>$lines,
    'memeIndex'=>$memeIndex,
    'comments'=>$comments,
    'stats'=>['likes'=>12+(($id*137)%1900),'comments'=>count($comments),'shares'=>1+(($id*17)%90)]
  ];
}

function serveMeme(int $id): never {
  $post = makePost($id);
  if (empty($post['remoteImage'])) { http_response_code(404); exit; }
  $cache = sys_get_temp_dir().'/s506911-meme-v3-'.$id.'.jpg';
  if (!is_file($cache) || filesize($cache) === 0) {
    $context = stream_context_create(['http'=>['timeout'=>12,'user_agent'=>'ITMO meme feed']]);
    $body = @file_get_contents($post['remoteImage'], false, $context);
    if ($body === false) { http_response_code(502); exit; }
    @file_put_contents($cache, $body, LOCK_EX);
  }
  header('Content-Type: image/jpeg');
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
