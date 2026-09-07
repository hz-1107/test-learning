/**
 * AI Controller - 處理 AI 相關請求 (Gemini API)
 */
const https = require('https');

// =====================
// Gemini API 設定
// =====================
// API Key 從環境變數讀取（設定於 server/.env）
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_HOST = 'generativelanguage.googleapis.com';
const GEMINI_API_PATH = '/v1beta/models/gemini-3.6-flash:generateContent';

// =====================
// 隨機元素設定（增加生成靈活性）
// =====================
const WRITING_STYLES = [
  '像是寫給家長的暖心小語，讓家長感受到孩子的成長',
  '像是學期末的成長紀錄，著重描述學生的進步軌跡',
  '像是班導師的觀察日記，記錄學生的獨特表現',
  '像是給學生的鼓勵信，激發學生的學習動力'
];

const OPENING_STYLES = [
  '以學生的一個具體表現或小故事開頭',
  '以學生最突出的特質開頭',
  '以學生的成長變化開頭',
  '以課堂中的一個亮點時刻開頭'
];

const SENTENCE_PATTERNS = [
  '使用生動的動詞描述學生的行為',
  '用概括性的描述展現學生特質',
  '描述學生的學習態度和成長',
  '著重描述能力表現而非具體事件'
];

// 特質對應的具體情境
const TRAIT_SCENARIOS = {
  '思維邏輯靈活': ['分析程式邏輯時', '解決複雜問題時', '設計演算法時', '優化程式碼時'],
  'Debug大師': ['追蹤錯誤時', '找出程式漏洞時', '耐心排除問題時', '協助同學除錯時'],
  '開創性十足': ['設計專案時', '發想創意點子時', '改良既有方案時', '嘗試新方法時'],
  '同儕小老師': ['小組討論中', '協助同學時', '分享學習心得時', '帶領團隊時'],
  '積極主動': ['課堂發問時', '主動嘗試新挑戰時', '自主學習時', '承擔任務時'],
  '專注投入': ['進行專案時', '學習新概念時', '完成作品時', '面對困難時'],
  '勇於嘗試': ['接觸新技術時', '挑戰困難題目時', '突破舒適圈時', '實驗新想法時'],
  '細心謹慎': ['撰寫程式碼時', '檢查作品時', '規劃步驟時', '處理細節時']
};

/**
 * 從陣列中隨機選取一個元素
 */
function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * 根據特質取得對應的情境描述
 */
function getTraitScenarios(traits) {
  const scenarios = [];
  traits.forEach(trait => {
    if (TRAIT_SCENARIOS[trait]) {
      scenarios.push(`${trait}：${randomPick(TRAIT_SCENARIOS[trait])}`);
    }
  });
  return scenarios;
}

/**
 * 呼叫 Gemini API（使用 https 模組）
 */
function callGeminiAPI(prompt) {
  return new Promise((resolve, reject) => {
    const requestBody = JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.75,       // 平衡創意與穩定
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 2048    // 增加上限，避免截斷
      }
    });

    const options = {
      hostname: GEMINI_API_HOST,
      port: 443,
      path: `${GEMINI_API_PATH}?key=${GEMINI_API_KEY}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          if (res.statusCode === 200) {
            resolve(jsonData);
          } else {
            reject({
              statusCode: res.statusCode,
              error: jsonData.error || jsonData
            });
          }
        } catch (e) {
          reject({ statusCode: res.statusCode, error: 'JSON 解析錯誤', raw: data });
        }
      });
    });

    req.on('error', (error) => {
      reject({ error: error.message });
    });

    req.write(requestBody);
    req.end();
  });
}

/**
 * 生成學生評語
 * POST /api/ai/generate-comment
 */
exports.generateComment = async (req, res) => {
  try {
    const { studentName, traits, improvements, manualInput } = req.body;

    // 驗證必要參數
    if (!studentName) {
      return res.status(400).json({
        success: false,
        message: '缺少學生姓名'
      });
    }

    if (!traits || traits.length === 0) {
      return res.status(400).json({
        success: false,
        message: '請至少選擇一個正面特質'
      });
    }

    // 檢查 API Key 是否已設定
    if (!GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'Gemini API Key 尚未設定，請在 server/.env 中設定 GEMINI_API_KEY'
      });
    }

    // 構建 prompt
    const prompt = buildCommentPrompt(studentName, traits, improvements, manualInput);

    // 呼叫 Gemini API
    const data = await callGeminiAPI(prompt);

    // 解析回應
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // 解析評語和分數
    const result = parseAIResponse(generatedText, traits);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('生成評語錯誤:', error);

    // 區分不同類型的錯誤
    if (error.statusCode) {
      return res.status(500).json({
        success: false,
        message: 'AI 生成失敗，請稍後再試',
        error: error.error?.message || JSON.stringify(error.error)
      });
    }

    res.status(500).json({
      success: false,
      message: '伺服器錯誤',
      error: error.message || error.error
    });
  }
};

/**
 * 構建評語生成的 prompt（優化版）
 */
function buildCommentPrompt(studentName, traits, improvements, manualInput) {
  // 隨機選擇寫作風格和開頭方式
  const writingStyle = randomPick(WRITING_STYLES);
  const openingStyle = randomPick(OPENING_STYLES);
  const sentencePattern = randomPick(SENTENCE_PATTERNS);

  // 取得特質對應的情境
  const traitScenarios = getTraitScenarios(traits);

  let prompt = `你是一位擁有豐富經驗的 STEAM 教育教師，專長於程式設計、機器人與創客課程教學。
請為學生撰寫一段個人化的課堂評語。

【本次寫作指引】
- 寫作風格：${writingStyle}
- 開頭方式：${openingStyle}
- 表達技巧：${sentencePattern}

【學生資訊】
姓名：${studentName}
正面特質：${traits.join('、')}
`;

  // 加入特質情境提示
  if (traitScenarios.length > 0) {
    prompt += `\n【特質展現情境參考】\n${traitScenarios.join('\n')}\n`;
  }

  if (improvements && improvements.length > 0) {
    prompt += `\n待加強項目：${improvements.join('、')}`;
  }

  if (manualInput && manualInput.trim()) {
    prompt += `\n\n教師補充說明：${manualInput}`;
  }

  prompt += `

【撰寫要求】
1. 字數約 100-150 字，不要太短也不要太長
2. 語氣溫暖正向，具有鼓勵性
3. 避免使用「該生」、「該同學」等生硬用語，直接稱呼學生姓名
4. 用概括性描述展現學生特質，不要虛構具體事件
5. 避免制式化用語如「在...方面表現優異」，改用生動描述
6. 如有待加強項目，用正面期許的方式提出，不要過度強調缺點
7. 結尾以對未來的期許或鼓勵作結
8. 禁止虛構對話內容（如「老師，...」或學生說的話）
9. 禁止編造特定日期、次數、具體事件等不存在的細節
10. 評語必須是純文字敘述，禁止出現數字編號、括號數字等

【優秀範例參考】
範例1（特質：思維邏輯靈活、積極主動）：
「小明在這學期的程式課中展現了優秀的邏輯思維能力。面對複雜的程式問題時，他能夠冷靜分析、逐步拆解，找出解決方案。課堂上積極參與討論，勇於提出自己的想法和疑問，這份主動學習的態度非常可貴。期待他在未來繼續挑戰更進階的專案！」

範例2（特質：同儕小老師、細心謹慎）：
「小華是班上熱心助人的好夥伴，常常主動協助同學解決程式上的困難。她的程式碼總是整齊有序、結構清晰，展現出細心謹慎的特質。在團隊合作中能夠有效溝通，帶領同學一起完成任務。希望她繼續保持這份熱忱，未來一定能成為優秀的團隊領袖。」

【評分要求】
根據學生特質，給出五個面向的評分（1-5分，5分最高）：
- 程式能力：程式邏輯、coding 技巧
- 除錯能力：找出問題、解決 bug 的能力
- 創意表現：創新思維、獨特想法
- 結構組織：程式架構、專案規劃能力
- 團隊合作：溝通協作、幫助同儕

評分原則：
- 有明確展現該特質 → 4-5分
- 一般表現 → 3分
- 未提及或待加強 → 2分

【輸出格式】嚴格按照以下格式輸出，不要加入其他文字：
【評語】
(你的評語內容，100-150字)

【分數】
程式：X
除錯：X
創意：X
結構：X
團隊合作：X`;

  return prompt;
}

/**
 * 解析 AI 回應
 */
function parseAIResponse(text, traits) {
  // 預設分數
  let scores = {
    programming: 4,
    debugging: 4,
    creativity: 4,
    structure: 4,
    teamwork: 4
  };

  let comment = text;

  // 嘗試解析分數
  const scorePatterns = {
    programming: /程式[：:]\s*(\d)/,
    debugging: /除錯[：:]\s*(\d)/,
    creativity: /創意[：:]\s*(\d)/,
    structure: /結構[：:]\s*(\d)/,
    teamwork: /團隊合作[：:]\s*(\d)/
  };

  for (const [key, pattern] of Object.entries(scorePatterns)) {
    const match = text.match(pattern);
    if (match) {
      scores[key] = Math.min(5, Math.max(1, parseInt(match[1])));
    }
  }

  // 嘗試提取評語部分
  const commentMatch = text.match(/【評語】\s*([\s\S]*?)(?=【分數】|$)/);
  if (commentMatch) {
    comment = commentMatch[1].trim();
  } else {
    // 如果沒有找到格式，移除分數部分
    comment = text.replace(/【分數】[\s\S]*$/, '').replace(/【評語】/, '').trim();
  }

  // 清除異常的數字標記，如 (37)、(45)、[1]、1. 等
  comment = comment
    .replace(/\(\d+\)/g, '')           // 移除 (數字)
    .replace(/\[\d+\]/g, '')           // 移除 [數字]
    .replace(/^\d+\.\s*/gm, '')        // 移除行首 1. 2. 等
    .replace(/\s{2,}/g, ' ')           // 多餘空白合併
    .trim();

  // 檢查評語長度，若太短則使用備用評語
  if (comment.length < 30) {
    const traitsText = traits.length > 0 ? traits.join('、') : '認真學習';
    comment = `在本學期的課程中展現了${traitsText}等優秀特質，學習態度積極認真，能夠主動思考並嘗試解決問題。期待在未來的課程中繼續保持這份學習熱忱，挑戰更多有趣的專案！`;
  }

  // 根據特質調整分數（作為備用邏輯）
  if (traits.includes('Debug大師') || traits.includes('Debug 大師')) {
    scores.debugging = Math.max(scores.debugging, 4);
  }
  if (traits.includes('思維邏輯靈活')) {
    scores.programming = Math.max(scores.programming, 4);
  }
  if (traits.includes('開創性十足')) {
    scores.creativity = Math.max(scores.creativity, 4);
  }
  if (traits.includes('同儕小老師')) {
    scores.teamwork = Math.max(scores.teamwork, 4);
  }

  return {
    comment,
    scores
  };
}
