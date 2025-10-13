import fetch from "node-fetch";
import fs from "fs";
//import fetch from "node-fetch";
import "dotenv/config";
import { TwitterApi } from "twitter-api-v2";

// ========== 設定 ==========
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const topics = fs.readFileSync("./prompts/topics.txt", "utf-8").split("\n").filter(Boolean);

// ========== Geminiで文章生成 ==========
async function generatePost() {
  const topic = topics[Math.floor(Math.random() * topics.length)];
  const prompt = `
あなたは「思想サークル：現代バビロン」のAI広報です。
以下のテーマについて、静かで思想的・警鐘的な短文（140文字以内）を日本語で作成してください。
最後に必ず「#現代バビロン #思想サークル」を付けてください。

テーマ: ${topic}
  `;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      }),
    }
  );

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  return text?.replace(/\n+/g, " ") || null;
}

// ========== Twitter投稿 ==========
const client = new TwitterApi({
  appKey: process.env.TW_APP_KEY,
  appSecret: process.env.TW_APP_SECRET,
  accessToken: process.env.TW_ACCESS_TOKEN,
  accessSecret: process.env.TW_ACCESS_SECRET,
});

async function postToTwitter(text) {
  await client.v2.tweet(text);
  const time = new Date().toLocaleString("ja-JP");
  fs.appendFileSync("./logs/post_log.txt", `[${time}] ${text}\n`);
  console.log("✅ 投稿完了:", text);
}

// ========== 実行 ==========
(async () => {
  const post = await generatePost();
  if (!post) {
    console.error("❌ 投稿文生成に失敗しました。");
    return;
  }
  await postToTwitter(post);
})();
