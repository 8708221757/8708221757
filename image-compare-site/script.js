// Image Duel logic with elimination persistence
(function() {
  const STORAGE_KEYS = {
    pool: 'image_duel_pool_v1',
    eliminated: 'image_duel_eliminated_v1',
    final: 'image_duel_final_v1'
  };

  const defaultImages = [
    'images/sample-1.jpg',
    'images/sample-2.jpg',
    'images/sample-3.jpg',
    'images/sample-4.jpg',
    'images/sample-5.jpg',
    'images/sample-6.jpg'
  ];

  /**
   * Initialize pool from localStorage or defaults.
   * Pool contains images that are still eligible for duels.
   */
  function loadPool() {
    const raw = localStorage.getItem(STORAGE_KEYS.pool);
    if (raw) {
      try { return JSON.parse(raw); } catch (_) { /* fallthrough */ }
    }
    const initial = Array.from(new Set(defaultImages));
    localStorage.setItem(STORAGE_KEYS.pool, JSON.stringify(initial));
    localStorage.removeItem(STORAGE_KEYS.final);
    return initial;
  }

  function savePool(pool) {
    localStorage.setItem(STORAGE_KEYS.pool, JSON.stringify(pool));
  }

  function addEliminated(path) {
    const raw = localStorage.getItem(STORAGE_KEYS.eliminated);
    const set = new Set(raw ? JSON.parse(raw) : []);
    set.add(path);
    localStorage.setItem(STORAGE_KEYS.eliminated, JSON.stringify(Array.from(set)));
  }

  function saveFinal(path) {
    if (!path) return;
    localStorage.setItem(STORAGE_KEYS.final, path);
  }

  function getFinal() {
    return localStorage.getItem(STORAGE_KEYS.final) || '';
  }

  function shuffleInPlace(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  function pickTwoDistinct(pool) {
    if (pool.length < 2) return [];
    const indices = Array.from({ length: pool.length }, (_, i) => i);
    shuffleInPlace(indices);
    const [a, b] = indices;
    return [pool[a], pool[b]];
  }

  function qs(id) { return document.getElementById(id); }

  function setCard(buttonEl, imgPath) {
    buttonEl.innerHTML = '';
    const img = document.createElement('img');
    img.src = imgPath;
    img.alt = 'Candidate image';
    buttonEl.appendChild(img);
  }

  function render(pool) {
    const remainingCount = qs('remainingCount');
    remainingCount.textContent = String(pool.length);

    const duel = qs('duel');
    const empty = qs('emptyState');
    const final = qs('finalState');

    if (pool.length >= 2) {
      duel.classList.remove('hidden');
      empty.classList.add('hidden');
      final.classList.add('hidden');
      const [left, right] = pickTwoDistinct(pool);
      setCard(qs('leftCard'), left);
      setCard(qs('rightCard'), right);
      qs('leftCard').dataset.left = left;
      qs('rightCard').dataset.right = right;
      return;
    }

    if (pool.length === 1) {
      // Show empty with option to reveal final
      duel.classList.add('hidden');
      empty.classList.remove('hidden');
      final.classList.add('hidden');
      saveFinal(pool[0]);
      return;
    }

    // No images available
    duel.classList.add('hidden');
    empty.classList.remove('hidden');
  }

  function choose(winnerPath, loserPath) {
    const pool = loadPool();
    const nextPool = pool.filter(p => p !== loserPath);
    savePool(nextPool);
    addEliminated(loserPath);
    if (nextPool.length === 1) {
      saveFinal(nextPool[0]);
    }
    render(nextPool);
  }

  function onReset() {
    localStorage.removeItem(STORAGE_KEYS.pool);
    localStorage.removeItem(STORAGE_KEYS.eliminated);
    localStorage.removeItem(STORAGE_KEYS.final);
    const pool = loadPool();
    render(pool);
  }

  function onShowFinal() {
    const finalPath = getFinal();
    const finalImg = qs('finalImage');
    if (finalPath) {
      finalImg.src = finalPath;
      finalImg.alt = 'Final top image';
    }
    qs('finalState').classList.remove('hidden');
  }

  function wireEvents() {
    const leftBtn = qs('leftCard');
    const rightBtn = qs('rightCard');
    leftBtn.addEventListener('click', () => {
      const left = leftBtn.dataset.left;
      const right = qs('rightCard').dataset.right;
      if (left && right && left !== right) choose(left, right);
    });
    rightBtn.addEventListener('click', () => {
      const left = qs('leftCard').dataset.left;
      const right = rightBtn.dataset.right;
      if (left && right && left !== right) choose(right, left);
    });
    qs('resetBtn').addEventListener('click', onReset);
    qs('showFinalBtn').addEventListener('click', onShowFinal);
  }

  function boot() {
    wireEvents();
    const pool = loadPool();
    render(pool);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

