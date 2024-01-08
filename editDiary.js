'use strict';

// /**
//  ******************************************************日記を編集する関数**************************************************************
//  */
async function editDiary(index, editContent) {

  //NGワードのチェック
  const ngWords = ['クソ', 'くそ', 'kuso', 'kasu', '無理', 'かす', 'むり', 'できない', 'うんち', 'fuck', '失敗', 'ごみ', 'ゴミ', 'つかえない', '使えない', 'だめ', 'ダメ', '没', 'ボツ'];
  if (ngWords.some(word => editContent.includes(word))) {
    alert('You did good job. Could you please express your thoughts using positive words? Thank you.');
    console.log('NGワードが含まれているため、投稿できません。');
    return;
  }

  let response;
  try {
    // Googleスプレッドシートの行を編集する。C列の内容のみ、更新
    response = await gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: '1B4hwoTq-6DYXZMg163A-hFLWEJZyZBEqoNg9VVRP7rI',
      range: `master!C${index + 2}`,
      valueInputOption: 'RAW',
      resource: {
        values: [[editContent]]
      }
    });
    const result = response.result;
    console.log(result)
    console.log(`${result.updatedCells} cells updated.`);
  } catch (err) {
    console.error('failed to "update" the data...', err.message);
    return;
  }
  await sortByNewDate(); // sortByNewDate を呼び出して再描画
  console.log('sortByNewDate が呼び出されました。');
}

const modal = document.getElementById('modal');
const saveEditBtn = document.getElementById('save-edit');
const cancelEditBtn = document.getElementById('cancel-edit');
const editContentElement = document.getElementById('edit-content');

saveEditBtn.addEventListener('click', async () => {
  const index = parseInt(saveEditBtn.getAttribute('data-index'), 10);
  console.log('Index before updating:', index); // デバッグ: indexの値をチェック
  const confirmation = confirm('Can you overwrite the content? 内容を上書き保存していいですか？');
  if (confirmation) {
    const editContent = editContentElement.value;
    editDiary(index, editContent);
    modal.classList.add('hidden');
  }
});

// キャンセルボタンが押されたときの挙動。何もせず、モーダルウィンドウを閉じる。
cancelEditBtn.addEventListener('click', () => {
  modal.classList.add('hidden')
});