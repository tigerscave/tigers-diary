'use strict';

// /**
//  ********************************************** 日記を削除する関数*********************************************************
//  */
async function deleteDiary(index) {
  // Googleスプレッドシートの行を削除する。真ん中の行を削除した際は、詰める。
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