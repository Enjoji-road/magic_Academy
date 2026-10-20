# 魔法学校

炎魔法学・土魔法学の初見テスト用プロトタイプです。

[プレイする](https://enjoji-road.github.io/magic_Academy/)

石を選択し、石盤で配置位置を確認してから「ここに置く」で配置します。
回転・裏返し・一マス調整・一手戻る・途中保存に対応しています。

## 旧版

土魔法学4×4の試作品は `prototype-01-4x4.html`、旧炎魔法学は `fire-prototype-01.html` に、変更前の内容をそのまま保存しています。

## 検証する場合のみ

`research/` には答えを含む設計データと検証コードがあります。
初見プレイ前は開かないでください。

```sh
python3 research/fire/verify_projection.py
node research/fire/test_model.cjs
node research/fire/test_interaction.cjs
python3 research/verify_design.py
python3 research/verify_alternative.py
node research/test_engine.cjs
node research/test_interaction.cjs
```

検証は全探索・ルール検証・疑似DOMによる操作確認です。実ブラウザの描画、スマートフォン実機、初見プレイヤーによる難易度は別途確認が必要です。
