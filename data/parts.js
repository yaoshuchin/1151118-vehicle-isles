// 零件知識庫（原創撰寫）。id 對應 js/models.js 的零件群組。
// order＝組裝順序（由內而外）；works＝油門運轉時「正在工作」會被強調的零件。
export const PARTS = {
  drone: {
    order: ['frame', 'motor', 'esc', 'fc', 'rx', 'battery', 'prop', 'led', 'cage'],
    works: ['prop', 'motor', 'esc'],
    list: {
      cage: { name: '保護球籠', en: 'Protective cage', role: '把整台無人機包成一顆球，碰撞時保護螺旋槳與人。', how: '由多個圓環組成的球形骨架，撞擊力分散到整個籠子。無人機足球正是靠球籠才能互相碰撞。', tip: '球籠變形會讓重心偏移，賽前要檢查每個圓環是否完整。' },
      frame: { name: '機架', en: 'Frame', role: '所有零件的骨架，四支機臂撐起四顆馬達。', how: '常用碳纖維板，輕又硬。機臂長度決定螺旋槳大小與軸距。', tip: '機架鬆動會產生震動，飛控會誤判姿態。' },
      motor: { name: '無刷馬達', en: 'Brushless motor', role: '把電能變成旋轉，帶動螺旋槳。', how: 'KV 值＝每 1 伏特空轉每分鐘轉幾圈。本機 5000 KV × 7.4 V，有負載時約 29,600 rpm。', tip: '對角兩顆同向、相鄰兩顆反向，扭力才會互相抵銷。' },
      prop: { name: '螺旋槳', en: 'Propeller', role: '把空氣往下推，產生向上的推力。', how: '推力大約和轉速的平方成正比：轉速加倍，推力約變四倍。', tip: '槳有正反之分，裝錯方向會原地翻機。' },
      fc: { name: '飛行控制器', en: 'Flight controller', role: '無人機的大腦，每秒上千次調整四顆馬達。', how: '內含陀螺儀與加速度計，用 PID 控制修正傾斜，讓機身保持平衡。', tip: '開機前要放平校正，不然會一直往一邊飄。' },
      esc: { name: '電子調速器', en: 'ESC', role: '依飛控指令調整送給馬達的電流。', how: '用快速開關（PWM）控制三相電流，讓無刷馬達依序通電轉動。', tip: '電調過熱代表負載太大或槳太大。' },
      battery: { name: '鋰聚合物電池', en: 'LiPo battery', role: '提供動力，2S＝兩顆電芯串聯，約 7.4 V。', how: '容量 450 mAh；電流越大，可飛時間越短。', tip: '單顆電芯不要放電低於 3.5 V，鼓包就停用。' },
      rx: { name: '接收機', en: 'Receiver', role: '接收遙控器訊號，轉給飛控。', how: '常用 2.4 GHz 頻段，天線要露出、避免被碳纖維遮擋。', tip: '飛行前一定要做失控保護（Failsafe）測試。' },
      led: { name: '隊伍燈', en: 'Team LED', role: '用顏色標示隊伍與攻擊手。', how: '比賽中觀眾與裁判靠燈色和彩帶辨識誰能得分。', tip: '燈色要和隊伍一致，避免誤判。' }
    }
  },
  robot: {
    order: ['torso', 'imu', 'battery', 'servo', 'leg', 'foot', 'arm', 'fist', 'head', 'armor', 'estop'],
    works: ['servo', 'arm', 'fist', 'leg'],
    list: {
      torso: { name: '軀幹與主控板', en: 'Torso & controller', role: '機器人的身體中心，裝主控板，連接手腳與頭。', how: '主控板每秒數百次讀取感測器、計算每個關節該轉幾度，再送指令給伺服馬達。', tip: '軀幹越重、重心越高，越容易被打倒。' },
      imu: { name: '慣性感測器 IMU', en: 'IMU (gyro + accelerometer)', role: '感覺身體正在往哪邊倒，是「平衡感」的來源。', how: '陀螺儀量轉動速度、加速度計量傾斜；主控板依據它調整腳踝與髖關節來站穩。', tip: '被打到時 IMU 偵測傾斜，機器人會自動踏一步穩住。' },
      battery: { name: '電池', en: 'Battery', role: '供應所有關節馬達的電力。', how: '桌上型多用 2S 鋰電（約 7.4 V）；全尺寸人形多用 48 V 以上的大電池組。', tip: '格鬥時撞擊頻繁，電池要用防撞泡棉固定；鼓包立刻停用。' },
      servo: { name: '伺服馬達（關節）', en: 'Servo / joint actuator', role: '每個關節一顆，負責轉到指定角度。', how: '伺服＝馬達＋減速齒輪＋角度感測器＋控制電路。規格看「扭力（kg·cm）」與「速度（秒／60°）」。', tip: '連續出拳會讓伺服發燙，扭力下降，比賽間要散熱。' },
      leg: { name: '腿部連桿', en: 'Legs', role: '支撐全身、走路、踢腿。', how: '髖、膝、踝三個關節；膝蓋微彎可以降低重心、吸收衝擊。', tip: '站姿太直很容易被一拳打倒。' },
      foot: { name: '腳掌', en: 'Feet', role: '和地面接觸的面積，決定站得穩不穩。', how: '重心投影要落在兩腳圍出的「支撐多邊形」內才不會倒；腳掌越大越穩，但走路越笨重。', tip: '最大傾斜角 ≈ atan(腳掌半寬 ÷ 重心高度)。' },
      arm: { name: '手臂', en: 'Arms', role: '出拳與格擋。', how: '拳頭速度 = 肩關節角速度 × 手臂長；手臂越長，同樣角速度下拳越快、打得越遠。', tip: '手臂太長太重，會讓重心偏前，反而容易失衡。' },
      fist: { name: '拳頭／拳套', en: 'Fists', role: '真正打到對手的部位。', how: '出拳動能 = ½ × 拳頭等效質量 × 速度²。拳擊人形會戴緩衝拳套保護雙方。', tip: '拳套能降低損壞，但也會減少打擊力。' },
      head: { name: '頭部感測器', en: 'Head sensors', role: '攝影機或距離感測器，看對手在哪裡。', how: '桌上型多半由人遙控；全尺寸人形會用攝影機與深度感測器自動追蹤對手。', tip: '頭部被擊中是很多賽事的有效得分部位。' },
      armor: { name: '外殼裝甲', en: 'Armor shell', role: '保護內部電子零件與關節線材。', how: '常用鋁板、碳纖維或工程塑膠；裝甲越厚越耐打，但越重越慢。', tip: '重裝泰坦打得重，就是用速度換來的。' },
      estop: { name: '緊急停止鈕', en: 'Emergency stop', role: '按下就切斷馬達電源，是人形機器人的安全標配。', how: '格鬥前後、搬運、維修時都要能在一秒內按到。', tip: '全尺寸人形摔倒時力量很大，場邊人員一定要知道 E-stop 在哪。' }
    }
  },
  boat: {
    order: ['hull', 'motor', 'shaft', 'prop', 'rudder', 'esc', 'battery', 'cooling', 'foil', 'canopy', 'sensor'],
    works: ['prop', 'motor', 'shaft', 'foil'],
    list: {
      hull: { name: '船殼', en: 'Hull', role: '提供浮力，決定船怎麼「吃水」與轉彎。', how: 'V 底劈開水面，高速時抬起滑行；雙體船兩個船身，穩定好轉；水翼船靠水翼把船身抬出水。', tip: '每次下水前檢查船殼有沒有裂縫進水。' },
      canopy: { name: '上層結構', en: 'Superstructure', role: '稜角外型的艙室，蓋住電子艙並承載感測器。', how: '傾斜的多面外型可以減少雷達反射（隱身設計），也讓浪花順著斜面滑掉。', tip: '接縫要密封，翻覆或大浪時電子艙才不會進水。' },
      sensor: { name: '感測桅桿', en: 'Sensor mast', role: '無人船的眼睛與耳朵：雷達罩、光電攝影機、通訊天線、航行燈。', how: '雷達看遠方船隻、攝影機辨識目標、天線把影像與 GPS 位置傳回岸上；紅綠航行燈告訴別的船你的方向（左紅右綠）。', tip: '桅桿越高看得越遠，但重心變高、比較容易翻。' },
      motor: { name: '無刷馬達', en: 'Brushless motor', role: '高轉速動力來源。', how: '2800 KV × 11.1 V，有負載約 26,400 rpm。', tip: '船用馬達要水冷，空轉太久會過熱。' },
      shaft: { name: '軟軸傳動', en: 'Flex shaft', role: '把馬達的轉動穿過船底傳到螺旋槳。', how: '鋼索軟軸可以小角度彎曲，要定期上油。', tip: '缺油會磨損發熱，甚至斷軸。' },
      prop: { name: '螺旋槳', en: 'Propeller', role: '把旋轉變成推進。', how: '螺距＝轉一圈理論上前進的距離。實際會「滑脫」一部分，所以真實速度比理論低。', tip: '槳葉碰到浮標或岸邊會變形，要隨身帶備用槳。' },
      rudder: { name: '舵與舵機', en: 'Rudder & servo', role: '改變水流方向讓船轉彎。', how: '舵機把遙控訊號變成舵的角度；舵通常也兼當水冷進水口。', tip: '轉彎時先收油再打舵，比較不會翻船。' },
      battery: { name: '電池', en: 'Battery', role: '3S 鋰電池（約 11.1 V）。', how: '放在船身中段，位置前後移動會改變船首抬起的角度。', tip: '電池用魔鬼氈加束帶固定，高速撞浪才不會滑動。' },
      esc: { name: '電調與接收機', en: 'ESC & Receiver', role: '控制馬達電流與接收指令。', how: '船用電調常有水冷板與防水處理。', tip: '接收機放在防水盒裡，天線管朝上。' },
      cooling: { name: '水冷管路', en: 'Water cooling', role: '前進時把湖水導進來冷卻馬達與電調。', how: '舵上的進水口 → 電調水冷板 → 馬達水套 → 船側出水口。看到出水口有水柱，代表冷卻正常。', tip: '出水口沒有水就要立刻收船檢查。' },
      foil: { name: '水翼', en: 'Hydrofoil', role: '像水裡的機翼，速度夠時產生升力把船身抬出水面。', how: '升力＝½ × 水密度 × 速度² × 面積 × 升力係數；本機約 3 m/s 起飛。', tip: '水翼碰到雜草或浮標很容易彎，下水前要對齊。' }
    }
  }
};

// 「點出這個零件」小測驗：從零件清單隨機出題
export function quizPool(type, variant) {
  const P = PARTS[type];
  return P.order.filter(id => P.list[id] && !(id === 'foil' && variant !== 'foil')).map(id => ({ id, q: P.list[id].role }));
}
