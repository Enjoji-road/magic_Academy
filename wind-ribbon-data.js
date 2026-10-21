/* Material coordinates. This object is also read independently by verify.py. */
(function(root){
'use strict';
const DATA = {
  "version": 1,
  "stations": 1000,
  "geometry": {"straight": 600, "radius": 180, "halfWidth": 70, "taskY": -170, "shear": -0.86, "twistStart": 0.29, "twistEnd": 0.50},
  "supports": [
    {"min": [-525, -315, 45], "max": [-280, 65, 95]},
    {"min": [280, -315, 45], "max": [525, 65, 95]}
  ],
  "task": {"from": 20, "to": 235, "lines": ["創立記念帯の古い銘を台帳へ。", "星は書き出し、羽先は読む向き。", "留め結びまでを、織られたままに。"]},
  "start": {"station": 560, "edge": 1, "direction": 1},
  "stop": {"station": 490, "edge": 1},
  "glyphs": [
    {"id": "g0", "station": 660, "edge": 1, "text": "よ"},
    {"id": "g1", "station": 80, "edge": -1, "text": "あ"},
    {"id": "g2", "station": 190, "edge": -1, "text": "け"},
    {"id": "g3", "station": 355, "edge": -1, "text": "を"},
    {"id": "g4", "station": 690, "edge": -1, "text": "つ"},
    {"id": "g5", "station": 80, "edge": 1, "text": "ぐ"},
    {"id": "g6", "station": 190, "edge": 1, "text": "い"},
    {"id": "g7", "station": 430, "edge": 1, "text": "と"}
  ],
  "answerAliases": ["夜明けを継ぐ糸"],
  "views": {"front": [0, 0.12], "left": [-0.64, 0.20], "right": [0.64, 0.20], "low": [0.12, -0.68]},
  "winds": {"still": [0, 0, 0], "left": [-0.34, 0.28, 12], "right": [0.34, -0.30, -12], "up": [0.12, 0.52, 6]}
};
if(typeof module==='object'&&module.exports)module.exports=DATA;else root.WindRibbonData=DATA;
})(typeof globalThis!=='undefined'?globalThis:this);
