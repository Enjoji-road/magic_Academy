# 卒業試験・第3次研究『手を離した、その先に』

この入口は核心を伏せています。**詳細資料・モデル・検証コードには解法が含まれます。**

異なる魔法法則を**5案**比較し、一案を実際に遊べる独立試作にしました。演出の再生ではなく、選んだ魔法・触れた対象・現在の支え方から、その後の状態を計算します。

**試作は完成問題としての採用を保留しています。** 中心の発想を得た後に少数候補を試せること、四教室の再考察がすべて独立必須ではないことが未解決です。初見の楽しさは、作者側の動作確認だけでは証明できません。

## 遊ぶ

[ブラウザで試作を開く](https://enjoji-road.github.io/magic_Academy/research/graduation-magic-v3/)

このフォルダの `index.html` が入口です。正式な四科目は修了した想定で始まります。教室はどの順でも訪問できます。スマホでは「観測に集中」を使うと、装置・魔法選択・観測対象・操作を一画面にまとめられます。拡大、観測記録、自由メモ、専用自動保存、リセット、効果音切替、動きを減らす設定があります。BGMはありません。

新しい相互作用は**今回の提案**です。現在公開されている通常試験に、以前から実装されていたという意味ではありません。四教室は再考察に必要な部分を簡略化しています。

## 卒業演出・共有の追加（2026-10-22）

制作者の実プレイで現行の難易度が適切と評価されたため、今回の体験改修は作問を変えず、卒業の伝わり方と共有だけを改善しています。

初回の成功時は、残った光を約0.9秒見せ、約1.1秒で暗転して全画面の卒業画面へ移ります。試験室へ戻って観測を続けられ、卒業画面は任意で再表示できます。再読込だけでは自動再生しません。動きを減らす設定ではフェードを省略します。

X共有は公式入口URLを付けた下書きを別タブで開き、投稿は本人が確定します。共有文は `graduation-screen.js` の `SHARE_TEXT` と `SHARE_URL` で変更できます。

変更一覧・確認結果は [GRADUATION_UI_UPDATE.md](GRADUATION_UI_UPDATE.md)、追加の実ブラウザ検証は [graduation-ui-verification.json](graduation-ui-verification.json) に記載しています。

## 確認した範囲

- JavaScriptと独立したPythonの異なる計算法で、**14,641状態**の結果が一致。
- 定義したモデル内の最終状態は一意。作る順番24通り、誤操作からの復帰を確認。
- Chromiumで実操作を確認。320 / 375 / 390 / 768px幅、動きを減らした観測、保存・復元を確認。
- 基準コミット `a943deb56bde45471c6cd13ecbd67f02ebc01498` の既存110ファイルを保護。四科目の正答受理も再確認。
- 正式科目・メモ・効果音など既存の保存値を変えず、試作専用キーだけを使用。

これは**新しく定義した魔法法則の整合性**の検証です。現実の永久機関、初見の発見率、完成版への統合後の安全性を証明したものではありません。灯りの維持には有限の魔力と学院の定期補給を定義しています。

## 初見テストで見たいこと

1. 何を比べればよいか、自分で方針を立てられるか。
2. 再訪が四つの反応を回収する作業になっていないか。
3. 最後に、先ほどまでの観測の意味が変わる瞬間があるか。
4. 理解するより、候補を試す方が楽になっていないか。
5. 自分の操作で新しい光を残したと感じられるか。

## 核心を確認するとき

- [GRADUATION_RESEARCH_V3_SPOILERS.md](GRADUATION_RESEARCH_V3_SPOILERS.md)：過去二回の振り返り、5案・12項目の比較、詳細作問、想定思考、限界、統合計画。
- [law-model.json](law-model.json)：新規法則と観測条件の定義。
- [verification.json](verification.json)：探索結果。失敗・省略可能性も記録。
- [browser-verification.json](browser-verification.json)：実ブラウザによる操作結果。
- [preservation.json](preservation.json)：既存ファイルのハッシュと採点の確認。
- [spell-support.svg](spell-support.svg)、[implementation-boundary.svg](implementation-boundary.svg)：構造図。

## 再検証

Python 3、Node.js。モデル検証は追加ライブラリ不要です。

```bash
python research/graduation-magic-v3/verify_magic.py
node research/graduation-magic-v3/verify_preservation.cjs
```

実ブラウザの再検証にはPlaywrightとChromiumが必要です。ローカルHTTPサーバーは検証スクリプト自身が起動します。

```bash
node research/graduation-magic-v3/test_browser.cjs
node research/graduation-magic-v3/test_graduation_ui.cjs
```

Chromiumを別途用意している場合は `BROWSER_EXECUTABLE` で実行ファイルを指定できます。`JAPANESE_FONT_DIR` は検証ホストだけに日本語フォントを追加する任意設定です。配信ゲームに外部フォント・実行時ライブラリは必要ありません。

試作の依存は、このフォルダの `style.css`、`magic-model.js`、`graduation-screen.js`、`app.js` と、読み取り専用の `../../wind-ribbon-data.js`、`../../wind-ribbon-model.js` です。単一HTMLをダブルクリックする配布ではなく、リポジトリ全体をHTTP配信してください。
