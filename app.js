'use strict';

Chart.register(ChartDataLabels);

const PALETTE = [
  ['#4A7FC1', '#6B9BD4', '#8FB5E2', '#B8D0EF'],
  ['#C25A3A', '#D47A5E', '#E29B82', '#EFC0AB'],
  ['#3A9C6E', '#5DB88A', '#82CEA8', '#AADEC6'],
  ['#9C3AB4', '#B85ED0', '#CE82E0', '#E4B2F0'],
  ['#B4943A', '#CEB05E', '#DEC882', '#EFE0AA'],
  ['#3A7C9C', '#5E9CB8', '#82BECE', '#AADAEC'],
  ['#7C3A9C', '#9C5EB8', '#BC82CE', '#D8AAEC'],
  ['#9C7A3A', '#B8965E', '#CEB082', '#E4CCAA'],
  ['#3A9C9C', '#5EB8B8', '#82CECE', '#AAE4E4'],
];

const APP_BASE_URL = 'https://oshipofo.papan-shiki.com/';
const X_HASHTAG = '推しポフォ';

const INTRO_MODAL_KEY = 'oshipofo_intro_seen';
let introStep = 0;

function syncIntroStep() {
  const pages = document.querySelectorAll('.intro-page');
  const indicators = document.querySelectorAll('[data-step-indicator]');
  const prev = document.getElementById('introPrev');
  const next = document.getElementById('introNext');

  pages.forEach((page, index) => {
    const active = index === introStep;
    page.classList.toggle('active', active);
    page.setAttribute('aria-hidden', active ? 'false' : 'true');
  });

  indicators.forEach((dot, index) => {
    dot.classList.toggle('active', index === introStep);
  });

  prev.hidden = introStep === 0;
  next.textContent = introStep === pages.length - 1 ? 'はじめる' : '次へ';
}

function openIntroModal(force = false) {
  if (!force && localStorage.getItem(INTRO_MODAL_KEY)) return;
  const modal = document.getElementById('introModal');
  if (!modal) return;
  introStep = 0;
  syncIntroStep();
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeIntroModal() {
  const modal = document.getElementById('introModal');
  if (!modal) return;
  modal.hidden = true;
  document.body.style.overflow = '';
  localStorage.setItem(INTRO_MODAL_KEY, '1');
}

function nextIntroStep() {
  const pages = document.querySelectorAll('.intro-page');
  if (introStep >= pages.length - 1) {
    closeIntroModal();
    return;
  }
  introStep += 1;
  syncIntroStep();
}

function prevIntroStep() {
  if (introStep === 0) return;
  introStep -= 1;
  syncIntroStep();
}

let nextId = 200;

const defaultGenreCategories = [
  {
    id: 1,
    name: 'アニメ・漫画・小説',
    ratio: 45,
    colorIdx: 1,
    children: [
      { id: 11, name: 'クレヨンしんちゃん', ratio: 40 },
      { id: 12, name: '名探偵コナン', ratio: 35 },
      { id: 13, name: 'ドラえもん', ratio: 25 },
    ],
    open: false,
  },
  {
    id: 2,
    name: 'アーティスト・タレント',
    ratio: 20,
    colorIdx: 2,
    children: [
      { id: 21, name: 'SMAP', ratio: 50 },
      { id: 22, name: '西野カナ', ratio: 50 },
    ],
    open: false,
  },
  {
    id: 3,
    name: 'スポーツ・競技',
    ratio: 25,
    colorIdx: 3,
    children: [
      { id: 31, name: 'プロ野球', ratio: 50 },
      { id: 32, name: 'Mリーグ', ratio: 50 },
    ],
    open: false,
  },
  {
    id: 4,
    name: 'ゲーム',
    ratio: 10,
    colorIdx: 0,
    children: [
      { id: 41, name: 'ポケモン', ratio: 50 },
      { id: 42, name: 'ぷよぷよ', ratio: 30 },
      { id: 43, name: 'FF', ratio: 20 },
    ],
    open: false,
  },
];

const defaultWorksCategories = [
  { id: 101, name: 'クレヨンしんちゃん', ratio: 30, colorIdx: 1, children: [], open: false },
  { id: 102, name: 'ちいかわ', ratio: 25, colorIdx: 3, children: [], open: false },
  { id: 103, name: 'ドラえもん', ratio: 20, colorIdx: 0, children: [], open: false },
  { id: 104, name: '名探偵コナン', ratio: 15, colorIdx: 5, children: [], open: false },
  { id: 105, name: 'クッキングパパ', ratio: 10, colorIdx: 4, children: [], open: false },
];

let modeData = {
  genre: {
    title: 'my推しポフォ',
    categories: JSON.parse(JSON.stringify(defaultGenreCategories))
  },
  works: {
    title: 'my推し作品ポフォ',
    categories: JSON.parse(JSON.stringify(defaultWorksCategories))
  }
};

let currentMode = 'genre';
let categories = modeData[currentMode].categories;
let mainChartInstance = null;
let drillChartInstance = null;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getTotal() {
  return categories.reduce((sum, cat) => sum + cat.ratio, 0);
}

function nextColorIdx() {
  const used = new Set(categories.map(cat => cat.colorIdx));
  for (let i = 0; i < PALETTE.length; i += 1) {
    if (!used.has(i)) return i;
  }
  return Math.floor(Math.random() * PALETTE.length);
}

function buildMainData() {
  const labels = [];
  const data = [];
  const colors = [];
  const catIds = [];

  categories.forEach(cat => {
    const palette = PALETTE[cat.colorIdx % PALETTE.length];
    if (!cat.children.length) {
      labels.push(cat.name);
      data.push(cat.ratio);
      colors.push(palette[0]);
      catIds.push(cat.id);
      return;
    }

    const childTotal = cat.children.reduce((sum, child) => sum + child.ratio, 0) || 1;
    cat.children.forEach((child, index) => {
      labels.push(`${cat.name} / ${child.name}`);
      data.push(cat.ratio * child.ratio / childTotal);
      colors.push(palette[Math.min(index, 3)]);
      catIds.push(cat.id);
    });
  });

  return { labels, data, colors, catIds };
}

function updateCenterTitle() {
  document.getElementById('centerTitle').innerHTML = (document.getElementById('titleInput').value || '推しポフォ').replace(/\n/g, '<br>');
}

function updateUsernameDisplay() {
  const name = document.getElementById('nameInput').value.trim();
  const el = document.getElementById('usernameDisplay');
  if (name) {
    el.textContent = `${name}さんの推しポフォ`;
    el.classList.add('visible');
  } else {
    el.textContent = '';
    el.classList.remove('visible');
  }
}

function renderMainChart() {
  const canvas = document.getElementById('mainChart');
  const { labels, data, colors, catIds } = buildMainData();

  if (mainChartInstance) mainChartInstance.destroy();

  mainChartInstance = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: '#F7F5F0',
        hoverBorderWidth: 0,
        hoverOffset: 8,
      }]
    },
    options: {
      responsive: false,
      cutout: '58%',
      animation: { duration: 400, easing: 'easeInOutQuart' },
      plugins: {
        legend: { display: false },
        datalabels: {
          color: '#FFFFFF',
          textStrokeColor: '#000000',
          textStrokeWidth: 0.5,
          font: { size: 11, weight: '700', family: '"DM Sans", sans-serif' },
          textAlign: 'center',
          display: ctx => {
            const total = ctx.dataset.data.reduce((a, b) => a + b, 0) || 1;
            return ctx.dataset.data[ctx.dataIndex] / total > 0.05;
          },
          formatter: (_, ctx) => {
            const label = ctx.chart.data.labels[ctx.dataIndex];
            const parts = label.split(' / ');
            return parts.length > 1 ? parts[1] : parts[0];
          },
        },
        tooltip: {
          callbacks: {
            label: ctx => {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0) || 1;
              return `  ${ctx.label}: ${Math.round(ctx.raw / total * 100)}%`;
            }
          }
        }
      },
      onClick: (_, elements) => {
        if (!elements.length) return;
        const catId = catIds[elements[0].index];
        const cat = categories.find(item => item.id === catId);
        if (cat && cat.children.length > 0) openDrill(cat.id);
      }
    }
  });
}

function openDrill(catId) {
  const cat = categories.find(item => item.id === catId);
  if (!cat || !cat.children.length) return;

  const palette = PALETTE[cat.colorIdx % PALETTE.length];
  document.getElementById('drillLabel').textContent = `${cat.name} の内訳`;
  document.getElementById('drillCenterTitle').textContent = cat.name;
  document.getElementById('drillPanel').classList.add('open');

  const canvas = document.getElementById('drillChart');
  if (drillChartInstance) drillChartInstance.destroy();

  drillChartInstance = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: cat.children.map(child => child.name),
      datasets: [{
        data: cat.children.map(child => child.ratio),
        backgroundColor: cat.children.map((_, index) => palette[Math.min(index, 3)]),
        borderWidth: 2,
        borderColor: '#FFFFFF',
        hoverOffset: 6,
      }]
    },
    options: {
      responsive: false,
      cutout: '55%',
      animation: { duration: 300 },
      plugins: {
        legend: { display: false },
        datalabels: {
          color: '#FFFFFF',
          textStrokeColor: '#000000',
          textStrokeWidth: 0.5,
          font: { size: 11, weight: '700', family: '"DM Sans", sans-serif' },
          textAlign: 'center',
          display: ctx => {
            const total = ctx.dataset.data.reduce((a, b) => a + b, 0) || 1;
            return ctx.dataset.data[ctx.dataIndex] / total > 0.05;
          },
          formatter: (_, ctx) => ctx.chart.data.labels[ctx.dataIndex],
        },
        tooltip: {
          callbacks: {
            label: ctx => {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0) || 1;
              return `  ${ctx.label}: ${Math.round(ctx.raw / total * 100)}%`;
            }
          }
        }
      }
    }
  });
}

function closeDrill() {
  document.getElementById('drillPanel').classList.remove('open');
  if (drillChartInstance) {
    drillChartInstance.destroy();
    drillChartInstance = null;
  }
}

function renderLegend() {
  const list = document.getElementById('legendList');
  list.innerHTML = '';
  const { labels, data, colors } = buildMainData();
  const total = data.reduce((a, b) => a + b, 0) || 1;

  labels.forEach((label, index) => {
    const item = document.createElement('div');
    item.className = 'legend-item';
    item.innerHTML = `
      <span class="legend-swatch" style="background:${colors[index]}"></span>
      <span>${escHtml(label)}</span>
      <span class="legend-pct">${Math.round(data[index] / total * 100)}%</span>
    `;
    list.appendChild(item);
  });
}

function renderTotal() {
  const total = getTotal();
  const pct = Math.min(total, 100);
  document.getElementById('totalFill').style.width = `${pct}%`;
  document.getElementById('totalFill').classList.toggle('over', total > 100);
  document.getElementById('totalNum').textContent = `${total}%`;
  document.getElementById('totalWarn').textContent = total === 100 ? '' : '合計が100%になるように調整してください';
}

function renderList() {
  const list = document.getElementById('catList');
  list.innerHTML = '';

  categories.forEach(cat => {
    const palette = PALETTE[cat.colorIdx % PALETTE.length];
    const childTotal = cat.children.reduce((sum, child) => sum + child.ratio, 0) || 1;

    const item = document.createElement('div');
    item.className = 'cat-item';
    item.dataset.id = cat.id;

    const header = document.createElement('div');
    header.className = 'cat-header';
    header.innerHTML = `
      <span class="cat-swatch" style="background:${palette[0]}"></span>
      <input class="cat-name-input" data-id="${cat.id}" value="${escHtml(cat.name)}" />
      <span class="cat-pct">${cat.ratio}%</span>
      <button class="cat-del" data-id="${cat.id}" title="削除">×</button>
    `;
    item.appendChild(header);

    const sliderRow = document.createElement('div');
    sliderRow.className = 'slider-row';
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = 0;
    slider.max = 100;
    slider.step = 1;
    slider.value = cat.ratio;
    slider.style.accentColor = palette[0];
    slider.dataset.id = cat.id;
    slider.className = 'cat-slider';
    sliderRow.appendChild(slider);
    item.appendChild(sliderRow);

    const toggle = document.createElement('button');
    toggle.className = `expand-toggle${cat.open ? ' open' : ''}`;
    toggle.dataset.id = cat.id;
    toggle.innerHTML = `
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d="M3 2l4 3-4 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      内訳 (${cat.children.length}件)
    `;
    item.appendChild(toggle);

    const childArea = document.createElement('div');
    childArea.className = `child-area${cat.open ? ' open' : ''}`;
    childArea.id = `children-${cat.id}`;

    cat.children.forEach((child, index) => {
      const pct = Math.round(child.ratio / childTotal * 100);
      const row = document.createElement('div');
      row.className = 'child-row';
      row.innerHTML = `
        <span class="child-swatch" style="background:${palette[Math.min(index, 3)]}"></span>
        <input class="child-name-input" data-cid="${cat.id}" data-chid="${child.id}" value="${escHtml(child.name)}" />
        <input type="range" min="0" max="100" step="1" value="${child.ratio}" class="child-slider" data-cid="${cat.id}" data-chid="${child.id}" style="accent-color:${palette[Math.min(index, 3)]}" />
        <span class="child-pct">${pct}%</span>
        <button class="child-del" data-cid="${cat.id}" data-chid="${child.id}" title="削除">×</button>
      `;
      childArea.appendChild(row);
    });

    const addChildBtn = document.createElement('button');
    addChildBtn.className = 'add-child-btn';
    addChildBtn.dataset.id = cat.id;
    addChildBtn.textContent = '+ 内訳を追加';
    childArea.appendChild(addChildBtn);

    item.appendChild(childArea);
    list.appendChild(item);
  });
}

function bindListEvents() {
  const list = document.getElementById('catList');

  list.querySelectorAll('.cat-slider').forEach(el => {
    el.addEventListener('input', e => {
      const cat = categories.find(item => item.id === Number(e.currentTarget.dataset.id));
      if (!cat) return;
      cat.ratio = Number(e.currentTarget.value);
      refresh();
    });
  });

  list.querySelectorAll('.cat-del').forEach(el => {
    el.addEventListener('click', e => {
      categories = categories.filter(item => item.id !== Number(e.currentTarget.dataset.id));
      modeData[currentMode].categories = categories;
      refresh();
    });
  });

  list.querySelectorAll('.expand-toggle').forEach(el => {
    el.addEventListener('click', e => {
      const cat = categories.find(item => item.id === Number(e.currentTarget.dataset.id));
      if (!cat) return;
      cat.open = !cat.open;
      refresh();
    });
  });

  list.querySelectorAll('.child-slider').forEach(el => {
    el.addEventListener('input', e => {
      const cat = categories.find(item => item.id === Number(e.currentTarget.dataset.cid));
      const child = cat && cat.children.find(item => item.id === Number(e.currentTarget.dataset.chid));
      if (!child) return;
      child.ratio = Number(e.currentTarget.value);
      refresh();
    });
  });

  list.querySelectorAll('.cat-name-input').forEach(el => {
    el.addEventListener('change', e => {
      const cat = categories.find(item => item.id === Number(e.currentTarget.dataset.id));
      if (!cat) return;
      cat.name = e.currentTarget.value;
      refresh();
    });
  });

  list.querySelectorAll('.child-name-input').forEach(el => {
    el.addEventListener('change', e => {
      const cat = categories.find(item => item.id === Number(e.currentTarget.dataset.cid));
      const child = cat && cat.children.find(item => item.id === Number(e.currentTarget.dataset.chid));
      if (!child) return;
      child.name = e.currentTarget.value;
      refresh();
    });
  });

  list.querySelectorAll('.child-del').forEach(el => {
    el.addEventListener('click', e => {
      const cat = categories.find(item => item.id === Number(e.currentTarget.dataset.cid));
      if (!cat) return;
      cat.children = cat.children.filter(item => item.id !== Number(e.currentTarget.dataset.chid));
      refresh();
    });
  });

  list.querySelectorAll('.add-child-btn').forEach(el => {
    el.addEventListener('click', e => {
      const cat = categories.find(item => item.id === Number(e.currentTarget.dataset.id));
      if (!cat) return;
      nextId += 1;
      cat.children.push({ id: nextId, name: '新しい内訳', ratio: 20 });
      cat.open = true;
      refresh();
    });
  });
}

function refresh() {
  renderTotal();
  renderList();
  renderMainChart();
  renderLegend();
  updateCenterTitle();
  bindListEvents();
}

function sortByRatio() {
  categories.sort((a, b) => b.ratio - a.ratio);
  categories.forEach(cat => {
    if (cat.children?.length) cat.children.sort((a, b) => b.ratio - a.ratio);
  });
  refresh();
}

function adjustArrayTo100(arr) {
  if (!arr.length) return;
  const currentTotal = arr.reduce((sum, item) => sum + item.ratio, 0);
  if (currentTotal === 100) return;

  if (currentTotal === 0) {
    const base = Math.floor(100 / arr.length);
    const rem = 100 % arr.length;
    arr.forEach((item, index) => {
      item.ratio = base + (index < rem ? 1 : 0);
    });
    return;
  }

  const factor = 100 / currentTotal;
  let newTotal = 0;
  arr.forEach(item => {
    item.ratio = Math.round(item.ratio * factor);
    newTotal += item.ratio;
  });

  let diff = 100 - newTotal;
  const sorted = [...arr].sort((a, b) => b.ratio - a.ratio);
  let index = 0;
  while (diff !== 0 && sorted.length) {
    const target = sorted[index % sorted.length];
    if (diff > 0) {
      target.ratio += 1;
      diff -= 1;
    } else if (target.ratio > 0) {
      target.ratio -= 1;
      diff += 1;
    }
    index += 1;
    if (index > 1000) break;
  }
}

function autoAdjust() {
  if (!categories.length) return;
  adjustArrayTo100(categories);
  categories.forEach(cat => {
    if (cat.children?.length) adjustArrayTo100(cat.children);
  });
  refresh();
}

function addCategory() {
  const input = document.getElementById('addInput');
  const name = input.value.trim();
  if (!name) return;

  nextId += 1;
  categories.push({
    id: nextId,
    name,
    ratio: 10,
    colorIdx: nextColorIdx(),
    children: [],
    open: false,
  });
  input.value = '';
  refresh();
}

function getSavedData() {
  const data = localStorage.getItem('oshipofo_saved_data');
  return data ? JSON.parse(data) : [];
}

function getAppUrl(source) {
  const url = new URL(APP_BASE_URL);
  if (source) url.searchParams.set('from', source);
  return url.toString();
}

function buildShareText() {
  const title = (document.getElementById('titleInput').value || '推しポフォ').trim();
  const name = document.getElementById('nameInput').value.trim();
  const prefix = name ? `${name}さんの` : '';
  return `${prefix}${title} を作りました\n${getAppUrl('x-share')}\n#${X_HASHTAG}`;
}

function shareToX() {
  window.open(`https://x.com/intent/post?text=${encodeURIComponent(buildShareText())}`, '_blank', 'noopener,noreferrer');
}

function exportImage() {
  const target = document.getElementById('exportTarget');
  const shareUrl = getAppUrl('x-image');
  const originalBg = target.style.backgroundColor;
  target.style.backgroundColor = '#F7F5F0';

  html2canvas(target, {
    scale: 2,
    backgroundColor: '#F7F5F0',
    useCORS: true,
    logging: false,
  }).then(canvas => {
    const finalCanvas = document.createElement('canvas');
    const ctx = finalCanvas.getContext('2d');

    finalCanvas.width = canvas.width;
    finalCanvas.height = canvas.height + 96;

    ctx.fillStyle = '#F7F5F0';
    ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
    ctx.drawImage(canvas, 0, 0);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#AAA8A2';
    ctx.font = '400 24px "DM Mono", monospace';
    ctx.fillText('made with oshipofo', finalCanvas.width / 2, finalCanvas.height - 48);

    ctx.fillStyle = '#6B6760';
    ctx.font = '500 22px "DM Mono", monospace';
    ctx.fillText(shareUrl, finalCanvas.width / 2, finalCanvas.height - 18);

    const title = document.getElementById('titleInput').value || 'portfolio';
    const a = document.createElement('a');
    a.href = finalCanvas.toDataURL('image/png');
    a.download = `${title}.png`;
    a.click();

    target.style.backgroundColor = originalBg;
  }).catch(error => {
    console.error('画像のエクスポートに失敗しました', error);
    target.style.backgroundColor = originalBg;
  });
}

function savePortfolio() {
  modeData[currentMode].title = document.getElementById('titleInput').value;
  modeData[currentMode].categories = categories;

  const currentId = localStorage.getItem('oshipofo_load_id');
  const savedData = getSavedData();
  const saveData = {
    id: currentId || String(Date.now()),
    updatedAt: new Date().toISOString(),
    title: modeData[currentMode].title,
    name: document.getElementById('nameInput').value,
    currentMode,
    modeData: clone(modeData),
  };

  const index = savedData.findIndex(item => item.id === saveData.id);
  if (index >= 0) {
    savedData[index] = saveData;
  } else {
    savedData.push(saveData);
    localStorage.setItem('oshipofo_load_id', saveData.id);
  }

  localStorage.setItem('oshipofo_saved_data', JSON.stringify(savedData));
  alert('ポートフォリオを保存しました。\n「保存済みの一覧を見る」から確認できます。');
}

function clearPortfolio() {
  if (!confirm('現在の内容をリセットして初期状態に戻しますか？\n未保存の内容は失われます。')) return;

  localStorage.removeItem('oshipofo_load_id');
  modeData = {
    genre: { title: 'my推しポフォ', categories: clone(defaultGenreCategories) },
    works: { title: 'my推し作品ポフォ', categories: clone(defaultWorksCategories) },
  };
  currentMode = 'genre';
  categories = modeData[currentMode].categories;
  document.getElementById('titleInput').value = modeData[currentMode].title;
  document.getElementById('nameInput').value = '';
  document.querySelectorAll('.mode-tab').forEach(el => {
    el.classList.toggle('active', el.dataset.mode === currentMode);
  });
  updateUsernameDisplay();
  closeDrill();
  refresh();
}

function loadFromStorage() {
  const loadId = localStorage.getItem('oshipofo_load_id');
  if (!loadId) return;

  const target = getSavedData().find(item => item.id === loadId);
  if (!target) return;

  modeData = target.modeData;
  currentMode = target.currentMode || 'genre';
  categories = modeData[currentMode].categories;
  document.getElementById('titleInput').value = target.title;
  document.getElementById('nameInput').value = target.name || '';
  document.querySelectorAll('.mode-tab').forEach(el => {
    el.classList.toggle('active', el.dataset.mode === currentMode);
  });
  updateUsernameDisplay();
}

function publishFormat() {
  const title = document.getElementById('titleInput').value.trim();
  const author = document.getElementById('nameInput').value.trim() || '匿名';

  if (!title) {
    alert('フォーマットのタイトルを入力してください。');
    return;
  }

  if (!confirm(`「${title}」を公開フォーマットとして公開しますか？\n比率は均等化されて保存されます。`)) return;

  const exportCategories = clone(categories);
  if (exportCategories.length > 0) {
    const parentRatio = Math.floor(100 / exportCategories.length);
    const parentRem = 100 % exportCategories.length;

    exportCategories.forEach((cat, index) => {
      cat.ratio = parentRatio + (index < parentRem ? 1 : 0);
      if (cat.children?.length) {
        const childRatio = Math.floor(100 / cat.children.length);
        const childRem = 100 % cat.children.length;
        cat.children.forEach((child, childIndex) => {
          child.ratio = childRatio + (childIndex < childRem ? 1 : 0);
        });
      }
    });
  }

  const formatData = {
    title,
    author,
    createdAt: new Date().toISOString(),
    categories: exportCategories,
  };

  try {
    firebase.firestore().collection('formats').add(formatData)
      .then(() => {
        alert('フォーマットを公開しました。\n「公開フォーマットを探す」から確認できます。');
      })
      .catch(error => {
        console.error('保存エラー', error);
        alert('公開に失敗しました。');
      });
  } catch (error) {
    console.error('Firebaseエラー', error);
    alert('Firebaseの設定または接続を確認してください。');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadFromStorage();
  refresh();

  document.getElementById('addBtn').addEventListener('click', addCategory);
  document.getElementById('addInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') addCategory();
  });
  document.getElementById('sortBtn').addEventListener('click', sortByRatio);
  document.getElementById('adjustBtn').addEventListener('click', autoAdjust);
  document.getElementById('exportBtn').addEventListener('click', exportImage);
  document.getElementById('shareXBtn').addEventListener('click', shareToX);
  document.getElementById('saveDataBtn').addEventListener('click', savePortfolio);
  document.getElementById('clearBtn').addEventListener('click', clearPortfolio);
  document.getElementById('drillBack').addEventListener('click', closeDrill);
  document.getElementById('titleInput').addEventListener('input', updateCenterTitle);
  document.getElementById('nameInput').addEventListener('input', updateUsernameDisplay);
  document.getElementById('howtoBtn').addEventListener('click', () => openIntroModal(true));
  document.getElementById('introClose').addEventListener('click', closeIntroModal);
  document.getElementById('introSkip').addEventListener('click', closeIntroModal);
  document.getElementById('introPrev').addEventListener('click', prevIntroStep);
  document.getElementById('introNext').addEventListener('click', nextIntroStep);
  document.getElementById('introBackdrop').addEventListener('click', closeIntroModal);
  openIntroModal();

  const shareBtn = document.getElementById('shareFormatBtn');
  if (shareBtn) shareBtn.addEventListener('click', publishFormat);

  document.querySelectorAll('.mode-tab').forEach(btn => {
    btn.addEventListener('click', e => {
      const targetMode = e.currentTarget.dataset.mode;
      if (currentMode === targetMode) return;
      modeData[currentMode].title = document.getElementById('titleInput').value;
      modeData[currentMode].categories = categories;
      currentMode = targetMode;
      categories = modeData[currentMode].categories;
      document.getElementById('titleInput').value = modeData[currentMode].title;
      document.querySelectorAll('.mode-tab').forEach(el => {
        el.classList.toggle('active', el.dataset.mode === currentMode);
      });
      closeDrill();
      refresh();
    });
  });

  const sidebar = document.getElementById('sidebar');
  const openEditor = () => {
    sidebar.classList.add('editing');
    sidebar.scrollTop = 0;
  };
  document.getElementById('editFab').addEventListener('click', openEditor);
  document.getElementById('mobileEditBtn').addEventListener('click', openEditor);
  document.getElementById('sidebarClose').addEventListener('click', () => {
    sidebar.classList.remove('editing');
  });
});



