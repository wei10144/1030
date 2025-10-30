function setup() {

}


function draw() {
  background(220);
}

// 狀態變數
let quizState = 'QUIZ'; // 'QUIZ', 'RESULT', 'ANIMATION'

// 測驗變數
let questions; // 儲存 CSV 載入的 Table 物件
let currentQuestionIndex = 0;
let score = 0;
let selectedOption = -1; // -1: 未選, 0-3: 選項索引
let isCorrect = false;

// 特效變數
let cursorTrail = []; // 游標拖尾
let selectionEffectTimer = 0; // 選項選擇特效計時器
const EFFECT_DURATION = 30; // 特效持續幀數

// 動畫變數
let praiseMessage = "";
let particles = [];
let maxParticles = 50;

// 自定義顏色 (Hex #a98467 轉換為 HSB: H:28, S:23, B:66)
const QUESTION_COLOR_H = 28;
const QUESTION_COLOR_S = 23;
const QUESTION_COLOR_B = 66;

// 按鈕常數
const RESTART_BUTTON_WIDTH = 200;
const RESTART_BUTTON_HEIGHT = 60;
const RESTART_BUTTON_X = 400;
const RESTART_BUTTON_Y = 500;


// --- 預載入：載入 CSV 檔案 ---
function preload() {
  // 確保 'questions.csv' 檔案存在於專案資料夾中
  // 'header' 參數表示 CSV 第一行是標題
  questions = loadTable('questions.csv', 'csv', 'header');
}

// --- 設定 ---
function setup() {
  createCanvas(800, 600);
  // 設定文字對齊
  textAlign(CENTER, CENTER);
  // 使用 HSB 色彩模式 (色相, 飽和度, 亮度)
  colorMode(HSB, 360, 100, 100);
  // 禁用 p5.js 預設的滑鼠游標
  noCursor();
  
  // 關鍵修正：將矩形繪製模式設定為中心點對齊
  rectMode(CENTER); 
}

// --- 主要繪圖迴圈 ---
function draw() {
  background(220); // 淺灰色背景

  // 1. 處理游標拖尾特效
  drawCursorTrail();

  // 2. 根據狀態繪製畫面
  switch (quizState) {
    case 'QUIZ':
      drawQuizScreen();
      break;
    case 'RESULT':
      drawResultScreen();
      break;
    case 'ANIMATION':
      drawAnimationScreen();
      break;
  }
}

// --- 繪製游標拖尾特效 ---
function drawCursorTrail() {
  // 將當前滑鼠位置加入拖尾陣列
  cursorTrail.push(createVector(mouseX, mouseY));
  
  // 限制拖尾長度
  if (cursorTrail.length > 25) {
    cursorTrail.shift();
  }

  // 繪製拖尾
  noFill();
  for (let i = 0; i < cursorTrail.length; i++) {
    let pos = cursorTrail[i];
    // 拖尾顏色和透明度漸變
    let hu = map(i, 0, cursorTrail.length, 180, 240); // 顏色從藍綠到藍色
    let alpha = map(i, 0, cursorTrail.length, 0, 100);
    stroke(hu, 80, 90, alpha);
    strokeWeight(map(i, 0, cursorTrail.length, 1, 6));
    point(pos.x, pos.y);
  }
}

// --- 繪製測驗畫面 ---
function drawQuizScreen() {
  if (questions.getRowCount() === 0) {
    // 題庫未載入或為空
    fill(0);
    textSize(32);
    text("題庫載入失敗或為空！", width / 2, height / 2);
    return;
  }

  let row = questions.getRow(currentQuestionIndex);
  let questionText = row.getString("question");
  let options = [
    row.getString("optionA"),
    row.getString("optionB"),
    row.getString("optionC"),
    row.getString("optionD")
  ];

  // 顏色修改應用：第幾題 / 共幾題
  fill(QUESTION_COLOR_H, QUESTION_COLOR_S, QUESTION_COLOR_B);
  textSize(24);
  text(`第 ${currentQuestionIndex + 1} 題 / 共 ${questions.getRowCount()} 題`, width / 2, 50);
  
  // 顏色修改應用：題目文字
  fill(QUESTION_COLOR_H, QUESTION_COLOR_S, QUESTION_COLOR_B);
  textSize(32);
  text(questionText, width / 2, 150);

  // 繪製選項
  for (let i = 0; i < options.length; i++) {
    let x = width / 2; // 中心點 X
    let y = 250 + i * 80; // 中心點 Y
    let boxWidth = 400;
    let boxHeight = 60;

    // 判斷滑鼠是否在選項上方
    let isHover = mouseX > x - boxWidth / 2 && mouseX < x + boxWidth / 2 &&
                  mouseY > y - boxHeight / 2 && mouseY < y + boxHeight / 2;

    // 基礎樣式 (rectMode(CENTER) 使其置中)
    noStroke();
    // 選項格子顏色使用原本的配色
    fill(200, 50, isHover ? 90 : 80); 
    rect(x, y, boxWidth, boxHeight, 10);

    // 繪製選項文字 (使用黑色，與背景對比明顯)
    fill(0);
    textSize(20);
    text(options[i], x, y);

    // 繪製選項被選取時的特效 (選項特效)
    if (selectedOption === i && selectionEffectTimer > 0) {
      let effectAlpha = map(selectionEffectTimer, 0, EFFECT_DURATION, 0, 80);
      let effectSize = map(selectionEffectTimer, 0, EFFECT_DURATION, boxWidth * 1.1, boxWidth);
      
      // 根據答案正確與否決定特效顏色
      let effectColor = isCorrect ? color(120, 80, 80, effectAlpha) : color(0, 80, 80, effectAlpha);
      
      fill(effectColor);
      rect(x, y, effectSize, boxHeight * 1.1, 15);
      
      selectionEffectTimer--;
    }
  }
}

// --- 重置測驗狀態 ---
function resetQuiz() {
  currentQuestionIndex = 0;
  score = 0;
  selectedOption = -1;
  isCorrect = false;
  quizState = 'QUIZ';
}

// --- 滑鼠點擊事件 ---
function mousePressed() {
  if (quizState === 'QUIZ') {
    let row = questions.getRow(currentQuestionIndex);
    let options = [
      row.getString("optionA"), row.getString("optionB"),
      row.getString("optionC"), row.getString("optionD")
    ];
    let correct = row.getNum("correctAnswerIndex");

    // 檢查點擊了哪個選項框
    for (let i = 0; i < options.length; i++) {
      let x = width / 2;
      let y = 250 + i * 80;
      let boxWidth = 400;
      let boxHeight = 60;

      // 偵測點擊範圍
      if (mouseX > x - boxWidth / 2 && mouseX < x + boxWidth / 2 &&
          mouseY > y - boxHeight / 2 && mouseY < y + boxHeight / 2) {
        
        selectedOption = i;
        isCorrect = (i === correct);
        selectionEffectTimer = EFFECT_DURATION; // 啟動特效計時器

        if (isCorrect) {
          score++;
        }

        // 設置進入結果畫面的延遲
        setTimeout(() => {
          quizState = 'RESULT';
        }, 500); // 0.5 秒後進入結果畫面
        
        break;
      }
    }
  } else if (quizState === 'RESULT') {
    // 進入下一題或動畫
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.getRowCount()) {
      quizState = 'QUIZ';
      selectedOption = -1;
    } else {
      // 測驗結束，進入動畫階段
      setAnimationState();
      quizState = 'ANIMATION';
    }
  } else if (quizState === 'ANIMATION') {
    // *** 新增：檢查是否點擊了「重新開始」按鈕 ***
    if (mouseX > RESTART_BUTTON_X - RESTART_BUTTON_WIDTH / 2 && 
        mouseX < RESTART_BUTTON_X + RESTART_BUTTON_WIDTH / 2 &&
        mouseY > RESTART_BUTTON_Y - RESTART_BUTTON_HEIGHT / 2 && 
        mouseY < RESTART_BUTTON_Y + RESTART_BUTTON_HEIGHT / 2) {
      
      resetQuiz(); // 重置所有狀態
    }
  }
}

// --- 繪製單題結果畫面 ---
function drawResultScreen() {
  // 顯示剛才的選項結果 (正確/錯誤)
  let row = questions.getRow(currentQuestionIndex);
  let correctIndex = row.getNum("correctAnswerIndex");
  let correctOptionText = row.getString(`option${String.fromCharCode(65 + correctIndex)}`);

  textSize(40);
  if (isCorrect) {
    fill(120, 80, 80); // 綠色
    text("✅ 恭喜答對！", width / 2, height / 2 - 50);
  } else {
    fill(0, 80, 80); // 紅色
    text("❌ 答錯了！", width / 2, height / 2 - 50);
    textSize(24);
    fill(0);
    text(`正確答案是：${correctOptionText}`, width / 2, height / 2 + 20);
  }

  // 提示進入下一題
  textSize(24);
  fill(0, 0, 50);
  text("點擊滑鼠繼續...", width / 2, height - 100);
}

// --- 根據成績設置動畫狀態 ---
function setAnimationState() {
  let totalQuestions = questions.getRowCount();
  let percentage = score / totalQuestions;

  if (percentage === 1.0) {
    praiseMessage = "🎉 滿分！太棒了！ 🎉";
    maxParticles = 100; // 更多粒子，更華麗
  } else if (percentage >= 0.8) {
    praiseMessage = "🌟 成績優秀！你真棒！ 🌟";
    maxParticles = 70;
  } else if (percentage >= 0.6) {
    praiseMessage = "👍 表現不錯！繼續努力！ 👍";
    maxParticles = 40;
  } else {
    praiseMessage = "💪 沒關係！下次會更好！ 💪";
    maxParticles = 20;
  }
  
  // 初始化粒子
  particles = [];
  for (let i = 0; i < maxParticles; i++) {
    particles.push(new Particle());
  }
}

// --- 繪製動畫畫面 ---
function drawAnimationScreen() {
  // 測驗結束標題
  fill(QUESTION_COLOR_H, QUESTION_COLOR_S, QUESTION_COLOR_B);
  textSize(48);
  text("測驗結束！", width / 2, 80);
  
  // 總分顯示
  textSize(32);
  text(`總分：${score} / ${questions.getRowCount()}`, width / 2, 150);
  
  // 顯示稱讚或鼓勵訊息
  let flashHue = map(sin(frameCount * 0.1), -1, 1, 0, 360);
  fill(flashHue, 80, 90); 
  textSize(40);
  text(praiseMessage, width / 2, height / 2);

  // 繪製粒子動畫 (依據成績數量不同)
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.update();
    p.display();
    if (p.isFinished()) {
      particles.splice(i, 1);
      particles.push(new Particle());
    }
  }

  // *** 新增：繪製「重新開始」按鈕 ***
  
  // 判斷滑鼠是否在按鈕上
  let isButtonHover = mouseX > RESTART_BUTTON_X - RESTART_BUTTON_WIDTH / 2 && 
                      mouseX < RESTART_BUTTON_X + RESTART_BUTTON_WIDTH / 2 &&
                      mouseY > RESTART_BUTTON_Y - RESTART_BUTTON_HEIGHT / 2 && 
                      mouseY < RESTART_BUTTON_Y + RESTART_BUTTON_HEIGHT / 2;

  // 按鈕背景顏色
  fill(240, 70, isButtonHover ? 90 : 80); // 橙色系，Hover 時更亮
  noStroke();
  rect(RESTART_BUTTON_X, RESTART_BUTTON_Y, RESTART_BUTTON_WIDTH, RESTART_BUTTON_HEIGHT, 10);
  
  // 按鈕文字
  fill(0);
  textSize(24);
  text("↺ 重新開始", RESTART_BUTTON_X, RESTART_BUTTON_Y);
}

// --- 粒子類別 (用於動畫) ---
class Particle {
  constructor() {
    this.pos = createVector(random(width), height); // 從底部開始
    this.vel = createVector(random(-2, 2), random(-10, -5)); // 向上移動
    this.acc = createVector(0, 0.1); // 受重力影響
    this.lifespan = 255;
    this.hu = random(0, 360); // 隨機顏色
    this.size = random(5, 15);
  }

  update() {
    this.vel.add(this.acc);
    this.pos.add(this.vel);
    this.lifespan -= 5;
  }

  display() {
    noStroke();
    // 粒子的透明度隨生命週期減少
    let alpha = map(this.lifespan, 0, 255, 0, 100);
    fill(this.hu, 80, 90, alpha);
    ellipse(this.pos.x, this.pos.y, this.size);
  }

  isFinished() {
    return this.lifespan < 0;
  }
}