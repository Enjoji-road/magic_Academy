# 魔法学校

四元素を使って挑戦する、ブラウザで遊べる魔法学院の実技試験です。

**[▶ 魔法学校・四元素の試験回廊へ](https://enjoji-road.github.io/magic_Academy/)**

四つの教室には好きな順番で入れます。各試験の観測、メモ、合格記録は同じブラウザの端末内に個別保存され、教室を移動しても続きから再開できます。

| 科目 | タイトル | 教室 |
| --- | --- | --- |
| 炎魔法学 | 灯樹の原像 | [灯火観測室](https://enjoji-road.github.io/magic_Academy/fire-studio.html) |
| 水魔法学 | 水の届かない部屋 | [水盤室](https://enjoji-road.github.io/magic_Academy/water-insight-experiment.html) |
| 風魔法学 | 風に綴じられた言葉 | [高塔観測室](https://enjoji-road.github.io/magic_Academy/wind-ribbon-experiment.html) |
| 土魔法学 | 第一の石盤 | [封印石盤室](https://enjoji-road.github.io/magic_Academy/earth-studio.html) |

四科目の合格状況は試験回廊に反映されます。**卒業試験の内容と開室は今後の制作対象**で、四科目合格時にも現状は未公開です。

## 共通の魔法表現

試験室の四属性ボタンは `academy-element-icons.js` / `academy-element-icons.css` に定義した**同じ学院公式の属性紋章**を使用します。発動演出は `academy-magic-vfx.js` / `academy-magic-vfx.css` が担当し、各科目の正解判定・保存・観測モデルには干渉しません。

## 過去の研究試作について

過去の試作品も、比較・検証用にリポジトリ内へ残しています。旧式の水槽や旧炎試験を遊ぶ場合、現在の四元素回廊で合格として数えるのは上記の現行版です。

`research/` の作問資料や検証コードには**解答・内部構造のネタバレ**が含まれることがあります。初見で遊ぶ場合は試験ページから始めてください。

PCブラウザとスマートフォン幅を前提に設計していますが、実機・ブラウザ間の最終検証と初見プレイヤーテストは継続課題です。
