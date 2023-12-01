'use strict';

const postBtn = document.getElementById('post-btn');
const confirmBtn = document.getElementById('confirm-btn');
const confirmModal = document.getElementById('confirm-modal')

postBtn.addEventListener('click', () => {
  confirmModal.classList.add('hidden');
});

confirmBtn.addEventListener('click', () => {
  confirmModal.classList.add('hidden');
});
