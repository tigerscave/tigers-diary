'use strict';

const postBtn = document.getElementById('post-btn');
const approvedBtn = document.getElementById('approverd-btn');
const approvedBoard = document.getElementById('approved-modal')

postBtn.addEventListener('click', () => {
  console.log("postBtn is pushed")
  approvedBoard.classList.toggle('hidden');
});

approvedBtn.addEventListener('click', () => {
  console.log("approvedBtn is pushed")
  approvedBoard.classList.add('hidden');
});
