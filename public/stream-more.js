const template = document.createElement('template');
template.innerHTML = `<div part="view"></div>`;

class StreamMore extends HTMLElement {
  #view;
  #feed;
  #loader;
  #observer;
  #controller;
  #loading = false;
  #firstBatch = true;
  #seen = new Set();
  #formatter = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  #onRoute = () => this.#renderRoute();

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.append(template.content.cloneNode(true));
    this.#view = shadow.querySelector('[part="view"]');
  }

  connectedCallback() {
    window.addEventListener('hashchange', this.#onRoute);
    this.#renderRoute();
  }

  disconnectedCallback() {
    window.removeEventListener('hashchange', this.#onRoute);
    this.#stopFeed();
  }

  async #renderRoute() {
    this.#stopFeed();
    window.scrollTo(0, 0);
    const route = location.hash.slice(1) || '/';
    if (route === '/' || route === '') return this.#renderFeed();
    if (route === '/new') return this.#renderNewPost();
    const postMatch = route.match(/^\/post\/(\d+)\/comments$/);
    if (postMatch) return this.#renderComments(postMatch[1]);
    const profileMatch = route.match(/^\/profile\/([a-z-]+)$/);
    if (profileMatch) return this.#renderProfile(profileMatch[1]);
    location.hash = '/';
  }

  #renderFeed() {
    this.#view.replaceChildren();
    this.#feed = document.createElement('div');
    this.#feed.setAttribute('part', 'feed');
    this.#feed.setAttribute('role', 'feed');
    this.#loader = document.createElement('div');
    this.#loader.setAttribute('part', 'loader');
    this.#view.append(this.#feed, this.#loader);
    this.#seen.clear();
    this.#firstBatch = true;
    this.#observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) this.loadMore();
    }, { rootMargin: '220px 0px' });
    this.#observer.observe(this.#loader);
    this.#loader.addEventListener('click', event => {
      if (event.target.closest('button')) this.loadMore();
    });
    this.loadMore();
  }

  #stopFeed() {
    this.#observer?.disconnect();
    this.#controller?.abort();
    this.#observer = null;
    this.#controller = null;
    this.#loading = false;
  }

  async loadMore() {
    if (this.#loading || !this.#feed) return;
    this.#loading = true;
    this.#controller = new AbortController();
    this.#setLoadingState();
    try {
      const source = new URL(this.#endpoint(this.getAttribute('src') || '/api/feed'), location.href);
      source.searchParams.set('limit', '5');
      if (this.#firstBatch) source.searchParams.set('uploads', '1');
      const response = await fetch(source, { signal: this.#controller.signal });
      if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);
      await response.body
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(this.#ndjsonParser())
        .pipeTo(new WritableStream({ write: post => this.#appendPost(post) }));
      this.#firstBatch = false;
    } catch (error) {
      if (error.name !== 'AbortError') this.#setErrorState();
    } finally {
      this.#loading = false;
    }
  }

  #ndjsonParser() {
    let buffer = '';
    return new TransformStream({
      transform(chunk, controller) {
        buffer += chunk;
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) if (line.trim()) controller.enqueue(JSON.parse(line));
      },
      flush(controller) { if (buffer.trim()) controller.enqueue(JSON.parse(buffer)); }
    });
  }

  #appendPost(post) {
    if (this.#seen.has(post.id)) return;
    this.#seen.add(post.id);
    this.#feed.append(this.#postCard(post));
  }

  #postCard(post, context = 'feed') {
    const card = document.createElement('article');
    card.setAttribute('part', `card card-${context}`);

    const header = document.createElement('header');
    header.setAttribute('part', 'card-header');
    const profileLink = document.createElement('a');
    profileLink.setAttribute('part', 'profile-link');
    profileLink.href = `#/profile/${post.author.id}`;
    const avatar = this.#avatar(post.author);
    const identity = document.createElement('span');
    identity.setAttribute('part', 'identity');
    const author = document.createElement('strong');
    author.setAttribute('part', 'author');
    author.textContent = post.author.name;
    const time = document.createElement('time');
    time.setAttribute('part', 'meta');
    time.dateTime = post.createdAt;
    time.textContent = this.#formatter.format(new Date(post.createdAt));
    identity.append(author, time);
    profileLink.append(avatar, identity);
    const menu = document.createElement('button');
    menu.setAttribute('part', 'more-menu');
    menu.type = 'button';
    menu.ariaLabel = 'Действия с публикацией';
    menu.textContent = '•••';
    header.append(profileLink, menu);

    const copy = document.createElement('p');
    copy.setAttribute('part', 'copy');
    copy.textContent = post.text;
    const media = document.createElement('a');
    media.setAttribute('part', 'media');
    media.href = `#/post/${post.id}/comments`;
    const image = document.createElement('img');
    image.setAttribute('part', 'image');
    image.src = post.image;
    image.alt = post.imageAlt;
    image.loading = context === 'feed' ? 'lazy' : 'eager';
    image.decoding = 'async';
    image.addEventListener('error', () => { image.src = this.#fallbackImage(); }, { once: true });
    media.append(image);
    if (Array.isArray(post.memeLines) && post.memeLines.length) {
      const split = Math.ceil(post.memeLines.length / 2);
      const topCaption = document.createElement('span');
      topCaption.setAttribute('part', 'meme-caption meme-caption-top');
      topCaption.textContent = post.memeLines.slice(0, split).join(' · ');
      const bottomCaption = document.createElement('span');
      bottomCaption.setAttribute('part', 'meme-caption meme-caption-bottom');
      bottomCaption.textContent = post.memeLines.slice(split).join(' · ');
      media.append(topCaption, bottomCaption);
    }

    const actions = document.createElement('div');
    actions.setAttribute('part', 'actions');
    actions.append(
      this.#likeButton(post.stats.likes),
      this.#linkAction('◯', post.stats.comments, 'Комментарии', `#/post/${post.id}/comments`),
      this.#repostButton(post.stats.shares)
    );
    card.append(header, copy, media, actions);
    return card;
  }

  #avatar(profile, small = false) {
    const avatar = document.createElement('span');
    avatar.setAttribute('part', small ? 'avatar avatar-small' : 'avatar');
    avatar.textContent = profile.initials;
    avatar.style.background = profile.color;
    avatar.setAttribute('aria-hidden', 'true');
    return avatar;
  }

  #likeButton(value) {
    const button = document.createElement('button');
    button.setAttribute('part', 'action');
    button.type = 'button';
    button.ariaLabel = 'Нравится';
    button.textContent = `♡ ${this.#compact(value)}`;
    button.addEventListener('click', () => {
      const active = button.getAttribute('aria-pressed') === 'true';
      button.setAttribute('aria-pressed', String(!active));
      button.setAttribute('part', active ? 'action' : 'action action-liked');
      button.textContent = `${active ? '♡' : '♥'} ${this.#compact(value + (active ? 0 : 1))}`;
    });
    return button;
  }

  #linkAction(icon, value, label, href) {
    const link = document.createElement('a');
    link.setAttribute('part', 'action action-link');
    link.href = href;
    link.ariaLabel = label;
    if (label === 'Комментарии') {
      link.append(this.#commentIcon(), document.createTextNode(this.#compact(value)));
    } else {
      link.textContent = `${icon} ${this.#compact(value)}`;
    }
    return link;
  }

  #commentIcon() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('part', 'action-icon');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M7.5 18.2 4 20l.9-3.8A8 8 0 1 1 7.5 18.2Z');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '1.8');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    svg.append(path);
    return svg;
  }

  #repostButton(value) {
    const button = document.createElement('button');
    button.setAttribute('part', 'action');
    button.type = 'button';
    button.ariaLabel = 'Сделать репост';
    button.textContent = `↗ ${this.#compact(value)}`;
    button.addEventListener('click', () => {
      const active = button.getAttribute('aria-pressed') === 'true';
      button.setAttribute('aria-pressed', String(!active));
      button.setAttribute('part', active ? 'action' : 'action action-reposted');
      button.textContent = `${active ? '↗' : '✓'} ${this.#compact(value + (active ? 0 : 1))}`;
    });
    return button;
  }

  async #renderComments(id) {
    this.#showPageLoading();
    try {
      const post = await this.#fetchJson(`/api/posts/${id}`);
      this.#view.replaceChildren();
      this.#view.append(this.#pageTitle('Комментарии'), this.#postCard(post, 'detail'));
      const list = document.createElement('section');
      list.setAttribute('part', 'comments');
      const heading = document.createElement('h2');
      heading.setAttribute('part', 'section-title');
      heading.textContent = `${post.comments.length} комментария`;
      list.append(heading);
      for (const comment of post.comments) list.append(this.#comment(comment));
      this.#view.append(list);
    } catch (error) { this.#showPageError(error.message); }
  }

  #comment(comment) {
    const row = document.createElement('article');
    row.setAttribute('part', 'comment');
    const link = document.createElement('a');
    link.setAttribute('part', 'comment-profile');
    link.href = `#/profile/${comment.author.id}`;
    link.append(this.#avatar(comment.author, true));
    const body = document.createElement('div');
    body.setAttribute('part', 'comment-body');
    const name = document.createElement('a');
    name.setAttribute('part', 'comment-author');
    name.href = `#/profile/${comment.author.id}`;
    name.textContent = comment.author.name;
    const text = document.createElement('p');
    text.setAttribute('part', 'comment-text');
    text.textContent = comment.text;
    const time = document.createElement('time');
    time.setAttribute('part', 'comment-time');
    time.dateTime = comment.createdAt;
    time.textContent = this.#formatter.format(new Date(comment.createdAt));
    body.append(name, text, time);
    row.append(link, body);
    return row;
  }

  async #renderProfile(id) {
    this.#showPageLoading();
    try {
      const data = await this.#fetchJson(`/api/profiles/${id}`);
      this.#view.replaceChildren();
      this.#view.append(this.#pageTitle('Профиль'));
      const profile = document.createElement('section');
      profile.setAttribute('part', 'profile');
      profile.append(this.#avatar(data.profile));
      const info = document.createElement('div');
      info.setAttribute('part', 'profile-info');
      const name = document.createElement('h2');
      name.setAttribute('part', 'profile-name');
      name.textContent = data.profile.name;
      const bio = document.createElement('p');
      bio.setAttribute('part', 'profile-bio');
      bio.textContent = data.profile.bio;
      info.append(name, bio);
      profile.append(info);
      if (id === 'iskandar') {
        const add = document.createElement('a');
        add.setAttribute('part', 'primary-button');
        add.href = '#/new';
        add.textContent = 'Добавить мем';
        profile.append(add);
      }
      this.#view.append(profile);
      const tabs = document.createElement('div');
      tabs.setAttribute('part', 'tabs');
      const content = document.createElement('div');
      content.setAttribute('part', 'profile-posts');
      const show = (items, activeButton) => {
        for (const button of tabs.querySelectorAll('button')) button.setAttribute('aria-selected', String(button === activeButton));
        content.replaceChildren(...items.map(post => this.#postCard(post, 'profile')));
      };
      const postsButton = this.#tabButton('Публикации');
      const repostsButton = this.#tabButton('Репосты');
      postsButton.addEventListener('click', () => show(data.posts, postsButton));
      repostsButton.addEventListener('click', () => show(data.reposts, repostsButton));
      tabs.append(postsButton, repostsButton);
      this.#view.append(tabs, content);
      show(data.posts, postsButton);
    } catch (error) { this.#showPageError(error.message); }
  }

  #tabButton(label) {
    const button = document.createElement('button');
    button.setAttribute('part', 'tab');
    button.type = 'button';
    button.textContent = label;
    return button;
  }

  #renderNewPost() {
    this.#view.replaceChildren();
    this.#view.append(this.#pageTitle('Новая публикация'));
    const form = document.createElement('form');
    form.setAttribute('part', 'form');
    const author = document.createElement('div');
    author.setAttribute('part', 'form-author');
    author.innerHTML = '<span part="avatar" style="background:#2563eb">ГИ</span><div><strong>Гарифуллин Искандар</strong><small>Публикация от вашего имени</small></div>';
    const textLabel = document.createElement('label');
    textLabel.setAttribute('part', 'field');
    textLabel.textContent = 'Подпись к мему';
    const textarea = document.createElement('textarea');
    textarea.name = 'text';
    textarea.maxLength = 280;
    textarea.required = true;
    textarea.placeholder = 'Напишите короткую подпись';
    textLabel.append(textarea);
    const fileLabel = document.createElement('label');
    fileLabel.setAttribute('part', 'upload');
    fileLabel.innerHTML = '<strong>Выбрать изображение</strong><span>JPG, PNG, WebP или GIF · до 5 МБ</span>';
    const file = document.createElement('input');
    file.type = 'file';
    file.name = 'image';
    file.accept = 'image/jpeg,image/png,image/webp,image/gif';
    file.required = true;
    fileLabel.append(file);
    const preview = document.createElement('img');
    preview.setAttribute('part', 'upload-preview');
    preview.hidden = true;
    file.addEventListener('change', () => {
      const selected = file.files?.[0];
      if (!selected) return;
      preview.src = URL.createObjectURL(selected);
      preview.hidden = false;
    });
    const error = document.createElement('p');
    error.setAttribute('part', 'form-error');
    const submit = document.createElement('button');
    submit.setAttribute('part', 'submit');
    submit.type = 'submit';
    submit.textContent = 'Опубликовать';
    form.append(author, textLabel, fileLabel, preview, error, submit);
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const selected = file.files?.[0];
      if (!selected) return;
      if (selected.size > 5_000_000) { error.textContent = 'Файл больше 5 МБ.'; return; }
      submit.disabled = true;
      submit.textContent = 'Публикуем…';
      try {
        const image = await this.#readFile(selected);
        const post = await this.#fetchJson('/api/posts', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text: textarea.value, image }) });
        location.hash = `/post/${post.id}/comments`;
      } catch (caught) {
        error.textContent = caught.message;
        submit.disabled = false;
        submit.textContent = 'Опубликовать';
      }
    });
    this.#view.append(form);
  }

  #pageTitle(title) {
    const bar = document.createElement('div');
    bar.setAttribute('part', 'page-title');
    const back = document.createElement('a');
    back.setAttribute('part', 'back');
    back.href = '#/';
    back.textContent = '←';
    back.ariaLabel = 'Вернуться в ленту';
    const heading = document.createElement('h1');
    heading.textContent = title;
    bar.append(back, heading);
    return bar;
  }

  async #fetchJson(url, options) {
    const response = await fetch(this.#endpoint(url), options);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Не удалось загрузить данные.');
    return data;
  }

  #endpoint(path) {
    if (location.hostname !== 'se.ifmo.ru') return path;
    const endpoint = new URL('api.php', location.href);
    if (path === '/api/feed') endpoint.searchParams.set('route', 'feed');
    else if (path === '/api/posts') endpoint.searchParams.set('route', 'posts');
    else {
      const post = path.match(/^\/api\/posts\/(\d+)$/);
      const profile = path.match(/^\/api\/profiles\/([a-z-]+)$/);
      if (post) { endpoint.searchParams.set('route', 'post'); endpoint.searchParams.set('id', post[1]); }
      else if (profile) { endpoint.searchParams.set('route', 'profile'); endpoint.searchParams.set('id', profile[1]); }
      else return path;
    }
    return endpoint.href;
  }

  #readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Не удалось прочитать файл.'));
      reader.readAsDataURL(file);
    });
  }

  #compact(value) { return new Intl.NumberFormat('ru', { notation: 'compact', maximumFractionDigits: 1 }).format(value); }

  #fallbackImage() {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="520" viewBox="0 0 900 520"><rect width="900" height="520" fill="#e9eaec"/><text x="450" y="275" text-anchor="middle" fill="#71757d" font-family="Arial" font-size="24">Не удалось загрузить мем</text></svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  #setLoadingState() { if (this.#loader) this.#loader.innerHTML = '<div><div part="spinner"></div><span>Загружаем публикации…</span></div>'; }
  #setErrorState() { if (this.#loader) this.#loader.innerHTML = '<div><p>Не удалось загрузить публикации.</p><button part="retry" type="button">Попробовать снова</button></div>'; }
  #showPageLoading() { this.#view.innerHTML = '<div part="page-loading"><div part="spinner"></div>Загружаем…</div>'; }
  #showPageError(message) { this.#view.innerHTML = `<div part="page-loading"><p>${message}</p><a part="primary-button" href="#/">Вернуться в ленту</a></div>`; }
}

customElements.define('stream-more', StreamMore);
