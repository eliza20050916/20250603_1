let video;
let handpose;
let predictions = [];
let dingSound, beepSound, tickingSound, congratsSound; // 新增恭喜音效變數
let congratsPlayed = false; // 防止恭喜音效重複播放
let bgmSound; // 背景音樂
let cornerImg; // 右下角圖片

// 題庫主題
const quizThemes = [
  {
    name: "讀教科系 未來職業有哪些?",
    pool: [
      { label: "數位學習設計師", isCorrect: true },
      { label: "教育訓練專員", isCorrect: true },
      { label: "警察", isCorrect: false },
      { label: "AR/VR 教育內容開發人員", isCorrect: true },
      { label: "寵物美容師", isCorrect: false },
      { label: "企業 LMS 系統管理員", isCorrect: true },
      { label: "建築師", isCorrect: false },
      { label: "EdTech 新創公司專員", isCorrect: true },
      { label: "海關", isCorrect: false },
      { label: "教育遊戲開發者", isCorrect: true },
      { label: "多媒體教材製作人員", isCorrect: true },
      { label: "工程師", isCorrect: true },
      { label: "教學顧問", isCorrect: true },
      { label: "美髮師", isCorrect: false },
      { label: "烘培師", isCorrect: false }
    ]
  },
  {
    name: "以下哪些為線上學習平台?",
    pool: [
      { label: "Iclass", isCorrect: true },
      { label: "Google Classroom", isCorrect: true },
      { label: "Lclass", isCorrect: false },
      { label: "Hahow", isCorrect: true },
      { label: "傳說對決", isCorrect: false },
      { label: "speak ai", isCorrect: true },
      { label: "抖音", isCorrect: false },
      { label: "AR", isCorrect: false },
      { label: "小紅書", isCorrect: false },
      { label: "Line", isCorrect: false }
    ]
  },
  {
    name: "以下哪些為正確資訊",
    pool: [
      { label: "慶帆老師很兇", isCorrect: false },
      { label: "考前一刻背書", isCorrect: false },
      { label: "慶帆老師很帥", isCorrect: true },
      { label: "慶帆老師很有耐心", isCorrect: true },
      { label: "AI可以幫助我們學習", isCorrect: true },
      { label: "淡江教科超棒", isCorrect: true },
      { label: "偷偷翹課很好", isCorrect: false },
      { label: "認真上課", isCorrect: true }
    ]
  }
];
let currentLevel = 0;
let maxLevel = quizThemes.length;
let quizPool = quizThemes[currentLevel].pool;
let levelName = quizThemes[currentLevel].name;

let bubbles = [];
let score = 0;
let smileCount = 0;
let roundScore = 0;
let timer = 30; // 秒
let timerStart = 0;
let gameOver = false;
let waitingNextLevel = false;

function preload() {
  soundFormats('mp3', 'wav');
  dingSound = loadSound('libraries/ding.mp3');
  beepSound = loadSound('libraries/beep.mp3');
  tickingSound = loadSound('libraries/ticking.mp3'); // 載入時鐘音效
  congratsSound = loadSound('libraries/congratsSound.mp3'); // 修正檔名
  bgmSound = loadSound('libraries/cort_infantilmascotasanimada1_dm-248981.mp3'); // 載入背景音樂
  cornerImg = loadImage('libraries/S__290045961.jpg'); // 載入右下角圖片
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  video = createCapture(VIDEO);
  video.size(640, 480); // 保持鏡頭大小及比例
  video.style('transform', 'scale(-1, 1)'); // 水平翻轉鏡頭
  video.hide();

  handpose = ml5.handpose(video, modelReady);
  handpose.on("predict", results => {
    predictions = results;
  });

  currentLevel = 0;
  quizPool = quizThemes[currentLevel].pool;
  levelName = quizThemes[currentLevel].name;
  generateBubbles();
  timerStart = millis();
  gameOver = false;

  if (bgmSound) {
    bgmSound.setVolume(0.4); // 可依需求調整音量
    bgmSound.loop();
  }
}

function modelReady() {
  console.log("Handpose model loaded!");
}

function draw() {
  background(240);
  const scaleFactor = 1.2; // 放大比例
  const videoWidth = video.width * scaleFactor;
  const videoHeight = video.height * scaleFactor;
  const xOffset = (width - videoWidth) / 2;
  const yOffset = (height - videoHeight) / 2;

  push();
  translate(width, 0); // 翻轉畫布
  scale(-1, 1); // 水平翻轉
  image(video, width - xOffset - videoWidth, yOffset, videoWidth, videoHeight);
  pop();

  drawKeypoints();

  // 顯示分數
  fill(0);
  textSize(32);
  textAlign(LEFT, TOP);
  text("分數: " + score, 20, 20);

  // 顯示笑臉符號
  fill(0);
  textSize(40);
  textAlign(LEFT, TOP);
  let smiles = "";
  for (let i = 0; i < smileCount; i++) {
    smiles += "😊";
  }
  text(smiles, 20, 60);

  // 顯示主題名稱（加長框、半透明背景，框不擋字）
  let titleText = "主題：" + levelName;
  textSize(28);
  textAlign(CENTER, CENTER); // 垂直置中
  textStyle(BOLD);
  let tw = textWidth(titleText) + 120; // 框寬加長
  let th = 48; // 框高
  let tx = width/2 - tw/2;
  let ty = 12;
  // 先畫框
  noStroke();
  fill('#fdf0d5cc'); // 半透明背景
  rect(tx, ty, tw, th, 16);
  stroke('#003049');
  strokeWeight(3);
  noFill();
  rect(tx, ty, tw, th, 16);
  // 再畫字，垂直置中
  noStroke();
  fill('#003049');
  text(titleText, width/2, ty + th/2 + 1);
  textStyle(NORMAL);

  // 顯示倒數計時（右上角）
  if (!gameOver && !waitingNextLevel) {
    let elapsed = floor((millis() - timerStart) / 1000);
    let timeLeft = max(0, timer - elapsed);
    // 控制時鐘音效播放/停止
    if (timeLeft > 0 && !tickingSound.isPlaying()) {
      tickingSound.loop();
    }
    if ((timeLeft <= 0 || roundScore >= 3) && tickingSound.isPlaying()) {
      tickingSound.stop();
    }
    fill(0);
    textSize(22); // 縮小剩餘時間字體
    textAlign(RIGHT, TOP);
    text("剩餘時間: " + timeLeft + " 秒⏰", width - 20, 20);
    if (roundScore >= 3) {
      // 過關，進入下一關
      smileCount++;
      waitingNextLevel = true;
      setTimeout(() => {
        if (currentLevel < maxLevel - 1) {
          currentLevel++;
          quizPool = quizThemes[currentLevel].pool;
          levelName = quizThemes[currentLevel].name;
          generateBubbles();
          timerStart = millis();
          roundScore = 0;
          waitingNextLevel = false;
        } else {
          gameOver = true;
        }
      }, 1200); // 1.2秒後自動進入下一關
    } else if (timeLeft <= 0) {
      // 失敗
      gameOver = true;
      waitingNextLevel = false;
    }
  // } else if (waitingNextLevel) {
  //   fill(0, 180, 0);
  //   textSize(48);
  //   textAlign(CENTER, CENTER);
  //   text("過關！", width/2, height/2);
  //   return;
  } else if (gameOver) {
    if (tickingSound && tickingSound.isPlaying()) tickingSound.stop(); // 結束時確保停止
    if (smileCount === maxLevel) {
      if (congratsSound && !congratsPlayed) {
        congratsSound.play();
        congratsPlayed = true;
      }
      // 恭喜遊戲過關主標題
      textSize(48);
      textStyle(BOLD);
      stroke('#14213d');
      strokeWeight(5);
      fill('#fca311');
      text("恭喜遊戲過關", width/2, height/2 - 40);
      // 副標題同樣橘色加粗描邊
      textSize(36);
      textStyle(BOLD);
      stroke('#14213d');
      strokeWeight(4);
      fill('#fca311');
      text("你是教育科技超人🦸🫵！", width/2, height/2 + 30);
      noStroke();
      textStyle(NORMAL);
    } else {
      fill(200,0,0);
      textSize(48);
      text("闖關失敗", width/2, height/2);
    }
    return;
  } else {
    congratsPlayed = false; // 只要不是結束畫面就重設
  }

  // 顯示所有泡泡
  for (let i = bubbles.length - 1; i >= 0; i--) {
    bubbles[i].move();
    bubbles[i].show();
  }

  // 檢查碰撞
  checkBubbleCollision();

  // 畫面右下角顯示圖片（放大）
  if (cornerImg) {
    let imgW = 200; // 放大寬度
    let imgH = cornerImg.height * (imgW / cornerImg.width);
    image(cornerImg, width - imgW - 20, height - imgH - 20, imgW, imgH);
  }

  // 左下角顯示 TKUET 標誌文字
  fill('#003049');
  textSize(32);
  textAlign(LEFT, BOTTOM);
  textStyle(BOLD);
  text('TKUET👣', 24, height - 24);
  textStyle(NORMAL);
}

function drawKeypoints() {
  const scaleFactor = 1.2; // 放大比例
  const videoWidth = video.width * scaleFactor;
  const videoHeight = video.height * scaleFactor;
  const xOffset = (width - videoWidth) / 2;
  const yOffset = (height - videoHeight) / 2;

  for (let i = 0; i < predictions.length; i++) {
    const prediction = predictions[i];
    const indexTip = prediction.landmarks[8]; // 食指末端

    const [x, y, z] = indexTip;
    const adjustedX = width - (x * scaleFactor + xOffset); // 修正水平翻轉
    const adjustedY = y * scaleFactor + yOffset;
    fill(0, 255, 0);
    noStroke();
    ellipse(adjustedX, adjustedY, 10, 10);
  }
}

function checkBubbleCollision() {
  if (gameOver || waitingNextLevel) return;
  if (predictions.length === 0) return;
  const indexTip = predictions[0].landmarks[8];
  const scaleFactor = 1.2;
  const videoWidth = video.width * scaleFactor;
  const videoHeight = video.height * scaleFactor;
  const xOffset = (width - videoWidth) / 2;
  const yOffset = (height - videoHeight) / 2;
  // 將 indexTip 轉換到(640,480)區域座標
  let offsetX = (width - 640) / 2;
  let offsetY = (height - 480) / 2;
  const x = width - (indexTip[0] * scaleFactor + xOffset) - offsetX;
  const y = indexTip[1] * scaleFactor + yOffset - offsetY;

  for (let i = bubbles.length - 1; i >= 0; i--) {
    let b = bubbles[i];
    let d = dist(x, y, b.x, b.y);
    if (d < b.r) {
      if (b.isCorrect) {
        score += 1;
        roundScore += 1;
        b.flashColor = color(0, 255, 0, 180);
        if (dingSound) dingSound.play();
      } else {
        // 答錯不扣分
        b.flashColor = color(255, 0, 0, 180);
        if (beepSound) beepSound.play();
      }
      b.flashFrame = frameCount;
      bubbles.splice(i, 1);
      break;
    }
  }
  // 若泡泡都消失，自動再產生一輪
  if (bubbles.length === 0) {
    generateBubbles();
  }
  // 如果只剩一顆泡泡，補上一顆正確答案泡泡
  if (bubbles.length === 1) {
    // 選一個還沒出現過的正確答案
    let usedLabels = bubbles.map(b => b.label);
    let candidates = quizPool.filter(q => q.isCorrect && !usedLabels.includes(q.label));
    let q;
    if (candidates.length > 0) {
      q = random(candidates);
    } else {
      // 若都出現過，隨機選一個正確答案
      let corrects = quizPool.filter(q => q.isCorrect);
      q = random(corrects);
    }
    let r = random(50, 80);
    let tries = 0, maxTries = 100, x, y, valid = false;
    while (!valid && tries < maxTries) {
      x = random(r, 640 - r);
      y = random(r, 480 - r);
      valid = true;
      for (let b of bubbles) {
        let minDist = (r + b.r) * 1.1;
        if (dist(x, y, b.x, b.y) < minDist) {
          valid = false;
          break;
        }
      }
      tries++;
    }
    if (valid) {
      bubbles.push(new Bubble(x, y, r, q.label, true));
    }
  }
}

function mousePressed() {
  if (gameOver || waitingNextLevel) return;
  // 將滑鼠座標轉換到(640,480)區域
  let offsetX = (width - 640) / 2;
  let offsetY = (height - 480) / 2;
  let mx = mouseX - offsetX;
  let my = mouseY - offsetY;
  for (let i = bubbles.length - 1; i >= 0; i--) {
    let b = bubbles[i];
    let d = dist(mx, my, b.x, b.y);
    if (d < b.r) {
      if (b.isCorrect) {
        score += 1;
        if (dingSound) dingSound.play();
      } else {
        // 答錯不扣分
        if (beepSound) beepSound.play();
      }
      bubbles.splice(i, 1);
      break;
    }
  }
  // 若泡泡都消失，自動再產生一輪
  if (bubbles.length === 0) {
    generateBubbles();
  }
}

// Bubble 類別：知識泡泡
class Bubble {
  constructor(x, y, r, label, isCorrect) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.label = label;
    this.isCorrect = isCorrect;
    // 隨機速度與方向
    this.vx = random(-2, 2);
    this.vy = random(-2, 2);
    this.noiseSeed = random(1000);
    this.flashColor = null;
    this.flashFrame = 0;
  }

  move() {
    // 使用 Perlin noise 產生不規則移動
    let t = millis() * 0.0005 + this.noiseSeed;
    this.vx += map(noise(t, this.noiseSeed), 0, 1, -0.05, 0.05);
    this.vy += map(noise(t + 100, this.noiseSeed), 0, 1, -0.05, 0.05);
    this.vx = constrain(this.vx, -2, 2);
    this.vy = constrain(this.vy, -2, 2);
    this.x += this.vx;
    this.y += this.vy;
    // 邊界反彈 (限制在 640x480 內)
    if (this.x - this.r < 0) {
      this.x = this.r;
      this.vx *= -1;
    }
    if (this.x + this.r > 640) {
      this.x = 640 - this.r;
      this.vx *= -1;
    }
    if (this.y - this.r < 0) {
      this.y = this.r;
      this.vy *= -1;
    }
    if (this.y + this.r > 480) {
      this.y = 480 - this.r;
      this.vy *= -1;
    }
  }

  show() {
    // 將(640,480)區域置中顯示在畫布
    let offsetX = (width - 640) / 2;
    let offsetY = (height - 480) / 2;
    if (this.flashColor && frameCount - this.flashFrame < 8) {
      fill(this.flashColor);
    } else {
      fill(255, 200, 100, 220);
    }
    stroke(180, 120, 50);
    strokeWeight(2);
    ellipse(this.x + offsetX, this.y + offsetY, this.r * 2, this.r * 2);
    fill(50);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(this.r * 0.6);
    text(this.label, this.x + offsetX, this.y + offsetY);
  }
}

function generateBubbles() {
  bubbles = [];
  let selected = [];
  let maxTries = 100;
  while (selected.length < 5) {
    let idx = floor(random(quizPool.length));
    if (!selected.includes(idx)) {
      let q = quizPool[idx];
      let r = random(50, 80);
      let tries = 0;
      let valid = false;
      let x, y;
      while (!valid && tries < maxTries) {
        x = random(r, 640 - r);
        y = random(r, 480 - r);
        valid = true;
        for (let b of bubbles) {
          let minDist = (r + b.r) * 1.1; // 1.1 倍半徑和，避免重疊
          if (dist(x, y, b.x, b.y) < minDist) {
            valid = false;
            break;
          }
        }
        tries++;
      }
      if (valid) {
        selected.push(idx);
        bubbles.push(new Bubble(x, y, r, q.label, q.isCorrect));
      }
    }
  }
}