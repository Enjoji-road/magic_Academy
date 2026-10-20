# 炎魔法学の検証資料 — ネタバレあり

初見プレイ前は、このディレクトリのデータを開かないでください。

```sh
python3 research/fire/verify_projection.py
node research/fire/test_model.cjs
node research/fire/test_interaction.cjs
node research/test_engine.cjs
node research/test_interaction.cjs
```

Pythonは有理数で点光源からの投影を求め、不透明な図形の和集合を比較します。JSのテストは、その結果との一致と、通常操作・保存・一覧の状態更新を確認します。

疑似DOMによるテストは、実ブラウザの描画・タッチ操作・初見難易度の検証を代替しません。
