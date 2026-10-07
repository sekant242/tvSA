/**
 * Horror Section для Lampa
 * Плагин добавляет тематический раздел «Ужасы» с:
 *  - 10 визуальными скинами карточек (детерминированно-случайно)
 *  - 3 типами глюков/помех (RGB-сдвиг, slice, шум-всплеск)
 *  - Хоррор-тему секции (палитра, виньетка, зерно)
 *  - Тематические loading/empty состояния
 *  - Панель настроек с переключателями
 *  - Адаптацию под слабые ТВ и prefers-reduced-motion
 *
 * @author  you
 * @version 1.0.0
 */
(function () {
    'use strict';

    if (!window.Lampa) {
        console.warn('[Horror] Lampa не найдена');
        return;
    }

    // ========================================================================
    // КОНСТАНТЫ
    // ========================================================================

    const PLUGIN_ID       = 'horror_section';
    const SECTION_TITLE   = 'Ужасы';
    const SECTION_SVG     = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C7 2 3 5.5 3 10.5c0 3 1.3 5 2.5 7.2.5.9.5 2 .7 3 .1.5.6.8 1.1.6.7-.3 1.3-.8 2.2-.8.9 0 1.5.5 2.2.8.5.2 1-.1 1.1-.6.2-1 .2-2.1.7-3C14.7 15.5 16 13.5 16 10.5 16 5.5 12 2 12 2z" fill="currentColor"/></svg>';

    // Жанры TMDB
    const GENRE_HORROR   = 27;
    const GENRE_THRILLER = 53;

    // Скины
    const SKINS = [
        'skin-blood', 'skin-halloween', 'skin-ghost', 'skin-vhs',
        'skin-burnt', 'skin-static', 'skin-fog', 'skin-polaroid',
        'skin-scratch'
    ];
    const RARE_SKIN = 'skin-cursed';

    // Хэширование — стабильный FNV-1a
    function hashStr(str) {
        let h = 0x811c9dc5;
        str = String(str);
        for (let i = 0; i < str.length; i++) {
            h ^= str.charCodeAt(i);
            h = (h * 0x01000193) >>> 0;
        }
        return h;
    }

    // ========================================================================
    // ОПРЕДЕЛЕНИЕ ВОЗМОЖНОСТЕЙ
    // ========================================================================

    function isLightVersion() {
        return Lampa.Storage.field('light_version') === true;
    }

    function isTV() {
        return Lampa.Platform.screen('tv');
    }

    function prefersReducedMotion() {
        try {
            return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        } catch (e) {
            return false;
        }
    }

    // Стоит ли вообще анимировать
    function canAnimate() {
        if (isLightVersion()) return false;
        if (prefersReducedMotion()) return false;
        if (Lampa.Storage.get('horror_glitch_enable', 'true') === false) return false;
        if (isTV() && Lampa.Storage.get('horror_glitch_intensity', 'low') === 'off') return false;
        return true;
    }

    // ========================================================================
    // CSS — вся стилизация
    // ========================================================================

    function injectStyles() {
        if (document.getElementById('horror-styles')) return;

        const style = document.createElement('style');
        style.id = 'horror-styles';
        style.textContent = `

/* ================ ОБЩАЯ ТЕМА СЕКЦИИ ================ */

.horror-section {
    position: relative;
    background: radial-gradient(ellipse at center, #1a0a0a 0%, #0a0a0a 100%);
    min-height: 100%;
}
.horror-section::before {
    content: "";
    position: absolute; inset: 0;
    pointer-events: none;
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/></svg>");
    z-index: 0;
}
.horror-section::after {
    content: "";
    position: absolute; inset: 0;
    pointer-events: none;
    background: radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.55) 100%);
    z-index: 0;
}
.horror-section > * { position: relative; z-index: 1; }

.horror-section .horror-header {
    padding: 1.2em 1.5em 0.4em;
    display: flex;
    align-items: center;
    gap: 0.8em;
}
.horror-section .horror-header__title {
    font-size: 1.6em;
    font-weight: 700;
    color: #e8e0d8;
    letter-spacing: 0.05em;
    text-shadow: 0 0 12px rgba(193,18,31,0.45);
}
.horror-section .horror-header__subtitle {
    font-size: 0.85em;
    color: #8b7a72;
    opacity: 0.8;
}

/* ================ ПАНЕЛЬ ФИЛЬТРОВ ================ */

.horror-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5em;
    padding: 0.6em 1.5em 1em;
    overflow-x: auto;
}
.horror-filter {
    flex-shrink: 0;
    padding: 0.5em 1em;
    border-radius: 2em;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.08);
    color: #c8bfb8;
    font-size: 0.9em;
    cursor: pointer;
    transition: all .2s ease;
    user-select: none;
}
.horror-filter:hover,
.horror-filter.focus {
    background: rgba(193,18,31,0.25);
    border-color: rgba(193,18,31,0.7);
    color: #fff;
    box-shadow: 0 0 16px rgba(193,18,31,0.4);
}
.horror-filter.active {
    background: linear-gradient(135deg, #8b0000, #c1121f);
    border-color: #c1121f;
    color: #fff;
    box-shadow: 0 0 20px rgba(193,18,31,0.6);
}
.horror-filter__count {
    opacity: 0.55;
    margin-left: 0.4em;
    font-size: 0.85em;
}

/* ================ LOADING ================ */

.horror-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 6em 2em;
    gap: 1.5em;
    color: #b8a8a0;
}
.horror-loading__skull {
    width: 64px; height: 64px;
    opacity: 0.9;
    animation: horror-pulse 1.6s ease-in-out infinite;
    color: #c1121f;
}
.horror-loading__text {
    font-size: 1em;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    opacity: 0.7;
}
@keyframes horror-pulse {
    0%,100% { transform: scale(1); opacity: .7; }
    50%     { transform: scale(1.1); opacity: 1; }
}

/* ================ EMPTY ================ */

.horror-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 6em 2em;
    gap: 1.2em;
    text-align: center;
}
.horror-empty__title {
    font-size: 1.4em;
    color: #e8e0d8;
}
.horror-empty__text {
    max-width: 30em;
    color: #8b7a72;
    line-height: 1.5;
}

/* ================ СКИНЫ КАРТОЧЕК ================ */

.card.horror-skin {
    position: relative;
    overflow: hidden;
    transition: transform .25s ease, filter .25s ease;
}
.card.horror-skin .card__view { position: relative; }

.card.horror-skin .card__view::before,
.card.horror-skin .card__view::after {
    content: "";
    position: absolute; inset: 0;
    pointer-events: none;
    z-index: 2;
    opacity: 0;
    transition: opacity .3s ease;
}
.card.horror-skin.focus .card__view::before,
.card.horror-skin.focus .card__view::after { opacity: 1; }

/* --- 1. BLOOD --- */
.card.skin-blood .card__view::after {
    background:
        linear-gradient(180deg, transparent 55%, rgba(139,0,0,.75) 78%, rgba(80,0,0,.95) 100%),
        radial-gradient(ellipse at 30% 95%, rgba(193,18,31,.9), transparent 40%),
        radial-gradient(ellipse at 70% 100%, rgba(120,0,0,.8), transparent 35%);
    mix-blend-mode: multiply;
}
.card.skin-blood.focus { filter: saturate(1.3) contrast(1.1); }

/* --- 2. HALLOWEEN --- */
.card.skin-halloween .card__view::after {
    background: linear-gradient(135deg,
        rgba(255,120,0,.28) 0%,
        rgba(80,0,120,.35) 50%,
        rgba(255,80,0,.28) 100%);
    mix-blend-mode: overlay;
}

/* --- 3. GHOST --- */
.card.skin-ghost .card__view {
    filter: contrast(.9) brightness(.95);
}
.card.skin-ghost .card__view::after {
    background:
        radial-gradient(circle at 50% 40%, rgba(180,230,255,.28), transparent 60%),
        radial-gradient(circle at 50% 50%, transparent 40%, rgba(200,240,255,.18) 70%);
    animation: ghost-drift 6s ease-in-out infinite;
}
@keyframes ghost-drift {
    0%,100% { transform: translateY(0) scale(1); opacity: .6; }
    50%     { transform: translateY(-4px) scale(1.02); opacity: .95; }
}

/* --- 4. VHS --- */
.card.skin-vhs .card__view::before {
    background: repeating-linear-gradient(
        0deg,
        rgba(255,255,255,.05) 0 1px,
        transparent 1px 3px
    );
    mix-blend-mode: overlay;
}
.card.skin-vhs .card__view::after {
    background: linear-gradient(90deg,
        rgba(255,0,80,.10), transparent 20%, transparent 80%, rgba(0,200,255,.10));
}
.card.skin-vhs .card__view .card__img { filter: saturate(1.2) contrast(1.05); }
.card.skin-vhs::after {
    content: "REC ●";
    position: absolute; top: 6px; right: 8px;
    font: 700 10px/1 monospace;
    color: #ff2b2b;
    text-shadow: 0 0 6px rgba(255,0,0,.8);
    z-index: 5;
    opacity: .85;
    animation: rec-blink 1.2s steps(2) infinite;
}
@keyframes rec-blink { 50% { opacity: .25; } }

/* --- 5. BURNT --- */
.card.skin-burnt .card__view {
    filter: sepia(.4) contrast(1.15) brightness(.9);
}
.card.skin-burnt .card__view::after {
    background:
        radial-gradient(ellipse at 10% 0%, rgba(20,10,0,.9), transparent 40%),
        radial-gradient(ellipse at 90% 100%, rgba(30,10,0,.9), transparent 40%),
        radial-gradient(ellipse at 100% 0%, rgba(10,5,0,.8), transparent 30%);
}

/* --- 6. STATIC --- */
.card.skin-static .card__view::before {
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence baseFrequency='.9' numOctaves='2'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='.35'/></svg>");
    mix-blend-mode: screen;
    animation: static-shift .18s steps(3) infinite;
}
@keyframes static-shift {
    0%   { transform: translate(0,0); }
    33%  { transform: translate(-2px,1px); }
    66%  { transform: translate(1px,-2px); }
    100% { transform: translate(0,0); }
}

/* --- 7. FOG --- */
.card.skin-fog .card__view::after {
    background: linear-gradient(180deg,
        transparent 40%,
        rgba(200,210,220,.25) 75%,
        rgba(180,190,200,.5) 100%);
    background-size: 200% 100%;
    animation: fog-move 8s linear infinite;
}
@keyframes fog-move {
    0%   { background-position: 0 0; }
    100% { background-position: 60px 0; }
}

/* --- 8. POLAROID --- */
.card.skin-polaroid {
    background: #f5f1e8 !important;
    padding: 8px 8px 42px !important;
    border-radius: 2px;
    box-shadow: 2px 4px 14px rgba(0,0,0,.7);
    transform: rotate(-1.2deg);
    transition: transform .25s ease;
}
.card.skin-polaroid.focus { transform: rotate(0) scale(1.03); }
.card.skin-polaroid .card__title {
    color: #222 !important;
    font-family: 'Caveat', 'Comic Sans MS', cursive, sans-serif;
    position: absolute; bottom: 8px; left: 0; right: 0;
    text-align: center;
    font-size: 15px;
}
.card.skin-polaroid .card__age { color: #666 !important; }

/* --- 9. SCRATCH --- */
.card.skin-scratch .card__view::after {
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='300'><g stroke='white' stroke-opacity='.28' stroke-width='1' fill='none'><path d='M10 20 Q 60 80 40 200'/><path d='M150 10 Q 120 150 180 280'/><path d='M30 250 Q 90 260 160 240'/><path d='M70 40 L 90 210'/></g></svg>");
    background-size: cover;
    mix-blend-mode: screen;
}

/* --- 10. CURSED (редкий) --- */
.card.skin-cursed .card__view::after {
    background:
        radial-gradient(circle at 50% 50%, transparent 60%, rgba(120,0,0,.75) 100%),
        repeating-linear-gradient(45deg, rgba(255,0,0,.05) 0 4px, transparent 4px 12px);
    mix-blend-mode: multiply;
}
.card.skin-cursed.focus .card__view {
    filter: invert(.08) hue-rotate(-10deg) contrast(1.2);
}
.card.skin-cursed::before {
    content: "";
    position: absolute;
    width: 32px; height: 32px;
    right: 8px; top: 8px;
    background: radial-gradient(circle, #c1121f, #300);
    border-radius: 50%;
    box-shadow: 0 0 14px rgba(193,18,31,.9);
    z-index: 5;
    opacity: .9;
}

/* ================ ГЛЮКИ ================ */

/* RGB-сдвиг */
.card.horror-skin.glitch-rgb .card__img {
    animation: glitch-rgb .3s steps(2) 1;
}
@keyframes glitch-rgb {
    0%   { filter: none; transform: translateX(0); }
    20%  { filter: drop-shadow(2px 0 0 #ff003c) drop-shadow(-2px 0 0 #00e5ff); transform: translateX(-2px); }
    40%  { filter: drop-shadow(-3px 0 0 #ff003c) drop-shadow(3px 0 0 #00e5ff); transform: translateX(2px); }
    60%  { filter: drop-shadow(2px 0 0 #ff003c) drop-shadow(-2px 0 0 #00e5ff); transform: translateX(-1px); }
    100% { filter: none; transform: translateX(0); }
}

/* Slice-сдвиг */
.card.horror-skin.glitch-slice { position: relative; }
.card.horror-skin.glitch-slice .card__view::after {
    content: "";
    background: inherit;
    background-image: inherit;
    clip-path: polygon(0 30%, 100% 30%, 100% 42%, 0 42%);
    animation: slice-shift .28s steps(3) 1;
    opacity: 1 !important;
    mix-blend-mode: normal;
    background-color: rgba(255,0,80,.06);
}
@keyframes slice-shift {
    0%,100% { transform: translateX(0); opacity: 0; }
    30%     { transform: translateX(-14px); opacity: 1; }
    60%     { transform: translateX(10px); opacity: 1; }
}

/* Общий шум */
.card.horror-skin.glitch-noise .card__view::before {
    opacity: 1 !important;
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><filter id='n'><feTurbulence baseFrequency='.9'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='.5'/></svg>");
    mix-blend-mode: screen;
}

/* ================ НАСТРОЙКИ: КОМПОНЕНТ ================ */

.horror-settings-help {
    padding: 0.8em 1.2em;
    color: #8b7a72;
    font-size: 0.85em;
    line-height: 1.5;
}

/* ================ АДАПТАЦИЯ ================ */

@media (prefers-reduced-motion: reduce) {
    .horror-section *,
    .card.horror-skin * {
        animation: none !important;
        transition: none !important;
    }
}

body.light--version .horror-section::before,
body.light--version .horror-section::after {
    display: none;
}
body.light--version .card.horror-skin .card__view::before,
body.light--version .card.horror-skin .card__view::after {
    display: none;
}

        `;
        document.head.appendChild(style);
    }

    // ========================================================================
    // СКИНЫ
    // ========================================================================

    function pickSkin(card) {
        if (Lampa.Storage.get('horror_skins_enable', 'true') === false) return null;

        const key = String(card.id || card.title || card.name || '');
        if (!key) return null;

        const h = hashStr(key);

        // Редкий скин
        if (Lampa.Storage.get('horror_rare_skin', 'true') !== false) {
            if (h % 100 < 5) return RARE_SKIN;
        }

        return SKINS[h % SKINS.length];
    }

    function applySkin(cardElement, card) {
        if (!cardElement || cardElement.classList.contains('horror-skin')) return;
        const skin = pickSkin(card || cardElement.card_data || {});
        if (!skin) return;

        cardElement.classList.add('horror-skin', skin);

        // Кэшируем, чтобы MutationObserver не трогал повторно
        cardElement.dataset.horrorSkin = skin;
    }

    function decorateCards(root) {
        if (!root) return;
        const cards = root.querySelectorAll('.card:not(.horror-skin)');
        cards.forEach(el => applySkin(el, el.card_data));
    }

    // ========================================================================
    // ГЛЮКИ
    // ========================================================================

    let glitchNoiseTimer = null;

    function glitchRgb(elem) {
        if (!canAnimate() || !elem) return;
        elem.classList.add('glitch-rgb');
        setTimeout(() => elem.classList.remove('glitch-rgb'), 320);
    }

    function glitchSlice(elem) {
        if (!canAnimate() || !elem) return;
        elem.classList.add('glitch-slice');
        setTimeout(() => elem.classList.remove('glitch-slice'), 300);
    }

    function startNoiseLoop() {
        if (glitchNoiseTimer) clearInterval(glitchNoiseTimer);

        const intensity = Lampa.Storage.get('horror_glitch_intensity', 'low');
        if (intensity === 'off') return;

        const interval = intensity === 'high' ? 2500
                       : intensity === 'medium' ? 4000
                       : 7000;

        glitchNoiseTimer = setInterval(() => {
            if (!canAnimate()) return;

            const cards = Array.from(
                document.querySelectorAll('.horror-section .card.horror-skin')
            ).filter(c => c.offsetParent !== null);

            if (!cards.length) return;

            const victim = cards[Math.floor(Math.random() * cards.length)];
            const roll = Math.random();

            if (roll < 0.15) glitchSlice(victim);
            else if (roll < 0.35) glitchRgb(victim);
            else {
                victim.classList.add('glitch-noise');
                setTimeout(() => victim.classList.remove('glitch-noise'), 140);
            }
        }, interval);
    }

    function stopNoiseLoop() {
        if (glitchNoiseTimer) {
            clearInterval(glitchNoiseTimer);
            glitchNoiseTimer = null;
        }
    }

    // Глобальный hover-триггер на карточки внутри секции
    function bindGlitchEvents() {
        document.addEventListener('focusin', e => {
            const card = e.target.closest && e.target.closest('.horror-section .card.horror-skin');
            if (card) glitchRgb(card);
        });
    }

    // ========================================================================
    // TMDB: зАПРОС КАТАЛОГА
    // ========================================================================

    const TMDB = Lampa.Api.sources.tmdb;

    const LANG_LIST = [
        { code: 'ru',    title: 'Русский' },
        { code: 'en',    title: 'Английский' },
        { code: 'ja',    title: 'Японский' },
        { code: 'ko',    title: 'Корейский' },
        { code: 'es',    title: 'Испанский' },
        { code: 'fr',    title: 'Французский' },
        { code: 'de',    title: 'Немецкий' },
        { code: 'it',    title: 'Итальянский' },
        { code: 'zh',    title: 'Китайский' },
        { code: 'hi',    title: 'Хинди' }
    ];

    const SUBGENRES = [
        { id: 12377,  title: 'Зомби',       icon: '🧟' },
        { id: 3133,   title: 'Вампиры',     icon: '🧛' },
        { id: 9714,   title: 'Призраки',    icon: '👻' },
        { id: 156841, title: 'Слэшер',      icon: '🔪' },
        { id: 9951,   title: 'Пришельцы',   icon: '👽' },
        { id: 10349,  title: 'Выживание',   icon: '🏚️' },
        { id: 10873,  title: 'Школа',       icon: '🎒' },
        { id: 9748,   title: 'Месть',       icon: '🩸' },
        { id: 155279, title: 'Проклятие',   icon: '🕯️' },
        { id: 14819,  title: 'Насилие',     icon: '💀' }
    ];

    const STUDIOS = [
        { id: 3172,  title: 'Blumhouse',           logo: '/qp2kIpmgozmhFtiB9JgL5hnwHu.jpg' },
        { id: 41077, title: 'A24',                 logo: '/1ZXsGaFPgrgS6ZZGS37AqD5uU12.jpg' },
        { id: 10343, title: 'Hammer Film',         logo: '/6Q3G8B1cPYrKMqjRmNPVoiEUg8e.jpg' },
        { id: 9073,  title: 'Ghost House Pictures', logo: '/hJfJRu5OeP0YfE0QjAq7TqCFq3e.jpg' },
        { id: 40254, title: 'New Line Cinema',     logo: '/9xTbEQb5WcL46FbDlpQpb3qDg5G.jpg' }
    ];

    // ========================================================================
    // КОМПОНЕНТ «УЖАСЫ»
    // ========================================================================

    function HorrorSection(object) {
        const self = this;

        const scroll = new Lampa.Scroll({
            mask: true,
            over: true,
            step: 250,
            end_ratio: 2
        });

        const html = document.createElement('div');
        html.className = 'horror-section';

        const body = document.createElement('div');
        body.className = 'horror-body';

        // Фильтры текущего состояния
        const state = {
            genre: 'all',       // all | horror | thriller
            lang: '',
            subgenre: null,
            studio: null,
            page: 1
        };

        let items = [];
        let observer = null;
        let decorateTimer = null;
        let totalPages = 1;
        let lastFocused = null;
        let isDestroyed = false;

        // ---------- ЗАГРУЗКА ----------

        function buildQuery(extra) {
            const params = [];

            if (state.genre === 'horror') params.push('with_genres=' + GENRE_HORROR);
            else if (state.genre === 'thriller') params.push('with_genres=' + GENRE_THRILLER);
            else params.push('with_genres=' + GENRE_HORROR + ',' + GENRE_THRILLER);

            if (state.lang) params.push('with_original_language=' + state.lang);
            if (state.subgenre) params.push('with_keywords=' + state.subgenre.id);
            if (state.studio) params.push('with_companies=' + state.studio.id);

            params.push('sort_by=popularity.desc');
            params.push('vote_count.gte=50');
            params.push('page=' + state.page);

            Object.assign(params, extra || {});
            return 'discover/movie?' + params.join('&');
        }

        function load(callback) {
            showLoading();

            const query = buildQuery();

            TMDB.get(query, {}, function (data) {
                if (isDestroyed) return;
                totalPages = Math.min(data.total_pages || 1, 20);

                if (!data.results || !data.results.length) {
                    showEmpty();
                    callback && callback(false);
                    return;
                }

                data.results.forEach(r => r.source = 'tmdb');
                appendCards(data.results, state.page > 1);
                callback && callback(true);
            }, function () {
                if (isDestroyed) return;
                showEmpty('Не удалось загрузить. Даже демоны иногда ошибаются.');
                callback && callback(false);
            }, { life: 60 * 6 });
        }

        function loadMore() {
            if (state.page >= totalPages) return;
            state.page++;
            load();
        }

        // ---------- ОТРИСОВКА ----------

        function showLoading() {
            const loading = document.createElement('div');
            loading.className = 'horror-loading';
            loading.innerHTML = `
                <div class="horror-loading__skull">${SECTION_SVG}</div>
                <div class="horror-loading__text">Ищем то, что вас напугает...</div>
            `;
            body.appendChild(loading);
        }

        function clearBody() {
            Array.from(body.children).forEach(c => {
                if (c.classList.contains('horror-loading') ||
                    c.classList.contains('horror-empty')) c.remove();
            });
        }

        function showEmpty(text) {
            const empty = document.createElement('div');
            empty.className = 'horror-empty';
            empty.innerHTML = `
                <div class="horror-empty__title">В этой категории пока тихо</div>
                <div class="horror-empty__text">${text || 'Даже монстры иногда спят. Попробуйте изменить фильтр.'}</div>
            `;
            body.appendChild(empty);
        }

        function appendCards(results, append) {
            const fragment = document.createDocumentFragment();

            results.forEach((element, i) => {
                const card = Lampa.Maker.make('Card', element);
                card.create();

                const elem = card.render(true);

                // Скин — назначаем сразу
                applySkin(elem, element);

                // События карточки
                elem.addEventListener('hover:focus', function () {
                    lastFocused = elem;
                    scroll.update(elem);
                    Lampa.Background.change(Lampa.Utils.cardImgBackground(element));
                    glitchRgb(elem);
                });

                elem.addEventListener('hover:enter', function () {
                    glitchSlice(elem);
                    setTimeout(() => {
                        Lampa.Activity.push({
                            url: '',
                            component: 'full',
                            id: element.id,
                            method: 'movie',
                            card: element,
                            source: 'tmdb'
                        });
                    }, 180);
                });

                // Задержка появления — staggered
                if (canAnimate()) {
                    elem.style.opacity = '0';
                    elem.style.transform = 'translateY(12px)';
                    elem.style.transition = 'opacity .35s ease, transform .35s ease';
                    setTimeout(() => {
                        elem.style.opacity = '1';
                        elem.style.transform = 'translateY(0)';
                    }, (append ? 0 : i * 40));
                }

                fragment.appendChild(elem);
                items.push(card);
            });

            body.appendChild(fragment);
            Lampa.Layer.visible(scroll.render(true));
        }

        // ---------- ПАНЕЛЬ ФИЛЬТРОВ ----------

        function renderFilters() {
            const wrap = document.createElement('div');
            wrap.className = 'horror-filters';

            // Жанр
            [
                { key: 'all',      title: 'Все',      count: null },
                { key: 'horror',   title: 'Ужасы',    count: null },
                { key: 'thriller', title: 'Триллеры', count: null }
            ].forEach(g => {
                wrap.appendChild(makeFilter(g.title, state.genre === g.key, () => {
                    if (state.genre === g.key) return;
                    state.genre = g.key;
                    resetAndReload();
                }));
            });

            // Язык
            LANG_LIST.forEach(l => {
                wrap.appendChild(makeFilter(l.title, state.lang === l.code, () => {
                    state.lang = state.lang === l.code ? '' : l.code;
                    resetAndReload();
                }));
            });

            // Поджанры
            SUBGENRES.forEach(s => {
                wrap.appendChild(makeFilter(`${s.icon} ${s.title}`, state.subgenre && state.subgenre.id === s.id, () => {
                    state.subgenre = state.subgenre && state.subgenre.id === s.id ? null : s;
                    resetAndReload();
                }));
            });

            // Студии (только иконки с подписью)
            STUDIOS.forEach(s => {
                wrap.appendChild(makeFilter(s.title, state.studio && state.studio.id === s.id, () => {
                    state.studio = state.studio && state.studio.id === s.id ? null : s;
                    resetAndReload();
                }));
            });

            return wrap;
        }

        function makeFilter(title, active, onSelect) {
            const el = document.createElement('div');
            el.className = 'horror-filter selector' + (active ? ' active' : '');
            el.textContent = title;
            el.addEventListener('hover:enter', onSelect);
            el.addEventListener('click', () => {
                // Клик мышью
                onSelect();
            });
            return el;
        }

        function resetAndReload() {
            // Обнуляем список
            items.forEach(c => { try { c.destroy(); } catch (e) {} });
            items = [];
            state.page = 1;
            body.innerHTML = '';
            body.appendChild(renderFilters());
            body.appendChild(renderList());

            // Загрузка
            load();
        }

        function renderList() {
            const list = document.createElement('div');
            list.className = 'horror-list';

            // Наблюдаем за добавлением карточек — на всякий случай
            if (observer) observer.disconnect();
            observer = new MutationObserver(() => {
                if (decorateTimer) clearTimeout(decorateTimer);
                decorateTimer = setTimeout(() => decorateCards(list), 80);
            });
            observer.observe(list, { childList: true, subtree: true });

            return list;
        }

        // ---------- КОНТРОЛЛЕР ----------

        function buildController() {
            Lampa.Controller.add('content', {
                link: self,
                toggle() {
                    scroll.restorePosition && scroll.restorePosition();
                    Lampa.Controller.collectionSet(scroll.render());
                    Lampa.Controller.collectionFocus(lastFocused, scroll.render());
                },
                left() {
                    if (Lampa.Navigator.canmove('left')) Lampa.Navigator.move('left');
                    else Lampa.Controller.toggle('menu');
                },
                right() {
                    Lampa.Navigator.move('right');
                },
                up() {
                    if (Lampa.Navigator.canmove('up')) Lampa.Navigator.move('up');
                    else Lampa.Controller.toggle('head');
                },
                down() {
                    Lampa.Navigator.move('down');
                },
                back() {
                    Lampa.Activity.backward();
                }
            });
            Lampa.Controller.toggle('content');
        }

        // ---------- ЖИЗНЕННЫЙ ЦИКЛ ----------

        this.create = function () {
            // Шапка
            const header = document.createElement('div');
            header.className = 'horror-header';
            header.innerHTML = `
                <div class="horror-header__title">${SECTION_TITLE}</div>
                <div class="horror-header__subtitle">То, что живёт в темноте</div>
            `;
            html.appendChild(header);

            // Скролл
            scroll.minus();
            scroll.append(body);

            // Фильтры + список
            body.appendChild(renderFilters());
            body.appendChild(renderList());

            html.appendChild(scroll.render(true));

            // Загрузка
            load();
        };

        this.start = function () {
            buildController();
            Background && Lampa.Background.change('');

            if (canAnimate()) {
                startNoiseLoop();
                bindGlitchEvents();
            }
        };

        this.pause = function () {
            stopNoiseLoop();
        };

        this.stop = function () {
            stopNoiseLoop();
        };

        this.render = function (js) {
            return js ? html : window.jQuery ? window.jQuery(html) : html;
        };

        this.destroy = function () {
            isDestroyed = true;
            stopNoiseLoop();
            if (observer) observer.disconnect();
            if (decorateTimer) clearTimeout(decorateTimer);
            items.forEach(c => { try { c.destroy(); } catch (e) {} });
            items = [];
            try { scroll.destroy(); } catch (e) {}
            html.remove();
        };

        // Пагинация при скролле
        scroll.onEnd = loadMore;
    }

    // ========================================================================
    // НАСТРОЙКИ
    // ========================================================================

    function initSettings() {
        Lampa.SettingsApi.addComponent({
            component: 'horror',
            name: SECTION_TITLE,
            icon: SECTION_SVG
        });

        Lampa.SettingsApi.addParam({
            component: 'horror',
            param: { type: 'title' },
            field: { name: 'Внешний вид' }
        });

        Lampa.SettingsApi.addParam({
            component: 'horror',
            param: {
                name: 'horror_skins_enable',
                type: 'trigger',
                default: true
            },
            field: {
                name: 'Визуальные скины карточек',
                description: '10 разных тем: кровавые, призрачные, VHS и т.д.'
            }
        });

        Lampa.SettingsApi.addParam({
            component: 'horror',
            param: {
                name: 'horror_rare_skin',
                type: 'trigger',
                default: true
            },
            field: {
                name: 'Редкие «проклятые» карточки',
                description: 'Примерно 5% карточек получают особый скин'
            }
        });

        Lampa.SettingsApi.addParam({
            component: 'horror',
            param: { type: 'title' },
            field: { name: 'Эффекты' }
        });

        Lampa.SettingsApi.addParam({
            component: 'horror',
            param: {
                name: 'horror_glitch_enable',
                type: 'trigger',
                default: true
            },
            field: {
                name: 'Помехи и глюки',
                description: 'RGB-сдвиг, slice и шумовые всплески'
            }
        });

        Lampa.SettingsApi.addParam({
            component: 'horror',
            param: {
                name: 'horror_glitch_intensity',
                type: 'select',
                values: {
                    off: 'Выключено',
                    low: 'Редко',
                    medium: 'Средне',
                    high: 'Часто'
                },
                default: 'low'
            },
            field: {
                name: 'Интенсивность глюков'
            },
            onChange() {
                if (isDestroyed) return;
                if (canAnimate()) startNoiseLoop(); else stopNoiseLoop();
            }
        });
    }

    // ========================================================================
    // ИНТЕГРАЦИЯ В МЕНЮ
    // ========================================================================

    function initMenu() {
        let retries = 0;
        const MAX = 60;

        function tryAdd() {
            if (retries++ > MAX) {
                console.warn('[Horror] не удалось добавить в меню');
                return;
            }

            if (!Lampa.Menu || !Lampa.Menu.addButton) {
                return setTimeout(tryAdd, 250);
            }

            try {
                const btn = Lampa.Menu.addButton(SECTION_SVG, SECTION_TITLE, () => {
                    Lampa.Activity.push({
                        url: '',
                        title: SECTION_TITLE,
                        component: PLUGIN_ID,
                        page: 1
                    });
                });
                if (!btn) throw new Error('addButton вернул false');
                console.log('[Horror] добавлено в меню');
            } catch (e) {
                setTimeout(tryAdd, 250);
            }
        }

        tryAdd();
    }

    // ========================================================================
    // СТАРТ
    // ========================================================================

    function init() {
        injectStyles();

        // Регистрируем компонент
        Lampa.Component.add(PLUGIN_ID, HorrorSection);

        // Меню
        initMenu();

        // Настройки
        initSettings();

        // Принудительно украшаем карточки при каждой смене активности,
        // если пользователь попал на нашу секцию
        Lampa.Listener.follow('activity', e => {
            if (e.type === 'start' && e.component === PLUGIN_ID) {
                const section = document.querySelector('.horror-section');
                if (section) decorateCards(section);
            }
            if (e.type === 'destroy') {
                stopNoiseLoop();
            }
        });

        console.log('[Horror] плагин готов');
    }

    // Инициализация после готовности Lampa
    if (window.appready) {
        init();
    } else {
        Lampa.Listener.follow('app', e => {
            if (e.type === 'ready') init();
        });
    }

})();