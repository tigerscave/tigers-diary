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
    contentCell.className = 'border  w-[45rem]';
    contentCell.textContent = content;
    // contentCell.style.width = '30rem';
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