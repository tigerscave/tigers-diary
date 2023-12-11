'use strict';

// 開発者が、コードを使用する際に、Google Developer Consoleから取得したクライアントIDとAPIキーに置き換える必要がある。GoogleAPI認証に関連
const CLIENT_ID = '548091201660-oi1orddbqoq8pk2ffudtepae2ne09m45.apps.googleusercontent.com';
const API_KEY = 'AIzaSyDIF89mrc2-_iXxF-THEUMeGowtaDiLH5g';

// APIのDiscovery文書のURLを指定。エンドポイント（データにアクセスするためのURL）やメソッド（HTTPリクエストにおいて実行されるアクション指定）などの情報を提供する。
const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';

// APIが必要とする認可スコープを指定。
// Google Sheets APIに対して、アクセスを要求する。
// 必要に応じて、複数のスコープをスペースで区切って指定できる。
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

let tokenClient;
let gapiInited = false;
let gisInited = false;

if (document.getElementById('authorize-btn')) {
  document.getElementById('authorize-btn').style.visibility = 'hidden';
}
if (document.getElementById('signout-btn')) {
  document.getElementById('signout-btn').style.visibility = 'hidden';
}

/**
 * Google APIクライアントライブラリをロードする。
 * その後、initializeGapiClient関数を実行する。
 */
function gapiLoaded() {
  gapi.load('client', initializeGapiClient);
}

/**
 * APIクライアントが読み込まれたら、呼び出される。
 * API初期化のための、Discovery文書の読み込み。
 */
async function initializeGapiClient() {
  //APIクライアントの初期化をする。awaitを使うことで、非同期処理が完了するまで、次のステップには進まないようにする。
  await gapi.client.init({
    apiKey: API_KEY,//apiKeyプロパティには、API_KEYが設定された。
    discoveryDocs: [DISCOVERY_DOC],//discoveryDocsプロパティにはDISCOVERY_DOCが設定された。APIの初期化と、アプリケーションがAPIに対して、操作可能になる。
  });
  gapiInited = true;
  enableAuthorizeBtn();//ボタンなどのUI要素を有効にする。
}

/**
 * Google認証サービスが読み込まれたら、gisLoaded関数を呼び出す。
 */
//Google Identity Services（Googleアカウントを使用した、ユーザー認証、OAuth2.0を介したアクセストークンの取得）
function gisLoaded() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: '', // 変数や関数が後で定義されることを示す。defined later
  });
  gisInited = true;
  enableAuthorizeBtn();
}

/**
 * ライブラリが正常に初期化された場合に、関数を実行する。
 */
function enableAuthorizeBtn() {
  if (gapiInited && gisInited) {
    if (document.getElementById('authorize-btn')) {
      document.getElementById('authorize-btn').style.visibility = 'visible';
    }
  }
}
/**
 *  サインイン処理
 */
const authorizeBtn = document.getElementById('authorize-btn');
if (authorizeBtn) {

  authorizeBtn.addEventListener('click', () => {
    if (authorizeBtn.innerText === 'Authorize') {
      tokenClient.callback = async (resp) => { //respとはresponseの略。APIリクエストの応答や結果
        if (resp.error !== undefined) {
          throw (resp); //エラーを投げる。
        }
        document.getElementById('signout-btn').style.visibility = 'visible'; //サインアウトボタンを出現
        authorizeBtn.innerText = 'Refresh'; //認証（Authorize）ボタンの文字をRefreshに変更。
        // sortByNewDateの完了を待つ。
        await sortByNewDate();
      };
    } else {
      tableBody.innerHTML = '';
      sortByNewDate();
    }

    //新しいセッションの場合は、ユーザーに対してアカウント選択と同意を求め、既存のセッションの場合はこれをスキップして、アクセストークンを取得する。
    if (gapi.client.getToken() === null) {
      // ユーザーが初めてアプリにアクセス、もしくは以前のセッションがクリアされた状態
      // ユーザーに対して、Googleアカウントの選択とデータの共有について許可を求めるためのダイアログが表示される。
      // ユーザーはアプリに対して、アクセスを許可するかどうかを選択する。
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      // 既にセッションが存在している場合、アクセストークンを取得する。
      // promptパラメータは空の文字列に設定されている。これにより、アカウントの選択と同意ダイアログがスキップされる。
      tokenClient.requestAccessToken({ prompt: '' });
    }
  });
}

/**
 *  サインアウトの処理
*/
const signOutBtn = document.getElementById('signout-btn');
if (signOutBtn) {
  signOutBtn.addEventListener('click', () => {
    const token = gapi.client.getToken(); //tokenは、現在アクセスしている最中のトークンとする。
    if (token !== null) { // アクセストークンが存在する場合、
      google.accounts.oauth2.revoke(token.access_token); //oauth2.revokeメソッドを使用。アクセストークンを使用して、サインアウトさせる。アクセス権取り上げる。
      gapi.client.setToken('');// クライアントのトークンがクリアされる。
      document.getElementById('error-view').innerText = ''; // エラーテキストを表示する要素をクリアする。
      document.getElementById('authorize-btn').innerText = 'Authorize'; //ボタンや表示をリセットする。テキストをAuthorizeに変更する。
      document.getElementById('signout-btn').style.visibility = 'hidden'; // Sign outボタンを非表示にする。
    }
  });
}

// /**
//  * スプレッドシート
//  * リンク先はこちら → https://docs.google.com/spreadsheets/d/1B4hwoTq-6DYXZMg163A-hFLWEJZyZBEqoNg9VVRP7rI/edit
//  */

// スプレッドシート表出に必要な定義
const tableBody = document.getElementById('gapi-sheets');
const errorView = document.getElementById('error-view');

// 新しい順番にソートする関数
async function sortByNewDate() {
  let response;
  try {
    // スプレッドシートのデータ取得
    response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: '1B4hwoTq-6DYXZMg163A-hFLWEJZyZBEqoNg9VVRP7rI',// ExcelID
      range: 'master!A2:C100',// 範囲指定
    });
  } catch (err) {
    errorView.innerText = err.message;
    return;
  }
  const range = response.result;
  // 取得したデータ結果がない、データの値が存在しない、データの範囲が０の場合、エラーメッセージを返す。
  if (!range || !range.values || range.values.length == 0) {
    errorView.innerText = 'No values found.';
    return;
  }

  tableBody.innerHTML = '';

  for (let i = range.values.length - 1; i >= 0; i--) {
    const date = range.values[i][0];
    const name = range.values[i][1];
    const content = range.values[i][2];
    const newRow = document.createElement('tr');

    // 日付の処理
    const dateCell = document.createElement('td');
    dateCell.className = 'border date';
    dateCell.textContent = date;
    dateCell.style.width = '5rem';
    newRow.appendChild(dateCell);

    // 名前の処理
    const nameCell = document.createElement('td');
    nameCell.className = 'border writer';
    nameCell.textContent = name;
    nameCell.style.width = '5rem';
    newRow.appendChild(nameCell);

    // 日記内容の処理
    const contentCell = document.createElement('td');
    contentCell.className = 'border progress-content';
    contentCell.textContent = content;
    contentCell.style.width = '30rem';
    newRow.appendChild(contentCell);

    // 編集アイコンの処理
    const editCell = document.createElement('td');
    editCell.className = 'border';
    const editIcon = document.createElement('i');
    editIcon.className = 'material-icons';
    editIcon.textContent = 'edit';
    editCell.style.width = '5rem';
    editCell.appendChild(editIcon);
    newRow.appendChild(editCell);

    // 削除アイコンの処理
    const deleteCell = document.createElement('td');
    deleteCell.className = 'border';
    const deleteIcon = document.createElement('i');
    deleteIcon.className = 'material-icons';
    deleteIcon.textContent = 'delete';
    deleteCell.style.width = '5rem';
    deleteCell.appendChild(deleteIcon);
    newRow.appendChild(deleteCell);
    tableBody.appendChild(newRow);
  }
}

function containsNgWord(content, ngWords) {
  const sanitizedContent = content.toLowerCase(); // 小文字に変換して比較
  return ngWords.some(ngWord => sanitizedContent.includes(ngWord));
}

// 日記を追記する関数
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

  let values = [
    [`${month}/${day}`, writer, diaryContent]
  ];
  const body = {
    values: values,
  };
  let response;
  try {
    const ngWords = ['クソ', 'くそ', 'kuso', 'kasu', '無理', 'かす', 'むり', 'できない', 'うんち', 'fuck', '失敗', 'ごみ', 'ゴミ', 'つかえない', '使えない','だめ','ダメ','没','ボツ'];
    if (containsNgWord(diaryContent, ngWords)) {
      alert('Great job!Could you please express your thoughs using positive words?Thank you!');
      console.log('NGワードが含まれているため、投稿できません。');
      return;
    }
    response = await gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId: '1B4hwoTq-6DYXZMg163A-hFLWEJZyZBEqoNg9VVRP7rI',
      range: 'master!A18:C18',
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

const postBtn = document.getElementById('post-btn')
const postMessage = document.getElementById('post-message')

// スプレッドシートへの書き込みが完了した後にデータを取得。async/awaitを使用。
postBtn.addEventListener('click', async () => {
  // 選択された名前の情報を参照する。
  const writerElement = document.getElementById("writer")
  const writer = writerElement.value
  await appendDiary();
  tableBody.innerHTML = '';
  await sortByNewDate();
  const diaryContentElement = document.getElementById('diary-content')
  diaryContentElement.value = '';
  writerElement.value = '';
});

// /**
//  * 日記を削除する関数
//  */

async function deleteLastDiary() {
  let response;
  try {
    response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId:'1B4hwoTq-6DYXZMg163A-hFLWEJZyZBEqoNg9VVRP7rI',
      range: 'master!A2:C100'
    });
  } catch (err) {
    errorView.innerText = err.message;
    return;
  }

  const range = response.result;
  if(!range || !range.values || range.values.length == 0) {
    errorView.innerText = 'No values found';
    return;
  }
  // 日記の最新の要素
  const lastIndex = range.values.length - 1;

  try {
    // 最新の日記を削除する
    await gapi.client.sheets.spreadsheets.values.clear({
      spreadsheetId:'1B4hwoTq-6DYXZMg163A-hFLWEJZyZBEqoNg9VVRP7rI',
      range: `master!A${lastIndex + 2}:C${lastIndex + 2}`,
    });
    // 日記一覧を表示する
    await sortByNewDate();
  } catch(err) {
    console.error('Error');
  }
}

const deleteBtn = document.getElementById('delete-btn')

deleteBtn.addEventListener('click',()=> {
  const confirmation = confirm('Are you sure?');
  if(confirmation){
    deleteLastDiary();
  } 
});