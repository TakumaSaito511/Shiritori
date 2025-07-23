// server.js
import { serveDir } from "jsr:@std/http/file-server";

// 直前の単語を保持しておく
let previousWord = "しりとり";
let usedWords = [previousWord];

// localhostにDenoのHTTPサーバーを展開
Deno.serve(async (_req) => {
    // パス名を取得する
    // http://localhost:8000/hoge に接続した場合"/hoge"が取得できる
    const pathname = new URL(_req.url).pathname;
    console.log(`pathname: ${pathname}`);

    // GET /shiritori: 直前の単語を返す
    if (_req.method === "GET" && pathname === "/shiritori") {
        return new Response(previousWord);
    }

    // POST /shiritori: 次の単語を受け取って保存する
    if (_req.method === "POST" && pathname === "/shiritori") {
        // リクエストのペイロードを取得
        const requestJson = await _req.json();
        // JSONの中からnextWordを取得
        const nextWord = requestJson["nextWord"];

        //「ん」がついたらゲーム終了
        if (nextWord.slice(-1) === "ん") {
            return new Response(null, {
                status: 403,
                headers: {
                    "Content-Type": "application/json; charset=utf-8",
                },
            });
        }

        //すでに使われた単語
        if (usedWords.includes(nextWord)) {
            return new Response(null, {
                status: 409,
                headers: {
                    "Content-Type": "application/json; charset=utf-8",
                },
            });
        }

        // previousWordの末尾とnextWordの先頭が同一か確認
        if (previousWord.slice(-1) === nextWord.slice(0, 1)) {
            // 同一であれば、previousWordを更新
            previousWord = nextWord;
            usedWords.push(nextWord);
        } // 同一でない単語の入力時に、エラーを返す
        else {
            return new Response(
                JSON.stringify({
                    "errorMessage": "前の単語に続いていません",
                    "errorCode": "10001",
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json; charset=utf-8",
                    },
                },
            );
        }
        // 現在の単語を返す
        return new Response(previousWord);
    }

    if (_req.method === "POST" && pathname === "/reset") {
        previousWord = "しりとり";
        usedWords = ["しりとり"];
        return new Response("リセットしました", { status: 200 });
    }

    // ./public以下のファイルを公開
    return serveDir(
        _req,
        {
            /*
            - fsRoot: 公開するフォルダを指定
            - urlRoot: フォルダを展開するURLを指定。今回はlocalhost:8000/に直に展開する
            - enableCors: CORSの設定を付加するか
            */
            fsRoot: "./public/",
            urlRoot: "",
            enableCors: true,
        },
    );
});
