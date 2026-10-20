# 炎魔法学・第4次研究 — ネタバレ注意

初見プレイ：<https://enjoji-road.github.io/magic_Academy/fire-experiment.html>

初見評価を残したい場合、このフォルダの解説・コード・検証JSONを先に読まないでください。

- `RESEARCH_SPOILERS.md`：6案の比較、思考シミュレーション、採用案の完全解説、限界。
- `verify.py`：同じ立体校章からの投影、有理数の光線確認、100万通りの番号全探索、独立な透かしパターンの検証。
- `verification.json`：全観測、原像の唯一解、観測削除・条件削除後の解数。
- `test_model.cjs`：Python結果との一致、魔法・保存版・判定・既存ファイルの保存。
- `test_interaction.cjs`：疑似DOMでの点火から提出・途中保存・再開・リセットまで。

リポジトリのルートで実行：

```sh
python3 research/fire-v4/verify.py
node research/fire-v4/test_model.cjs
node research/fire-v4/test_interaction.cjs
```

Python 3.10以上とNode.js。追加パッケージは不要です。

点光源としての理想化を明示しています。実炎・有限面光源・実ブラウザ・実機タッチ・人間の初見難易度を検証したものではありません。
通常版の `fire.html`、土魔法学、試験一覧の合格記録は、この試作とは独立しています。
