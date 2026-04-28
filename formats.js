'use strict';

function formatDate(isoString) {
  const d = new Date(isoString);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}/${month}/${day} ${hours}:${minutes}`;
}

let formatsData = {};

function renderFormats(formatsObj) {
  const grid = document.getElementById('cardGrid');

  if (!formatsObj) {
    grid.innerHTML = '<div class="empty-state"><p>公開されているフォーマットがありません。</p></div>';
    return;
  }

  const data = Object.keys(formatsObj).map(key => ({ formatId: key, ...formatsObj[key] })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (data.length === 0) {
    grid.innerHTML = '<div class="empty-state"><p>公開されているフォーマットがありません。</p></div>';
    return;
  }

  grid.innerHTML = '';
  formatsData = formatsObj;

  data.forEach(item => {
    const card = document.createElement('div');
    card.className = 'portfolio-card';

    const safeTitle = String(item.title || '無題のフォーマット').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const safeName = String(item.author || '匿名').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const dateStr = item.createdAt ? formatDate(item.createdAt) : '不明';

    card.innerHTML = `
      <div class="card-title">${safeTitle}</div>
      <div class="card-meta">
        <span>作成者: ${safeName}</span>
        <span>公開日: ${dateStr}</span>
      </div>
      <div class="card-actions">
        <button class="card-btn use" data-id="${item.formatId}">このフォーマットを使う</button>
      </div>
    `;

    grid.appendChild(card);
  });

  grid.querySelectorAll('.use').forEach(btn => {
    btn.addEventListener('click', e => {
      useFormat(e.currentTarget.dataset.id);
    });
  });
}

function defaultWorksCategories() {
  return [
    { id: 101, name: 'クレヨンしんちゃん', ratio: 30, colorIdx: 1, children: [], open: false },
    { id: 102, name: 'ちいかわ', ratio: 25, colorIdx: 3, children: [], open: false },
    { id: 103, name: 'ドラえもん', ratio: 20, colorIdx: 0, children: [], open: false },
    { id: 104, name: '名探偵コナン', ratio: 15, colorIdx: 5, children: [], open: false },
    { id: 105, name: 'クッキングパパ', ratio: 10, colorIdx: 4, children: [], open: false },
  ];
}

function useFormat(formatId) {
  const format = formatsData[formatId];
  if (!format) return;

  if (!confirm(`「${format.title}」のフォーマットを使って新しくポートフォリオを作成しますか？\n現在ブラウザ上で未保存の内容は失われる場合があります。`)) return;

  const currentSavedDataStr = localStorage.getItem('oshipofo_saved_data');
  const savedData = currentSavedDataStr ? JSON.parse(currentSavedDataStr) : [];
  const newId = 'format_' + Date.now();

  savedData.push({
    id: newId,
    updatedAt: new Date().toISOString(),
    title: format.title,
    name: '',
    currentMode: 'genre',
    modeData: {
      genre: { title: format.title, categories: format.categories || [] },
      works: { title: 'my推し作品ポフォ', categories: defaultWorksCategories() }
    }
  });

  localStorage.setItem('oshipofo_saved_data', JSON.stringify(savedData));
  localStorage.setItem('oshipofo_load_id', newId);
  window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', () => {
  try {
    firebase.firestore().collection('formats').orderBy('createdAt', 'desc').get()
      .then(snapshot => {
        const formatsObj = {};
        snapshot.forEach(doc => {
          formatsObj[doc.id] = doc.data();
        });
        renderFormats(formatsObj);
      })
      .catch(error => {
        console.error('Firebaseデータの取得に失敗しました', error);
        document.getElementById('cardGrid').innerHTML = '<div class="empty-state"><p>データの読み込みに失敗しました。</p></div>';
      });
  } catch (error) {
    console.error('Firebaseの初期化に失敗しました', error);
    document.getElementById('cardGrid').innerHTML = '<div class="empty-state"><p>Firebaseの設定を確認してください。</p></div>';
  }
});
