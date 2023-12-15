'use strict';

// /********************************* OAuth 2.0 **************************************************
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
