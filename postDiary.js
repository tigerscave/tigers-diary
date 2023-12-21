'use strict';

// /**
//  ******************************************************日記を投稿する関数**************************************************************
//  */

async function appendDiary(spreadsheetId, range, valueInputOption, _values, callback) {
  // 日時の情報を取得
  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();

  // 名前の情報を取得
  const writerElement = document.getElementById("writer")
  const writer = writerElement.value

  // 日記の内容を取得
  const diaryContentElement = document.getElementById('diary-content')
  const diaryContent = diaryContentElement.value

  // A列(月日)、B列(名前)、C列(内容)、D列(edit文字)、E列(delete文字)を挿入
  let values = [
    [`${month}/${day}`, writer, diaryContent,"edit","delete"]
  ];
  const body = {
    values: values,
  };
  let response;
  try {
    // 日記を投稿する際に、使ってはいけないNGワード。使うと、アラートが出て、やり直しになる。
    const ngWords = ['クソ', 'くそ', 'kuso', 'kasu', '無理', 'かす', 'むり', 'できない', 'うんち', 'fuck', '失敗', 'ごみ', 'ゴミ', 'つかえない', '使えない', 'だめ', 'ダメ', '没', 'ボツ'];
    if (ngWords.some(word => diaryContent.includes(word))) {
      alert('You did good job.Could you please express your thoughs using positive words?Thank you.');
      console.log('NGワードが含まれているため、投稿できません。');
      return;
    }
    response = await gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId: '1B4hwoTq-6DYXZMg163A-hFLWEJZyZBEqoNg9VVRP7rI',
      range: 'master!A18:E18',
      // 追記にはvalueInputOptionパラメータを使用する。
      valueInputOption: 'RAW',
      resource: body,
    }).then((response) => {
      const result = response.result;
      console.log(`${result.updatedCells} cells updated.`);
      if (callback) callback(response);
    });
  } catch (err) {
    errorView.innerText = err.message;
    return;
  }
}

// スプレッドシートへの書き込みが完了した後にデータを取得。async/awaitを使用。
const postBtn = document.getElementById('post-btn')

postBtn.addEventListener('click', async () => {
  // 選択された名前の情報を参照する。
  const writerElement = document.getElementById("writer")
  const writer = writerElement.value
  await appendDiary();
  tableBody.innerHTML = '';
  await sortByNewDate();
  // 日記を投稿後、名前と内容をリセットする。
  const diaryContentElement = document.getElementById('diary-content')
  diaryContentElement.value = '';
  writerElement.value = '';
});