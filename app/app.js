const AWSXRay = require('aws-xray-sdk');

// ここで各ライブラリをキャプチャ
const AWS = AWSXRay.captureAWS(require('aws-sdk'));
// 手動でトレースデータを生成しているためSDKでのキャプチャをしていません
// AWSXRay.captureHTTPsGlobal(require('https'));
// AWSXRay.captureHTTPsGlobal(require('http'));
// const mysql = AWSXRay.captureMySQL(require('mysql'));
const mysql = require('mysql');

// エラーが発生した場合の動作を指定する
AWSXRay.setContextMissingStrategy('LOG_ERROR');
// デーモンのアドレスを設定する
AWSXRay.setDaemonAddress('xrayd:2000');

const axios = require('axios');

const express = require('express');
const app = express();
app.set('view engine', 'ejs');

app.use(AWSXRay.express.openSegment('MyApp'));

app.get('/status', (req, res) => {
  res.send('ok');
});

app.get('/', async (req, res) => {
  AWSXRay.capturePromise();
  const parentSeg = AWSXRay.getSegment();
  const s3Client = new AWS.S3({ region: 'ap-northeast-1' });
  const bukets = await s3Client.listBuckets().promise();

  await requestGetHelper(parentSeg, 'https://www.google.co.jp/');
  await requestGetHelper(parentSeg, 'http://localhost:3000/status');

  const conn = mysql.createConnection({
    host: 'db',
    port: 3306,
    user: 'root',
    password: 'password',
    database: 'xray_example',
  });
  conn.connect();

  // queryが非同期関数のためPromiseでラッピングした関数を利用します
  const books = await queryHelper(
    conn,
    parentSeg,
    'SELECT b.title,a.author_name as author FROM books b INNER JOIN authors a ON a.id= b.author_id'
  );

  conn.end();

  // レンダリング時間を計測するためサブセグメントを生成
  const seg = parentSeg.addNewSubsegment('render');
  res.render('./index.ejs', {
    books,
    author: req.query.author,
    title: req.query.title,
  });
  // 注釈を入れることが可能です
  // seg.addAnnotation({key: 'value'});
  // メタデータも入れることが可能です
  // seg.addAttribute({key: 'value'});
  seg.close();
});

app.use(AWSXRay.express.closeSegment());
app.listen(3000);

const queryHelper = (conn, parentSeg, query, params = []) => {
  const config = conn.config;
  // SDKではSQLクエリがうまく収集できなかったため手動でサブセグメントを生成しています
  const seg = parentSeg.addNewSubsegment(`${config.database}@${config.host}`);
  // サブセグメントフィールドにSQLクエリ情報をセット
  seg.addSqlData({
    url: `${config.host}:${config.port}/${config.database}`,
    user: config.user,
    sanitized_query: query,
  });
  seg.namespace = 'remote';

  var session = AWSXRay.getNamespace();
  session.run(() => {
    AWSXRay.setSegment(seg);
  });

  return new Promise((resolve, reject) => {
    conn.query(query, params, (err, rows) => {
      if (err) {
        seg.close(err);
        reject(err);
      }
      seg.close();
      resolve(rows);
    });
  });
};

requestGetHelper = async (parentSeg, uri) => {
  const url = require('url');
  const options = url.parse(uri);
  // SDKでは外部リクエストうまく収集できなかったため手動でサブセグメントを生成しています
  const seg = parentSeg.addNewSubsegment(
    options.hostname || options.host || 'Unknown host'
  );
  const res = await axios.get(uri);
  seg.close();
  // サブセグメントフィールドにリクエスト情報をセット
  const { request } = res;
  seg.addRemoteRequestData(request, res.request.res, true);
  seg.namespace = 'remote';
};
