'use strict';

// *************************************** Google Sheets API **************************************************
//  * スプレッドシート
//  * リンク先はこちら → https://docs.google.com/spreadsheets/d/1B4hwoTq-6DYXZMg163A-hFLWEJZyZBEqoNg9VVRP7rI/edit
//  */

// スプレッドシート表出に必要な定義
const tableBody = document.getElementById('gapi-sheets');
const errorView = document.getElementById('error-view');

// ***********************************日時の新しい順番にソートする関数***********************************************
async function sortByNewDate() {
  let response;
  try {
    // スプレッドシートのデータ取得
    response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: '1B4hwoTq-6DYXZMg163A-hFLWEJZyZBEqoNg9VVRP7rI',// スプレッドシートID
      range: 'master!A2:E100',// 範囲指定
    });
  } catch (err) {
    errorView.innerText = err.message;
    return;
  }
  // 名前が選択されていたら、フィルタリングを行う。
  let filteredData;
  const selectedName = document.getElementById('writer').value; // 名前が選択されている。

  if (selectedName) {
    // 名前が選択されていたら、Nameの列にselectedNameを入力する。
    filteredData = response.result.values.filter(row => row[1] === selectedName)
  } else {
    // 名前が選択されていなかったら、全てのスプレッドシートの値を代入する。
    filteredData = response.result.values;
  }
  // エラー処理
  if (!filteredData || filteredData.length == 0) {
    errorView.innerText = 'No values found.';
    return;
  }

  tableBody.innerHTML = '';

  for (let i = filteredData.length - 1; i >= 0; i--) {
    const date = filteredData[i][0];
    const name = filteredData[i][1];
    const content = filteredData[i][2];
    const newRow = document.createElement('tr'); // 新しい行を作成する

    // 日付の処理
    const dateCell = document.createElement('td');
    dateCell.className = 'border date text-center';
    dateCell.textContent = date;
    dateCell.style.width = '5rem';
    newRow.appendChild(dateCell);

    // 名前の処理
    const nameCell = document.createElement('td');
    nameCell.className = 'border writer text-center';
    nameCell.textContent = name;
    nameCell.style.width = '5rem';
    newRow.appendChild(nameCell);

    // 日記内容の処理
    const contentCell = document.createElement('td');
    contentCell.className = 'border';
    contentCell.textContent = content;
    contentCell.style.width = '30rem';
    newRow.appendChild(contentCell);

    // 編集アイコンの処理
    const editCell = document.createElement('td');
    editCell.className = 'border text-center';
    const editIcon = document.createElement('i');
    editIcon.className = 'material-icons';
    editIcon.textContent = 'edit';
    editCell.style.width = '5rem';
    editCell.classList.add('cursor-pointer');
    editCell.appendChild(editIcon);
    newRow.appendChild(editCell);

    // 削除アイコンの処理
    const deleteCell = document.createElement('td');
    deleteCell.className = 'border text-center';
    const deleteIcon = document.createElement('i');
    deleteIcon.className = 'material-icons';
    deleteIcon.textContent = 'delete';
    deleteCell.style.width = '5rem';
    deleteCell.classList.add('cursor-pointer');
    deleteCell.appendChild(deleteIcon);
    // クリックイベントに対してクロージャを使用して、iの値を保存
    deleteIcon.addEventListener('click', (function (index) {
      return function () {
        const confirmation = confirm('Are you sure?');
        if (confirmation) {
          deleteDiary(index);
        }
      };
    })(i));
    newRow.appendChild(deleteCell);
    tableBody.appendChild(newRow); // 新しく行を追加する。
  }
}

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

// /**
//  ********************************************** 日記を削除する関数*********************************************************
//  */
async function deleteDiary(index) {
  let response;
  console.log('削除アイコンがクリックされました。インデックス:', index + 2);
  // ここで削除アクションを処理（記述された内容を削除できるが、Googleスプレッドシートの行を削除まではできない）
  try {
    response = await gapi.client.sheets.spreadsheets.values.clear({
      spreadsheetId: '1B4hwoTq-6DYXZMg163A-hFLWEJZyZBEqoNg9VVRP7rI',
      range: `master!A${index + 2}:E${index + 2}`,
    });
    console.log('Googleスプレッドシートの、削除アクションが完了しました。');
  } catch (err) {
    console.error('Error:', err);
  }
  // Googleスプレッドシートの空白の行を削除する。真ん中の行を削除した際は、詰める。
  await gapi.client.sheets.spreadsheets.batchUpdate({
    spreadsheetId:'1B4hwoTq-6DYXZMg163A-hFLWEJZyZBEqoNg9VVRP7rI',
    resource: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: 0,
              dimension: 'ROWS',
              startIndex: index + 1, // 削除する行の開始インデックス
              endIndex: index + 2, // 削除する行の終了インデックス(+1行)
            },
          },
        },
      ],
    },
  });
  await sortByNewDate(); // sortByNewDate を呼び出して再描画
  console.log('sortByNewDate が呼び出されました。');
}

// 日記をフィルタリングするボタン
const FilterByNameBtn = document.getElementById("filter-by-name-btn")

FilterByNameBtn.addEventListener('click', () => {
  sortByNewDate();
});

// 名前選択後、textareaに自動的にカーソルが当たる
const selectedName = document.getElementById('writer');
const diaryContentElement = document.getElementById('diary-content')

selectedName.addEventListener('change', () => {
  diaryContentElement.focus();
});