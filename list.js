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
  const data = getSavedData().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  if (data.length === 0) {
    grid.innerHTML = '<div class="empty-state"><p>保存されているポートフォリオはまだありません。</p></div>';
    return;
  }

  grid.innerHTML = '';

  data.forEach(item => {
    const card = document.createElement('div');
    card.className = 'portfolio-card';

    const safeTitle = String(item.title || '無題のポートフォリオ').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const safeName = String(item.name || '匿名').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    card.innerHTML = `
      <div class="card-title">${safeTitle}</div>
      <div class="card-meta">
        <span>作成者: ${safeName}</span>
        <span>更新日: ${formatDate(item.updatedAt)}</span>
      </div>
      <div class="card-actions">
        <button class="card-btn delete" data-id="${item.id}">削除する</button>
        <button class="card-btn edit" data-id="${item.id}">読み込んで編集</button>
      </div>
    `;

    grid.appendChild(card);
  });

  grid.querySelectorAll('.edit').forEach(btn => {
    btn.addEventListener('click', e => {
      localStorage.setItem('oshipofo_load_id', e.currentTarget.dataset.id);
      window.location.href = 'index.html';
    });
  });

  grid.querySelectorAll('.delete').forEach(btn => {
    btn.addEventListener('click', e => {
      if (!confirm('このポートフォリオを削除しますか？\n保存内容は元に戻せません。')) return;
      const id = e.currentTarget.dataset.id;
      const next = getSavedData().filter(item => item.id !== id);
      saveReorderedData(next);
      if (localStorage.getItem('oshipofo_load_id') === id) {
        localStorage.removeItem('oshipofo_load_id');
      }
      renderList();
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderList();
  document.getElementById('createNewBtn').addEventListener('click', () => {
    localStorage.removeItem('oshipofo_load_id');
  });
});
