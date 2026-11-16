# AGENTS.md

# Project: 今晚玩什麼？Party Game Collection（喝酒聚會小遊戲資料庫）

> **致 AI 協作者**：這份文件是本專案的唯一開發規範（Single Source of Truth）。在新增遊戲、修改頁面、調整樣式或擴充功能前，請先完整閱讀並嚴格遵守以下所有規範，確保專案能以一致的結構持續擴充。

---

## 1. Project Overview（專案總覽）

### 1.1 專案目的
本專案是一個專為朋友聚會、派對與酒局設計的**可擴充式互動小遊戲資料庫**（Party Game Collection），目前收錄 50 款經典與熱門聚會遊戲。網站協助聚會參與者在幾秒內依現場人數、分類或隨機抽選找到適合當下氣氛的遊戲，並提供清楚的規則與操作步驟。

### 1.2 核心理念
- **聚會樂趣優先，飲酒非強制**：喝酒只是聚會情境之一，所有遊戲皆不得強迫飲酒。每款遊戲均須提供「喝水、飲料、真心話、才藝或小懲罰」等無酒精替代方案。
- **即開即玩、零準備門檻**：資訊呈現須讓第一次接觸該遊戲的玩家在 30 秒內看懂並開始遊玩。
- **資料驅動與可持續擴充**：所有遊戲資料集中於 `js/games.js`，首頁卡片、人數自動推薦、分類篩選、關鍵字搜尋與隨機抽遊戲皆由資料自動渲染；獨立詳細頁則遵循固定 HTML 模板，讓 AI 能快速產生第 51、52 款遊戲頁面。

### 1.3 核心功能
1. **首頁探索、人數與手邊工具自動推薦 (`index.html`, `js/filter.js`)**：網站主視覺、專案簡介、**聚會人數與手邊工具選擇器**（支援同時選取人數與撲克牌、骰子、零道具、手機、紙筆等工具，自動跳出推薦遊戲抽屜）、六大分類入口、人氣遊戲推薦、全部 50 款遊戲資料庫。
2. **分類與搜尋 (`js/filter.js`)**：依六大分類篩選、依人數與道具過濾、關鍵字搜尋（支援中文名稱、英文名稱、道具與簡介）、僅顯示已收藏遊戲。
3. **隨機抽遊戲 (`js/random.js`)**：點擊「不知道玩什麼？」隨機抽取一款遊戲，於彈窗中顯示遊戲名稱、人數、時間、道具、**開始方式（第一步）**與詳細頁連結，並支援「再抽一款」。
4. **收藏功能 (`js/main.js`)**：使用瀏覽器 `localStorage`（key: `pgc_favorites`）保存使用者收藏的遊戲 ID，並即時同步收藏數量徽章。
5. **派對倒數計時器 (`js/main.js`)**：內建可調式倒數計時器（5 秒 / 15 秒 / 30 秒 / 60 秒 / 3 分鐘），支援比手畫腳、五秒定律、大家來找碴等限時遊戲。
6. **遊戲詳細介紹頁 (`pages/games/*.html`)** 與 **分類總覽頁 (`pages/categories/*.html`)**。

---

## 2. Visual Design System（視覺設計規範）

### 2.1 整體風格
採用 **現代編輯風格（Modern Editorial Style）**：深色夜聚氛圍底色搭配溫潤奶油白文字與低飽和暖色點綴，強調清晰的層級、充足的留白與卡片一致性，避免過度閃爍或雜亂的動畫。

### 2.2 Design Tokens（CSS 變數）
所有樣式必須使用 `css/style.css` 中定義的 `:root` 變數，禁止在個別頁面寫死自訂色碼：

```css
:root {
  --bg-primary: #11100f;        /* 主背景：深夜炭黑 */
  --bg-surface: #1b1917;        /* 卡片與區塊底色 */
  --bg-elevated: #24211e;       /* 懸浮與互動元件底色 */
  --border-subtle: #2f2b27;     /* 細邊框 */
  --text-primary: #f4efe6;      /* 主文字：溫潤奶油白 (Warm Cream) */
  --text-secondary: #b8b0a4;    /* 次要說明文字 */
  --text-muted: #857e73;        /* 標籤與輔助資訊 */
  --accent-primary: #e07a5f;    /* 主強調色：暖陶土橘 */
  --accent-secondary: #d4a373;  /* 次強調色：琥珀金 */
  --accent-soft: rgba(224, 122, 95, 0.14);
}
```

### 2.3 字體與排版
- **中文內文與標題**：`'Noto Sans TC', -apple-system, BlinkMacSystemFont, sans-serif`
- **英文副標與編號**：`'Playfair Display', Georgia, serif`
- **響應式斷點**：
  - 手機版：`< 768px`（單欄卡片）
  - 平板版：`768px – 1023px`（雙欄卡片）
  - 桌機版：`>= 1024px`（三欄卡片，最大容器寬度 `1160px`）

---

## 3. Directory & File Naming Rules（資料夾結構與命名規範）

### 3.1 專案目錄結構
```text
party-game-collection/
├── AGENTS.md                   # 本專案開發規範文件
├── README.md                   # 專案說明與部署指南
├── index.html                  # 首頁（人數與工具推薦、探索、篩選、抽籤、計時器）
├── host.html                   # Party Host 派對主持人模式控制台
├── assets/
│   └── icons/                  # 網站 SVG 圖示與 favicon
├── css/
│   ├── style.css               # 全站共用設計系統與首頁樣式
│   ├── game-detail.css         # 遊戲詳細頁與分類頁專用樣式
│   └── host.css                # 派對主持人模式專用樣式
├── js/
│   ├── games.js                # 50 款遊戲與 6 大分類資料庫（Single Source of Truth）
│   ├── main.js                 # 共用 UI、收藏功能、倒數計時器
│   ├── filter.js               # 頂部人數與手邊工具自動推薦、分類篩選與搜尋
│   ├── random.js               # 隨機抽遊戲模組
│   ├── host-data.js            # 主持人模式題庫、任務庫、比手畫腳與誰是臥底詞庫
│   └── host.js                 # 主持人模式玩家管理、專屬遊戲控制台與計時器邏輯
└── pages/
    ├── games/                  # 各款遊戲詳細頁（每款一個 HTML，共 50 頁）
    └── categories/             # 六大分類頁（每個分類一個 HTML，共 6 頁）
```

### 3.2 檔案命名規則
- **一律使用小寫英文 + 連字號（kebab-case）**，禁止使用中文檔名、空白或底線。
- 遊戲頁面檔名必須與 `js/games.js` 中的 `id` 完全一致，並放置於 `pages/games/<id>.html`。
- **路徑規範（GitHub Pages 相容性）**：所有內部連結與資源引用**一律使用相對路徑**，禁止使用 `/` 開頭的根目錄絕對路徑。

---

## 4. Data Schema (`js/games.js`)（遊戲資料結構規範）

所有遊戲資料必須統一註冊在 `js/games.js` 的 `GAMES_DATA` 陣列中。新增遊戲時，必須完整填寫以下欄位，不得缺漏：

```javascript
{
  id: "heart-attack",                 // 必填：kebab-case 唯一識別碼，對應 pages/games/<id>.html
  number: "01",                       // 必填：兩位數編號（"01", ..., "50", "51"）
  name: "心臟病",                      // 必填：遊戲中文名稱
  englishName: "Slap Jack",           // 必填：英文名稱
  category: "reaction",               // 必填：六大分類 ID 之一
  categoryLabel: "反應力挑戰",         // 必填：分類中文顯示名稱
  players: "3–8 人",                  // 必填：建議遊玩人數文字
  minPlayers: 3,                      // 必填：number，最低遊玩人數（供人數推薦器比對）
  maxPlayers: 8,                      // 必填：number，最高遊玩人數（無上限請填 99）
  duration: "10–15 分鐘",             // 必填：預估時間
  materials: ["撲克牌"],              // 必填：所需道具陣列（無道具則填 ["無道具"]）
  featured: true,                     // 必填：boolean，是否顯示於首頁人氣推薦
  description: "考驗玩家反應速度...",  // 必填：1–2 句精簡介紹（繁體中文）
  rules: ["..."],                     // 必填：核心規則條列（繁體中文）
  steps: ["..."],                     // 必填：有順序的操作步驟（第一項須清楚說明如何開局，供隨機抽遊戲顯示「開始方式」）
  variations: ["..."],                // 必填：變化玩法（至少 1–2 項）
  penaltyTip: "..."                   // 必填：非強制飲酒替代懲罰建議
}
```

### 六大分類對照表（不可隨意增刪分類 ID）
| `category` (ID) | `categoryLabel` (中文名稱) | 對應檔案 | 遊戲特色 |
| :--- | :--- | :--- | :--- |
| `reaction` | 反應力挑戰 | `pages/categories/reaction.html` | 考驗速度、專注力 |
| `memory` | 記憶力挑戰 | `pages/categories/memory.html` | 考驗記憶與觀察 |
| `social` | 心理戰與猜測 | `pages/categories/social.html` | 猜心思、欺騙、推理 |
| `verbal` | 口才與表達 | `pages/categories/verbal.html` | 接龍、講故事、回答問題 |
| `interaction` | 默契與互動 | `pages/categories/interaction.html` | 考驗朋友之間的了解 |
| `card-dice` | 卡牌與骰子 | `pages/categories/card-dice.html` | 使用撲克牌或骰子進行 |

---

## 5. Content & Page Template Rules（內容與頁面模板規範）

- 所有面向使用者的文字與遊戲說明一律使用 **繁體中文（台灣用語）**。
- `steps` 第一步驟須讓新手一看就知道「怎麼開始」（會同步顯示於隨機抽遊戲彈窗的「開始方式」欄位）。
- 每款遊戲詳細頁（`pages/games/<id>.html`）均須使用完全相同的 HTML 結構與 CSS 類別，包含頂部導覽、麵包屑、遊戲標頭與收藏按鈕、簡介/規則/步驟/道具/變化/安全提示、同分類推薦與計時器彈窗。

---

## 6. Rules for Adding New Games（新增遊戲標準作業流程 SOP）

當使用者要求新增第 51 款以後的遊戲時，AI 必須依序執行：
1. 確認最適合的六大分類 ID，並設定小寫 kebab-case `id`。
2. 檢查 `js/games.js` 中無重複 `id`。
3. 依第 4 節 Schema 加入完整資料（包含 `minPlayers`、`maxPlayers`、詳細步驟與無酒精 `penaltyTip`）。
4. 複製任一現有 `pages/games/*.html` 模板建立 `pages/games/<id>.html`，替換標題、麵包屑、快速資訊、`data-fav-id`、內容與 `data-current-game`。
5. 確認相對路徑皆為 `../../`，首頁人數推薦、搜尋、分類篩選與分類頁會自動讀取 `js/games.js` 更新。

---

## 7. Coding Rules（程式碼規範）

- 僅使用標準 HTML5、CSS3 與 Vanilla JavaScript（ES6+），禁止引入框架或打包工具。
- 遊戲資料統一寫在 `js/games.js`，共用收藏與計時器寫在 `js/main.js`。
- 確保完全相容 GitHub Pages 靜態託管。

---

## 8. Safety & Inclusivity Guidelines（聚會安全準則）

- **禁止強迫飲酒**：不得出現「輸了必須喝完一杯」等強制性字眼。
- **提供友善替代方案**：每款遊戲的 `penaltyTip` 須包含無酒精飲料、喝水、真心話或趣味小才藝。
- **尊重個人界線**：玩家有權隨時跳過任何不適的題目或任務。

---

## 9. Pre-Completion Verification Checklist（完成變更前檢查清單）

- [ ] `js/games.js` 語法正確無缺漏欄位（含 `minPlayers` / `maxPlayers`），且所有 `id` 唯一。
- [ ] 新增的 `pages/games/<id>.html` 檔名與 `id` 完全一致，相對路徑皆為 `../../`。
- [ ] 首頁人數選擇自動推薦、分類篩選、關鍵字搜尋、隨機抽遊戲（含開始方式）、收藏功能與倒數計時器皆正常運作。
- [ ] 手機版與桌機版皆無破版，內容符合聚會安全準則。
