// 島嶼倒數設定檔：換課程只改這個檔（其他檔案都不用動）
// 技能：D:\skills\island-countdown-web（安裝：python install.py <網站資料夾> --course "課名"）
window.ISLAND_CONFIG = {
  // 課程時間（台灣時間）：只給「下課」按鈕用（按了才倒數到這堂課下課）；一進來不自動倒數
  sessions: [
    {"name": "無人機篇", "start": "2026-11-18T19:00:00+08:00", "end": "2026-11-18T22:00:00+08:00"},
  ],
  doneText: '課程已圓滿結束，感謝參與！',

  // 計時按鈕（分鐘）；另有「自訂」可輸入任意分秒
  presets: [3, 5, 10],
  timerLabel: '休息／練習倒數',
  endText: '時間到！',
  classEndText: '下課囉！',
  idleText: '',

  // 背景音樂：一進來就循環播放；底下 🎵 可暫停、🔇 全部靜音（老師的選擇會記住）。不要背景音樂就把 bgm 設成 ''
  bgm: 'sounds/bgm.mp3', bgmVolume: 0.4,

  // 篇章立體按鈕（每次都要有）：左邊第一組、右邊第二組；href 是相對網站根目錄的網址，沒有 href＝顯示「製作中」
  // base：本頁到網站根目錄的相對路徑（放在 網站/assets/island/ 就是 '../../'）
  chapters: {
    base: '../../',
    groups: [
      { name: '無人機篇｜今晚上課', items: [
        { icon: '🚁', label: 'U01 種類', title: '無人機有哪些種類', href: 'course/?d=DR&u=U01' },
        { icon: '🔩', label: 'U02 機構解說', title: '機構解說：骨架、動力、航電', href: 'course/?d=DR&u=U02' },
        { icon: '🎮', label: 'U03 飛行原理', title: '飛行原理與操控（混控模擬）', href: 'course/?d=DR&u=U03' },
        { icon: '⚽', label: 'U04 競賽說明', title: '競賽說明：無人機足球與 FPV 競速', href: 'course/?d=DR&u=U04' },
        { icon: '🧊', label: 'U05 3D 建模', title: '平台 3D 建模：六步生成器', href: 'course/?d=DR&u=U05' },
        { icon: '🛠', label: 'U06 故障診斷', title: '故障診斷與賽前檢查＋交給 AI 建置', href: 'course/?d=DR&u=U06' },
      ] },
      { name: '其他篇章與平台', items: [
        { icon: '🥊', label: '人形格鬥機器人篇', title: '人形格鬥機器人篇 3D 建模實作', href: 'course/?d=RB' },
        { icon: '🚤', label: '水上無人船篇', title: '水上無人船篇 3D 建模實作', href: 'course/?d=BT' },
        { icon: '🧪', label: '3D 建模台', title: '共用 3D 建模台（拆解、標籤、下載 GLB）', href: 'lab.html?k=drone' },
        { icon: '🏝', label: '競技群島', title: '示範成品島：車庫、博物館、競技場', href: 'hub.html' },
        { icon: '🏗', label: '載具島工坊', title: '把載具放上 3D 島嶼', href: 'https://aliang-vehicle-forge.netlify.app' },
      ] },
    ],
  },

  // 島嶼外觀：theme 可用 spring／beach／autumn／sakura／snow／night；spin＝旋轉速度（0 不轉）
  theme: 'beach', spin: 0.35, clouds: true, waterfall: true, plaza: true,

  // 人物（chars 資料夾裡的去背立牌 .webp/.png）；anim 一律 'none'＝人不晃
  // x、z：島上位置（-1.9～1.9）；scale：大小
  chars: [
    { src: 'chars/A_m_suit.webp', x: 0, z: 0.35, scale: 1.05 },     // 阿亮・西裝
    { src: 'chars/A_f_gown.webp', x: -0.95, z: 0.05 },              // 紅色禮服
    { src: 'chars/A_f_fitness.webp', x: 0.95, z: 0.05 },            // 健身
    { src: 'chars/A_f_bikini.webp', x: 0, z: -0.75 },               // 比基尼
  ],
  // 裝飾：pine sakura palm flowers bush rock mushroom house hut lamp bench umbrella lounger campfire windmill flag chest balloon star sign
  decor: [
    { kind: 'palm', x: -1.45, z: -0.9, scale: 1.1 },
    { kind: 'palm', x: 1.5, z: -0.8, rot: 40, scale: 0.95 },
    { kind: 'flowers', x: -1.35, z: 0.85 },
    { kind: 'balloon', x: 1.3, z: 0.9 },
    { kind: 'hut', x: -0.3, z: -1.5 },
  ],
};
