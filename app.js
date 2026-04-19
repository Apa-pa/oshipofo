'use strict';

// DataLabels プラグインの登録
Chart.register(ChartDataLabels);

// ── Palette ──────────────────────────────────────────────────────────────────
// Each entry: [base, shade1, shade2, shade3]
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

// ── State ─────────────────────────────────────────────────────────────────────
let nextId = 200;

const defaultGenreCategories = [
  {
    id: 2, name: 'アニメ・マンガ・ノベル', ratio: 45, colorIdx: 1,
    children: [
      { id: 21, name: 'クレヨンしんちゃん', ratio: 40 },
      { id: 22, name: '名探偵コナン', ratio: 35 },
      { id: 23, name: 'ドラえもん', ratio: 25 },
    ], open: false
  },
  {
    id: 3, name: 'アーティスト・タレント', ratio: 20, colorIdx: 2, children: [
      { id: 31, name: 'SMAP', ratio: 50 },
      { id: 32, name: '乃木坂46', ratio: 50 },

    ], open: false
  },
  {
    id: 4, name: 'スポーツ・競技', ratio: 25, colorIdx: 3, children: [
      { id: 41, name: 'プロ野球', ratio: 50 },
      { id: 42, name: 'Mリーグ', ratio: 50 }
    ], open: false
  },
  {
    id: 1, name: 'ゲーム', ratio: 10, colorIdx: 0,
    children: [
      { id: 11, name: 'ポケモン', ratio: 50 },
      { id: 12, name: 'ぷよぷよ', ratio: 30 },
      { id: 13, name: 'FF', ratio: 20 },
    ], open: false
  },
];

const defaultWorksCategories = [
  { id: 101, name: 'クレヨンしんちゃん', ratio: 30, colorIdx: 1, children: [], open: false },
  { id: 102, name: 'ちびまる子ちゃん', ratio: 25, colorIdx: 3, children: [], open: false },
  { id: 103, name: 'ドラえもん', ratio: 20, colorIdx: 0, children: [], open: false },
  { id: 104, name: '名探偵コナン', ratio: 15, colorIdx: 5, children: [], open: false },
  { id: 105, name: 'クッキングパパ', ratio: 10, colorIdx: 4, children: [], open: false },
];

let modeData = {
  genre: {
    title: 'my推しポートフォリオ',
    categories: JSON.parse(JSON.stringify(defaultGenreCategories))
  },
  works: {
    title: 'my推し作品ポートフォリオ',
    categories: JSON.parse(JSON.stringify(defaultWorksCategories))
  }
};

let currentMode = 'genre';
let categories = modeData[currentMode].categories;

let mainChartInstance = null;
let drillChartInstance = null;

// ── Helpers ───────────────────────────────────────────────────────────────────
function getTotal() {
  return categories.reduce((s, c) => s + c.ratio, 0);
}

function nextColorIdx() {
  const used = new Set(categories.map(c => c.colorIdx));
  for (let i = 0; i < PALETTE.length; i++) {
    if (!used.has(i)) return i;
  }
  return Math.floor(Math.random() * PALETTE.length);
}

// ── Chart data builder ────────────────────────────────────────────────────────
function buildMainData() {
  const labels = [], data = [], colors = [], catIds = [];
  categories.forEach(cat => {
    const pal = PALETTE[cat.colorIdx % PALETTE.length];
    if (cat.children.length === 0) {
      labels.push(cat.name);
      data.push(cat.ratio);
      colors.push(pal[0]);
      catIds.push(cat.id);
    } else {
      const childTotal = cat.children.reduce((s, ch) => s + ch.ratio, 0) || 1;
      cat.children.forEach((ch, i) => {
        labels.push(cat.name + ' / ' + ch.name);
        data.push(cat.ratio * ch.ratio / childTotal);
        colors.push(pal[Math.min(i, 3)]);
        catIds.push(cat.id);
      });
    }
  });
  return { labels, data, colors, catIds };
}

// ── Render main chart ─────────────────────────────────────────────────────────
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
        // セグメントラベル（5%以下は省略してホバー時のみ表示）
        datalabels: {
          color: '#FFFFFF',
          font: { size: 11, weight: '700', family: '"DM Sans", sans-serif' },
          textAlign: 'center',
          display: (ctx) => {
            const total = ctx.dataset.data.reduce((a, b) => a + b, 0) || 1;
            return ctx.dataset.data[ctx.dataIndex] / total > 0.05;
          },
          formatter: (_, ctx) => {
            const lbl = ctx.chart.data.labels[ctx.dataIndex];
            // 「カテゴリ / 詳細」形式なら詳細部分のみ表示
            const parts = lbl.split(' / ');
            return parts.length > 1 ? parts[1] : parts[0];
          },
        },
        tooltip: {
          callbacks: {
            label: ctx => {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0) || 1;
              return '  ' + ctx.label + ': ' + Math.round(ctx.raw / total * 100) + '%';
            }
          }
        }
      },
      onClick: (e, els) => {
        if (!els.length) return;
        const idx = els[0].index;
        const catId = catIds[idx];
        const cat = categories.find(c => c.id === catId);
        if (cat && cat.children.length > 0) openDrill(cat.id);
      }
    }
  });
}

// ── Drill down ────────────────────────────────────────────────────────────────
function openDrill(catId) {
  const cat = categories.find(c => c.id === catId);
  if (!cat || !cat.children.length) return;
  const pal = PALETTE[cat.colorIdx % PALETTE.length];
  const panel = document.getElementById('drillPanel');
  document.getElementById('drillLabel').textContent = cat.name + ' の内訳';
  document.getElementById('drillCenterTitle').textContent = cat.name;
  panel.classList.add('open');

  const canvas = document.getElementById('drillChart');
  if (drillChartInstance) drillChartInstance.destroy();

  drillChartInstance = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: cat.children.map(ch => ch.name),
      datasets: [{
        data: cat.children.map(ch => ch.ratio),
        backgroundColor: cat.children.map((_, i) => pal[Math.min(i, 3)]),
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
        // ドリルダウンチャートのセグメントラベル（5%以下は省略してホバー時のみ表示）
        datalabels: {
          color: '#FFFFFF',
          font: { size: 11, weight: '700', family: '"DM Sans", sans-serif' },
          textAlign: 'center',
          display: (ctx) => {
            const total = ctx.dataset.data.reduce((a, b) => a + b, 0) || 1;
            return ctx.dataset.data[ctx.dataIndex] / total > 0.05;
          },
          formatter: (_, ctx) => ctx.chart.data.labels[ctx.dataIndex],
        },
        tooltip: {
          callbacks: {
            label: ctx => {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0) || 1;
              return '  ' + ctx.label + ': ' + Math.round(ctx.raw / total * 100) + '%';
            }
          }
        }
      }
    }
  });
}

function closeDrill() {
  document.getElementById('drillPanel').classList.remove('open');
  if (drillChartInstance) { drillChartInstance.destroy(); drillChartInstance = null; }
}

// ── Legend ────────────────────────────────────────────────────────────────────
function renderLegend() {
  const list = document.getElementById('legendList');
  list.innerHTML = '';
  const { labels, data, colors } = buildMainData();
  const total = data.reduce((a, b) => a + b, 0) || 1;
  labels.forEach((lbl, i) => {
    const pct = Math.round(data[i] / total * 100);
    const item = document.createElement('div');
    item.className = 'legend-item';
    item.innerHTML = `
      <span class="legend-swatch" style="background:${colors[i]}"></span>
      <span>${lbl}</span>
      <span class="legend-pct">${pct}%</span>
    `;
    list.appendChild(item);
  });
}

// ── Sidebar list ──────────────────────────────────────────────────────────────
function renderList() {
  const list = document.getElementById('catList');
  list.innerHTML = '';

  categories.forEach(cat => {
    const pal = PALETTE[cat.colorIdx % PALETTE.length];
    const childTotal = cat.children.reduce((s, ch) => s + ch.ratio, 0) || 1;

    const item = document.createElement('div');
    item.className = 'cat-item';
    item.dataset.id = cat.id;

    // Header
    const header = document.createElement('div');
    header.className = 'cat-header';
    header.innerHTML = `
      <span class="cat-swatch" style="background:${pal[0]}"></span>
      <input class="cat-name-input" data-id="${cat.id}" value="${escHtml(cat.name)}" />
      <span class="cat-pct">${cat.ratio}%</span>
      <button class="cat-del" data-id="${cat.id}" title="削除">×</button>
    `;
    item.appendChild(header);

    // Slider
    const sliderRow = document.createElement('div');
    sliderRow.className = 'slider-row';
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = 0; slider.max = 100; slider.step = 1;
    slider.value = cat.ratio;
    slider.style.accentColor = pal[0];
    slider.dataset.id = cat.id;
    slider.className = 'cat-slider';
    sliderRow.appendChild(slider);
    item.appendChild(sliderRow);

    // Expand toggle
    const toggle = document.createElement('button');
    toggle.className = 'expand-toggle' + (cat.open ? ' open' : '');
    toggle.dataset.id = cat.id;
    toggle.innerHTML = `
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d="M3 2l4 3-4 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      詳細 (${cat.children.length}件)
    `;
    item.appendChild(toggle);

    // Children area
    const childArea = document.createElement('div');
    childArea.className = 'child-area' + (cat.open ? ' open' : '');
    childArea.id = 'children-' + cat.id;

    cat.children.forEach((ch, i) => {
      const chPct = Math.round(ch.ratio / childTotal * 100);
      const row = document.createElement('div');
      row.className = 'child-row';
      row.innerHTML = `
        <span class="child-swatch" style="background:${pal[Math.min(i, 3)]}"></span>
        <input class="child-name-input" data-cid="${cat.id}" data-chid="${ch.id}" value="${escHtml(ch.name)}" />
        <input type="range" min="0" max="100" step="1" value="${ch.ratio}"
          class="child-slider" data-cid="${cat.id}" data-chid="${ch.id}"
          style="accent-color:${pal[Math.min(i, 3)]}" />
        <span class="child-pct">${chPct}%</span>
        <button class="child-del" data-cid="${cat.id}" data-chid="${ch.id}" title="削除">×</button>
      `;
      childArea.appendChild(row);
    });

    const addChildBtn = document.createElement('button');
    addChildBtn.className = 'add-child-btn';
    addChildBtn.dataset.id = cat.id;
    addChildBtn.textContent = '+ 詳細を追加';
    childArea.appendChild(addChildBtn);
    item.appendChild(childArea);

    list.appendChild(item);
  });
}

// ── Total bar ─────────────────────────────────────────────────────────────────
function renderTotal() {
  const total = getTotal();
  const fill = document.getElementById('totalFill');
  const num = document.getElementById('totalNum');
  const warn = document.getElementById('totalWarn');
  const pct = Math.min(total, 100);
  fill.style.width = pct + '%';
  fill.classList.toggle('over', total > 100);
  num.textContent = total + '%';
  warn.textContent = total !== 100 ? '合計が100%になるよう調整してください' : '';
}

// ── Full refresh ──────────────────────────────────────────────────────────────
function refresh() {
  renderTotal();
  renderList();
  renderMainChart();
  renderLegend();
  updateCenterTitle();
  bindListEvents();
}

function updateCenterTitle() {
  document.getElementById('centerTitle').textContent =
    document.getElementById('titleInput').value || '推しポートフォリオ';
}

// ユーザー名表示を更新
function updateUsernameDisplay() {
  const name = document.getElementById('nameInput').value.trim();
  const el = document.getElementById('usernameDisplay');
  if (name) {
    el.textContent = name + 'さんの推しポフォ ✨';
    el.classList.add('visible');
  } else {
    el.textContent = '';
    el.classList.remove('visible');
  }
}

// ── Event binding (delegated) ─────────────────────────────────────────────────
function bindListEvents() {
  const list = document.getElementById('catList');

  // Cat slider
  list.querySelectorAll('.cat-slider').forEach(el => {
    el.addEventListener('input', e => {
      const cat = categories.find(c => c.id === +e.target.dataset.id);
      if (cat) { cat.ratio = +e.target.value; refresh(); }
    });
  });

  // Cat delete
  list.querySelectorAll('.cat-del').forEach(el => {
    el.addEventListener('click', e => {
      categories = categories.filter(c => c.id !== +e.target.dataset.id);
      refresh();
    });
  });

  // Expand toggle
  list.querySelectorAll('.expand-toggle').forEach(el => {
    el.addEventListener('click', e => {
      const cat = categories.find(c => c.id === +e.currentTarget.dataset.id);
      if (cat) { cat.open = !cat.open; refresh(); }
    });
  });

  // Child slider
  list.querySelectorAll('.child-slider').forEach(el => {
    el.addEventListener('input', e => {
      const cat = categories.find(c => c.id === +e.target.dataset.cid);
      const ch = cat && cat.children.find(x => x.id === +e.target.dataset.chid);
      if (ch) { ch.ratio = +e.target.value; refresh(); }
    });
  });

  // Cat name
  list.querySelectorAll('.cat-name-input').forEach(el => {
    el.addEventListener('change', e => {
      const cat = categories.find(c => c.id === +e.target.dataset.id);
      if (cat) { cat.name = e.target.value; refresh(); }
    });
  });

  // Child name
  list.querySelectorAll('.child-name-input').forEach(el => {
    el.addEventListener('change', e => {
      const cat = categories.find(c => c.id === +e.target.dataset.cid);
      const ch = cat && cat.children.find(x => x.id === +e.target.dataset.chid);
      if (ch) { ch.name = e.target.value; refresh(); }
    });
  });

  // Child delete
  list.querySelectorAll('.child-del').forEach(el => {
    el.addEventListener('click', e => {
      const cat = categories.find(c => c.id === +e.target.dataset.cid);
      if (cat) {
        cat.children = cat.children.filter(x => x.id !== +e.target.dataset.chid);
        refresh();
      }
    });
  });

  // Add child
  list.querySelectorAll('.add-child-btn').forEach(el => {
    el.addEventListener('click', e => {
      const cat = categories.find(c => c.id === +e.target.dataset.id);
      if (cat) {
        cat.children.push({ id: nextId++, name: '新しい項目', ratio: 20 });
        cat.open = true;
        refresh();
      }
    });
  });
}

// ── Sort by ratio ─────────────────────────────────────────────────────────────
// カテゴリと子カテゴリを割合の大きい順に並べ替える
function sortByRatio() {
  // 親カテゴリを降順にソート
  categories.sort((a, b) => b.ratio - a.ratio);
  // 各カテゴリの子も降順にソート
  categories.forEach(cat => {
    if (cat.children && cat.children.length > 0) {
      cat.children.sort((a, b) => b.ratio - a.ratio);
    }
  });
  refresh();
}

// ── Auto adjust to 100% ──────────────────────────────────────────────────────
function autoAdjust() {
  if (categories.length === 0) return;

  // 1. 親カテゴリの調整
  adjustArrayTo100(categories);

  // 2. 各カテゴリの子カテゴリ（内訳）の調整
  categories.forEach(cat => {
    if (cat.children && cat.children.length > 0) {
      adjustArrayTo100(cat.children);
    }
  });

  refresh();
}

/**
 * 配列内の各要素の ratio の合計が 100 になるように調整する
 * @param {Array} arr {ratio: number} を持つオブジェクトの配列
 */
function adjustArrayTo100(arr) {
  if (!arr || arr.length === 0) return;

  const currentTotal = arr.reduce((s, item) => s + item.ratio, 0);
  if (currentTotal === 100) return;

  if (currentTotal === 0) {
    // 全て0の場合は均等に割り振る
    const base = Math.floor(100 / arr.length);
    const rem = 100 % arr.length;
    arr.forEach((item, i) => {
      item.ratio = base + (i < rem ? 1 : 0);
    });
    return;
  }

  // 倍率で調整を試みる
  const factor = 100 / currentTotal;
  let newTotal = 0;
  
  arr.forEach(item => {
    item.ratio = Math.round(item.ratio * factor);
    newTotal += item.ratio;
  });

  // 端数調整（誤差を埋める）
  let diff = 100 - newTotal;
  if (diff !== 0) {
    // 差分がある場合、値が大きい順（減らす場合）または小さい順（増やす場合）に調整したいが、
    // ここではシンプルにインデックス順または比率の大きい順に1ずつ加減する
    const sorted = [...arr].sort((a, b) => b.ratio - a.ratio);
    for (let i = 0; i < Math.abs(diff); i++) {
      const target = sorted[i % sorted.length];
      if (diff > 0) {
        target.ratio++;
      } else {
        if (target.ratio > 0) {
          target.ratio--;
        } else {
          // 0以下の場合はスキップして次を探す
          let found = false;
          for(let j = 0; j < sorted.length; j++) {
            if(sorted[j].ratio > 0) {
              sorted[j].ratio--;
              found = true;
              break;
            }
          }
          if(!found) break; // 全て0ならどうしようもない
        }
      }
    }
  }
}

// ── Add category ──────────────────────────────────────────────────────────────
function addCategory() {
  const input = document.getElementById('addInput');
  const name = input.value.trim();
  if (!name) return;
  categories.push({
    id: nextId++,
    name,
    ratio: 10,
    colorIdx: nextColorIdx(),
    children: [],
    open: false,
  });
  input.value = '';
  refresh();
}

// ── Export ────────────────────────────────────────────────────────────────────
function exportImage() {
  const target = document.getElementById('exportTarget');

  // 保存中は一時的にスタイルを変更して画像を生成しやすくする
  const originalBg = target.style.backgroundColor;
  target.style.backgroundColor = '#F7F5F0'; // 保存用に背景色を確実に設定

  html2canvas(target, {
    scale: 2, // 高画質化（Retinaディスプレイ等への対応）
    backgroundColor: '#F7F5F0',
    useCORS: true, // Chart.jsのCanvasを正しくコピーするため
    logging: false
  }).then(canvas => {
    // ウォーターマークを追加用に新しいCanvasを作成
    const finalCanvas = document.createElement('canvas');
    const ctx = finalCanvas.getContext('2d');

    // サイズをhtml2canvasの出力に合わせる
    finalCanvas.width = canvas.width;
    // ウォーターマーク用の余白を下部に追加
    finalCanvas.height = canvas.height + 60;

    // 背景を塗りつぶし
    ctx.fillStyle = '#F7F5F0';
    ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

    // html2canvasで生成した画像を描画
    ctx.drawImage(canvas, 0, 0);

    // ウォーターマークを描画
    ctx.font = '400 24px "DM Mono", monospace';
    ctx.fillStyle = '#AAA8A2';
    ctx.textAlign = 'center';
    ctx.fillText('my推しポートフォリオ（推しポフォ）', finalCanvas.width / 2, finalCanvas.height - 20);

    // ダウンロード処理
    const title = document.getElementById('titleInput').value || 'portfolio';
    const a = document.createElement('a');
    a.href = finalCanvas.toDataURL('image/png');
    a.download = title + '.png';
    a.click();

    // スタイルを元に戻す
    target.style.backgroundColor = originalBg;
  }).catch(err => {
    console.error('画像のエクスポートに失敗しました', err);
    target.style.backgroundColor = originalBg;
  });
}

// ── Utility ───────────────────────────────────────────────────────────────────
function escHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Local Storage Data Management ──────────────────────────────────────────
function getSavedData() {
  const data = localStorage.getItem('oshipofo_saved_data');
  return data ? JSON.parse(data) : [];
}

function savePortfolio() {
  // 現在の入力値を modeData に同期
  modeData[currentMode].title = document.getElementById('titleInput').value;
  modeData[currentMode].categories = categories;

  const currentId = localStorage.getItem('oshipofo_load_id');
  let savedData = getSavedData();
  const nameVal = document.getElementById('nameInput').value;

  const saveData = {
    id: currentId ? currentId : String(Date.now()),
    updatedAt: new Date().toISOString(),
    title: modeData[currentMode].title,
    name: nameVal,
    currentMode: currentMode,
    modeData: JSON.parse(JSON.stringify(modeData)) // ディープコピー
  };

  if (currentId) {
    const idx = savedData.findIndex(d => d.id === currentId);
    if (idx !== -1) {
      savedData[idx] = saveData;
    } else {
      savedData.push(saveData);
    }
  } else {
    savedData.push(saveData);
    localStorage.setItem('oshipofo_load_id', saveData.id);
  }

  localStorage.setItem('oshipofo_saved_data', JSON.stringify(savedData));
  alert('ポートフォリオを保存しました！\n「保存済みの一覧を見る」から確認できます。');
}

function clearPortfolio() {
  if (!confirm('今の状態をリセットして最初から作りますか？\n（保存していないデータは消去されます）')) return;

  localStorage.removeItem('oshipofo_load_id');
  
  // 初期状態にリセット
  modeData = {
    genre: {
      title: 'my推しポートフォリオ',
      categories: JSON.parse(JSON.stringify(defaultGenreCategories))
    },
    works: {
      title: 'my推し作品ポートフォリオ',
      categories: JSON.parse(JSON.stringify(defaultWorksCategories))
    }
  };
  
  currentMode = 'genre';
  categories = modeData[currentMode].categories;
  
  document.getElementById('titleInput').value = modeData[currentMode].title;
  document.getElementById('nameInput').value = '';
  
  document.querySelectorAll('.mode-tab').forEach(el => {
    el.classList.toggle('active', el.dataset.mode === currentMode);
  });

  updateUsernameDisplay();
  refresh();
}

function loadFromStorage() {
  const loadId = localStorage.getItem('oshipofo_load_id');
  if (!loadId) return;

  const savedData = getSavedData();
  const target = savedData.find(d => d.id === loadId);
  if (target) {
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
}

// ── Publish Format ────────────────────────────────────────────────────────────
function publishFormat() {
  const title = document.getElementById('titleInput').value.trim();
  const author = document.getElementById('nameInput').value.trim() || '名無し';

  if (!title) {
    alert('フォーマットのタイトルを入力してください。');
    return;
  }

  if (!confirm(`「${title}」のフォーマットを公開しますか？\n※割合は均等にリセットされて公開されます。`)) return;

  // ディープコピーして比率を均等にリセット
  const exportCategories = JSON.parse(JSON.stringify(categories));
  
  if (exportCategories.length > 0) {
    const parentRatio = Math.floor(100 / exportCategories.length);
    const parentRem = 100 % exportCategories.length;
    
    exportCategories.forEach((cat, index) => {
      cat.ratio = parentRatio + (index < parentRem ? 1 : 0);
      
      if (cat.children && cat.children.length > 0) {
        const childRatio = Math.floor(100 / cat.children.length);
        const childRem = 100 % cat.children.length;
        cat.children.forEach((ch, cIndex) => {
          ch.ratio = childRatio + (cIndex < childRem ? 1 : 0);
        });
      }
    });
  }

  const formatData = {
    title: title,
    author: author,
    createdAt: new Date().toISOString(),
    categories: exportCategories
  };

  try {
    firebase.firestore().collection('formats').add(formatData)
      .then(() => {
        alert('フォーマットを公開しました！\n「公開フォーマットを探す」から確認できます。');
      })
      .catch((error) => {
        console.error('保存エラー:', error);
        alert('公開に失敗しました。');
      });
  } catch (err) {
    console.error('Firebaseエラー:', err);
    alert('Firebaseの設定または通信に問題があります。');
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────
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
  document.getElementById('saveDataBtn').addEventListener('click', savePortfolio);
  document.getElementById('clearBtn').addEventListener('click', clearPortfolio);
  const shareBtn = document.getElementById('shareFormatBtn');
  if(shareBtn) shareBtn.addEventListener('click', publishFormat);
  
  document.getElementById('drillBack').addEventListener('click', closeDrill);
  document.getElementById('titleInput').addEventListener('input', () => {
    updateCenterTitle();
  });

  // ── ユーザー名入力 ───────────────────────────────────────────────
  document.getElementById('nameInput').addEventListener('input', () => {
    updateUsernameDisplay();
  });

  // ── モード切替タブ ───────────────────────────────────────────────
  document.querySelectorAll('.mode-tab').forEach(btn => {
    btn.addEventListener('click', e => {
      const targetMode = e.currentTarget.dataset.mode;
      if (currentMode === targetMode) return;

      // 現在の状態を保存
      modeData[currentMode].title = document.getElementById('titleInput').value;
      modeData[currentMode].categories = categories;

      // モード切り替え
      currentMode = targetMode;
      categories = modeData[currentMode].categories;
      document.getElementById('titleInput').value = modeData[currentMode].title;

      // UI更新
      document.querySelectorAll('.mode-tab').forEach(el => {
        el.classList.toggle('active', el.dataset.mode === currentMode);
      });

      refresh();
    });
  });

  // ── モバイル：編集ドロワーの開閉 ──────────────────────────────────────────
  const sidebar = document.getElementById('sidebar');

  document.getElementById('editFab').addEventListener('click', () => {
    sidebar.classList.add('editing');
    // ドロワー開いたときスクロールを先頭に戻す
    sidebar.scrollTop = 0;
  });

  document.getElementById('sidebarClose').addEventListener('click', () => {
    sidebar.classList.remove('editing');
  });
});
