'use strict';

function getSavedData() {
  const data = localStorage.getItem('oshipofo_saved_data');
  return data ? JSON.parse(data) : [];
}

function saveReorderedData(data) {
  localStorage.setItem('oshipofo_saved_data', JSON.stringify(data));
}

function formatDate(isoString) {
  const d = new Date(isoString);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}/${month}/${day} ${hours}:${minutes}`;
}

function renderList() {
  const grid = document.getElementById('cardGrid');
  const data = getSavedData();

  // 降順ソート（新しい順）
  data.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  if (data.length === 0) {
    grid.innerHTML = `<div class="empty-state">
      <p>保存されたポートフォリオがありません。</p>
    </div>`;
    return;
  }

  grid.innerHTML = '';

  data.forEach(item => {
    const card = document.createElement('div');
    card.className = 'portfolio-card';

    const safeTitle = String(item.title || '無題のポートフォリオ').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const safeName = String(item.name || '名無し').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    card.innerHTML = `
      <div class="card-title">${safeTitle}</div>
      <div class="card-meta">
        <span>作者: ${safeName}</span>
        <span>更新: ${formatDate(item.updatedAt)}</span>
      </div>
      <div class="card-actions">
        <button class="card-btn delete" data-id="${item.id}">削除する</button>
        <button class="card-btn edit" data-id="${item.id}">呼び出して編集</button>
      </div>
    `;

    grid.appendChild(card);
  });

  // イベント登録
  grid.querySelectorAll('.edit').forEach(btn => {
    btn.addEventListener('click', e => {
      const id = e.target.dataset.id;
      localStorage.setItem('oshipofo_load_id', id);
      window.location.href = 'index.html';
    });
  });

  grid.querySelectorAll('.delete').forEach(btn => {
    btn.addEventListener('click', e => {
      if (!confirm('このポートフォリオを削除しますか？\n（この操作は元に戻せません）')) return;
      const id = e.target.dataset.id;
      let currentData = getSavedData();
      currentData = currentData.filter(d => d.id !== id);
      saveReorderedData(currentData);
      
      // index.html側でこのIDを表示中ならクリアしておく
      if (localStorage.getItem('oshipofo_load_id') === id) {
        localStorage.removeItem('oshipofo_load_id');
      }

      renderList();
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderList();

  // 「新しく作る」ボタンの処理：遷移前に load_id をクリアする
  document.getElementById('createNewBtn').addEventListener('click', (e) => {
    // aタグのデフォルト処理を活かして遷移させるが、その前にローカルストレージをクリア
    localStorage.removeItem('oshipofo_load_id');
  });
});
