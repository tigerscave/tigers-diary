'use strict';

// 開発者が、コードを使用する際に、Google Developer Consoleから取得したクライアントIDとAPIキーに置き換える必要がある。GoogleAPI認証に関連
const CLIENT_ID = '548091201660-oi1orddbqoq8pk2ffudtepae2ne09m45.apps.googleusercontent.com';
const API_KEY = 'AIzaSyDIF89mrc2-_iXxF-THEUMeGowtaDiLH5g';

// APIのDiscovery文書のURLを指定。エンドポイント（データにアクセスするためのURL）やメソッド（HTTPリクエストにおいて実行されるアクション指定）などの情報を提供する。
const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';

// APIが必要とする認可スコープを指定。Google Sheets APIに対して、読み取り専用アクセスを要求する。
// 必要に応じて、複数のスコープをスペースで区切って指定できる。
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets.readonly';

let tokenClient;
let gapiInited = false;
let gisInited = false;

document.getElementById('authorize_button').style.visibility = 'hidden';
document.getElementById('signout_button').style.visibility = 'hidden';

/**
 * Google APIクライアントライブラリをロードする。その後、initializeGapiClient関数を実行する。
 */
function gapiLoaded() { 
  gapi.load('client', initializeGapiClient);
}

/**
 * APIクライアントが読み込まれたら、呼び出される。
 * API初期化のための、Discovery文書の読み込み。
 */
async function initializeGapiClient() {
  await gapi.client.init({//APIクライアントの初期化をする。awaitを使うことで、非同期処理が完了するまで、次のステップには進まないようにする。
    apiKey: API_KEY,//apiKeyプロパティには、API_KEYが設定された。
    discoveryDocs: [DISCOVERY_DOC],//discoveryDocsプロパティにはDISCOVERY_DOCが設定された。APIの初期化と、アプリケーションがAPIに対して、操作可能になる。
  });
  gapiInited = true;
  maybeEnableButtons();//ボタンなどのUI要素を有効にする。
}

/**
 * Google認証サービスが読み込まれたら、gisLoaded関数を呼び出す。
 */
function gisLoaded() { //Google Identity Services（Googleアカウントを使用した、ユーザー認証、OAuth2.0を介したアクセストークンの取得）
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: '', // 変数や関数が後で定義されることを示す。defined later
  });
  gisInited = true;
  maybeEnableButtons();
}

/**
 * ライブラリが正常に初期化された場合に、関数を実行する。
 */
function maybeEnableButtons() {
  if (gapiInited && gisInited) { 
    document.getElementById('authorize_button').style.visibility = 'visible';
  }
}

/**
 *  サインイン処理
 */
function handleAuthClick() {
  tokenClient.callback = async (resp) => { //respとはresponseの略。APIリクエストの応答や結果
    if (resp.error !== undefined) {
      throw (resp); //エラーを投げる。
    }
    document.getElementById('signout_button').style.visibility = 'visible'; //サインアウトボタンを出現
    document.getElementById('authorize_button').innerText = 'Refresh'; //認証（Authorize）ボタンの文字をRefreshに変更。
    // await listMajors(); //listMajorsの完了を待つ。
    await showProgressReport();
  };
  
  //新しいセッションの場合は、ユーザーに対してアカウント選択と同意を求め、既存のセッションの場合はこれをスキップして、アクセストークンを取得する。
  if (gapi.client.getToken() === null) {
    // ユーザーが初めてアプリにアクセス、もしくは以前のセッションがクリアされた状態
    // ユーザーに対して、Googleアカウントの選択とデータの共有について許可を求めるためのダイアログが表示される。ユーザーはアプリに対して、アクセスを許可するかどうかを選択する。
    tokenClient.requestAccessToken({prompt: 'consent'});
  } else {
    // 既にセッションが存在している場合、アクセストークンを取得する。
    tokenClient.requestAccessToken({prompt: ''});//promptパラメータは空の文字列に設定されている。これにより、アカウントの選択と同意ダイアログがスキップされる。
  }
}

/**
 *  サインアウトの処理
 */
function handleSignoutClick() {
  const token = gapi.client.getToken(); //tokenは、現在アクセスしている最中のトークンとする。
  if (token !== null) { // アクセストークンが存在する場合、
    google.accounts.oauth2.revoke(token.access_token); //oauth2.revokeメソッドを使用。アクセストークンを使用して、サインアウトさせる。アクセス権取り上げる。
    gapi.client.setToken('');// クライアントのトークンがクリアされる。
    document.getElementById('content').innerText = ''; // テキストコンテンツを表示する要素のテキストをクリアする。
    document.getElementById('authorize_button').innerText = 'Authorize'; //ボタンや表示をリセットする。テキストをAuthorizeに変更する。
    document.getElementById('signout_button').style.visibility = 'hidden'; // Sign outボタンを非表示にする。
  }
}

// スプレッドシートの出現
async function showProgressReport() {
  let response;
  try {
    response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: '1B4hwoTq-6DYXZMg163A-hFLWEJZyZBEqoNg9VVRP7rI', 
      range: 'master!A2:C5', 
    });
  } catch (err) {
    document.getElementById('content-practice').innerText = err.message;
    return;
  }
  const range = response.result;
  if (!range || !range.values || range.values.length == 0) { 
    document.getElementById('content-practice').innerText = 'No values found.';
    return;
  }

  const practiceDateElements = document.querySelectorAll('.practice-date')
  const practiceNameElements = document.querySelectorAll('.practice-name')
  const practiceContentElements = document.querySelectorAll('.practice-content')

 for(let i = 0; i < range.values.length; i++) {
   const date = range.values[i][0];
   const name = range.values[i][1];
   const content = range.values[i][2];

   practiceDateElements[i].textContent = date;
   practiceNameElements[i].textContent = name;
   practiceContentElements[i].textContent = content;
 }
}

// /**
//  * スプレッドシート
//  * リンク先はこちら → https://docs.google.com/spreadsheets/d/1B4hwoTq-6DYXZMg163A-hFLWEJZyZBEqoNg9VVRP7rI/edit
//  */
// async function listMajors() {
//   let response;
//   try {
//     // スプレッドシートのデータ取得
//     response = await gapi.client.sheets.spreadsheets.values.get({
//       spreadsheetId: '1B4hwoTq-6DYXZMg163A-hFLWEJZyZBEqoNg9VVRP7rI', // ExcelID
//       range: 'master!A2:E', // 範囲指定
//     });
//   } catch (err) {
//     document.getElementById('content').innerText = err.message;
//     return;
//   }
//   const range = response.result;
//   if (!range || !range.values || range.values.length == 0) { // 取得したデータ結果がない、データの値が存在しない、データの範囲が０の場合、エラーメッセージを返す。
//     document.getElementById('content').innerText = 'No values found.';
//     return;
//   }
//   // 取得したデータ結果がある場合、データを特定の形式に整形 → 表示用の文字列を作成
//   const output = range.values.reduce(
//       (str, row) => `${str}${row[0]}, ${row[1]}, ${row[2]}\n`,
//       'Date, Name, Content\n');
//   document.getElementById('content').innerText = output;
// }