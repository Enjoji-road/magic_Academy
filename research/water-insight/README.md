# 水魔法学・第2次作問研究

**答え・内部構造・解法を含むフォルダです。初見プレイ前は開かないでください。**

プレイ：https://enjoji-road.github.io/magic_Academy/water-insight-experiment.html

| ファイル | 内容 |
|---|---|
| `RESEARCH_SPOILERS.md` | 指定3案の15項目比較、採用理由、完全解説、想定思考、別解・総当たりへの限界 |
| `verify.py` | JSから独立した圧力・気体置換・逆問題・操作列の検証 |
| `verification.json` | 検証集計とJSとの比較用の状態サンプル |
| `test_insight.cjs` | 実HTMLの操作、保存・リセット・横スクロール・合格、既存78ファイル保持の検証 |
| `VALIDATION.md` | 自動検証で保証した範囲と未確認事項 |

旧 `research/water/` と `water-experiment.html` はそのまま残しています。

```sh
python3 research/water-insight/verify.py
STUDIO_JSDOM=/path/to/node_modules/jsdom node research/water-insight/test_insight.cjs
```
