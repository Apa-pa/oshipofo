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
    grid.innerHTML = `<div class="empty-state">
      <p>公開されているフォーマットがありません。</p>
    </div>`;
    return;
  }

  // formatsObjを配列に変換してソート（新しい順）
  const data = Object.keys(formatsObj).map(key => ({
    formatId: key,
    ...formatsObj[key]
  })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (data.length === 0) {
    grid.innerHTML = `<div class="empty-state">
      <p>公開されているフォーマットがありません。</p>
    </div>`;
    return;
  }

  grid.innerHTML = '';
  formatsData = formatsObj;

  data.forEach(item => {
    const card = document.createElement('div');
    card.className = 'portfolio-card';

    const safeTitle = String(item.title || '無題のフォーマット').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const safeName = String(item.author || '名無し').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const dateStr = item.createdAt ? formatDate(item.createdAt) : '不明';

    card.innerHTML = `
      <div class="card-title">${safeTitle}</div>
      <div class="card-meta">
        <span>作成者: ${safeName}</span>
        <span>公開日時: ${dateStr}</span>
      </div>
      <div class="card-actions">
        <button class="card-btn use" data-id="${item.formatId}">このフォーマットを使う</button>
      </div>
    `;

    grid.appendChild(card);
  });

  // イベント登録
  grid.querySelectorAll('.use').forEach(btn => {
    btn.addEventListener('click', e => {
      const formatId = e.target.dataset.id;
      useFormat(formatId);
    });
  });
}

function useFormat(formatId) {
  const format = formatsData[formatId];
  if(!format) return;
  
  if(!confirm(`「${format.title}」のフォーマットを使って新しくポートフォリオを作成しますか？\n（現在ブラウザ上で未保存のデータは失われます）`)) return;

  // ローカルストレージに新しいデータとして保存して index.html へ遷移
  const currentSavedDataStr = localStorage.getItem('oshipofo_saved_data');
  let savedData = currentSavedDataStr ? JSON.parse(currentSavedDataStr) : [];
  
  const newId = 'format_' + Date.now();
  
  // モードデータ構成を模倣。現在のアプリで「genre」モードのcategoriesを上書きする
  const defaultWorksCategories = [
    { id: 101, name: 'クレヨンしんちゃん', ratio: 30, colorIdx: 1, children: [], open: false },
    { id: 102, name: 'ちびまる子ちゃん', ratio: 25, colorIdx: 3, children: [], open: false },
    { id: 103, name: 'ドラえもん', ratio: 20, colorIdx: 0, children: [], open: false },
    { id: 104, name: '名探偵コナン', ratio: 15, colorIdx: 5, children: [], open: false },
    { id: 105, name: 'クッキングパパ', ratio: 10, colorIdx: 4, children: [], open: false },
  ];

  const newModeData = {
    genre: {
      title: format.title,
      categories: format.categories
    },
    works: {
      title: 'my推し作品ポートフォリオ',
      categories: defaultWorksCategories
    }
  };

  const newData = {
    id: newId,
    updatedAt: new Date().toISOString(),
    title: format.title,
    name: '', // 作成者名はクリアして自分の名前を入れられるようにする
    currentMode: 'genre',
    modeData: newModeData
  };

  savedData.push(newData);
  localStorage.setItem('oshipofo_saved_data', JSON.stringify(savedData));
  localStorage.setItem('oshipofo_load_id', newId);
  
  window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', () => {
  try {
    const dbRef = firebase.firestore().collection('formats').orderBy('createdAt', 'desc');
    dbRef.get()
      .then((snapshot) => {
        const formatsObj = {};
        snapshot.forEach((doc) => {
          formatsObj[doc.id] = doc.data();
        });
        renderFormats(formatsObj);
      })
      .catch((error) => {
        console.error('Firebaseデータの取得に失敗:', error);
        document.getElementById('cardGrid').innerHTML = `<div class="empty-state">
          <p>データの読み込みに失敗しました。</p>
        </div>`;
      });
  } catch(e) {
    console.error('Firebase初期化エラー:', e);
    document.getElementById('cardGrid').innerHTML = `<div class="empty-state">
      <p>Firebaseが正しく設定されていない可能性があります。</p>
    </div>`;
  }
});
