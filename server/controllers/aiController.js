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
 * 生成課程大綱
 * POST /api/ai/generate-outline
 */
exports.generateOutline = async (req, res) => {
  try {
    const { principles, manualInput } = req.body;

    // 驗證必要參數：原理或補充內容至少要有一項
    if ((!principles || principles.length === 0) && (!manualInput || !manualInput.trim())) {
      return res.status(400).json({
        success: false,
        message: '請至少選擇一個原理或輸入補充內容'
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
    const prompt = buildOutlinePrompt(principles || [], manualInput);

    // 呼叫 Gemini API
    const data = await callGeminiAPI(prompt);

    // 解析回應
    const outline = (data.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();

    if (!outline) {
      return res.status(500).json({
        success: false,
        message: 'AI 生成失敗，請稍後再試'
      });
    }

    res.json({
      success: true,
      data: { outline }
    });

  } catch (error) {
    console.error('生成課程大綱錯誤:', error);

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
 * 生成競賽說明（教師端「新增競賽」的「立即智能生成競賽說明」按鈕）
 * POST /api/ai/generate-competition-description
 */
exports.generateCompetitionDescription = async (req, res) => {
  try {
    const { studentName, organizer, title, level, teamName, rankName, score, manualInput } = req.body;

    if (!organizer && !title && !manualInput) {
      return res.status(400).json({
        success: false,
        message: '請至少填寫主辦單位、競賽名稱或手動補充內容'
      });
    }

    if (!GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'Gemini API Key 尚未設定，請在 server/.env 中設定 GEMINI_API_KEY'
      });
    }

    const prompt = buildCompetitionDescriptionPrompt({ studentName, organizer, title, level, teamName, rankName, score, manualInput });

    const data = await callGeminiAPI(prompt);
    const content = (data.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();

    if (!content) {
      return res.status(500).json({
        success: false,
        message: 'AI 生成失敗，請稍後再試'
      });
    }

    res.json({
      success: true,
      data: { content }
    });

  } catch (error) {
    console.error('生成競賽說明錯誤:', error);

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
 * 構建競賽說明生成的 prompt
 */
function buildCompetitionDescriptionPrompt({ studentName, organizer, title, level, teamName, rankName, score, manualInput }) {
  const levelLabels = { international: '國際賽', national: '全國賽', regional: '區域賽', county: '縣市賽' };

  let prompt = `你是一位擁有豐富經驗的 STEAM 教育教師，請為學生撰寫一段競賽經歷說明（約100-150字）。

【競賽資訊】
學生姓名：${studentName || '該生'}
主辦單位：${organizer || '未填'}
競賽名稱：${title || '未填'}
競賽等級：${levelLabels[level] || level || '未填'}
隊伍名稱：${teamName || '未填'}
名次：${rankName || '未填'}
成績：${score || '未填'}
`;

  if (manualInput && manualInput.trim()) {
    prompt += `\n【教師補充說明：競賽時做了什麼】\n${manualInput.trim()}\n`;
  }

  prompt += `
【撰寫要求】
1. 使用純文字撰寫，不要使用 Markdown 符號
2. 語氣正面積極，具體描述學生的參賽經歷、表現與收穫
3. 若有名次或成績，自然帶入說明中，不要用條列或數字編號
4. 禁止捏造教師補充說明中沒有提到的具體事件、日期或對話
5. 直接輸出說明內容，不要加上開場白或說明文字`;

  return prompt;
}

/**
 * 構建課程大綱生成的 prompt
 */
function buildOutlinePrompt(principles, manualInput) {
  let prompt = `你是一位擁有豐富經驗的 STEAM 教育教師，專長於機構原理、感測器與程式邏輯的實作課程設計。
請根據以下資訊，撰寫一份課程大綱。

【課程使用原理】
${principles.length > 0 ? principles.join('、') : '（教師未特別勾選原理標籤，請依補充內容合理推斷）'}
`;

  if (manualInput && manualInput.trim()) {
    prompt += `\n【教師補充說明：課程上做了什麼】\n${manualInput.trim()}\n`;
  }

  prompt += `
【撰寫要求】
1. 使用純文字撰寫，不要使用 Markdown 符號（如 **、##、-）
2. 依序包含以下四個段落，並以「一、」「二、」「三、」「四、」作為段落標題：
   一、課程主題：簡述本堂課的核心主題與運用的原理
   二、教學目標：條列 2-3 項具體、可觀察的學習目標
   三、課程內容：依教師補充說明延伸描述實際教學活動與操作步驟；若教師未補充，則依所選原理合理設計活動
   四、學習成果：描述學生完成課程後應能達成的具體成果
3. 內容需符合國小/國中程式設計與機器人實作課程情境，語氣專業但易讀
4. 禁止捏造教師補充說明中沒有提到的具體人名、日期或分數
5. 總字數約 200-350 字
6. 直接輸出大綱內容，不要加上開場白或說明文字`;

  return prompt;
}

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

// =====================
// 科系推薦相關設定
// =====================
const db = require('../config/db');

/**
 * 取得或生成科系推薦及學類介紹
 * POST /api/ai/generate-department-recommendation
 *
 * 邏輯：
 * 1. 先檢查資料庫是否已有該學生的推薦紀錄
 * 2. 若有，直接返回（每次登入只生成一次）
 * 3. 若無，呼叫 AI 生成並存入資料庫
 */
exports.generateDepartmentRecommendation = async (req, res) => {
  try {
    // 僅限學生角色使用
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: '僅限學生角色使用此功能'
      });
    }

    // 取得學生資料
    const student = await db.queryOne(`
      SELECT s.*, u.name
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE s.user_id = ?
    `, [req.user.id]);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: '找不到學生資料'
      });
    }

    // 檢查是否已有推薦紀錄
    const existing = await db.queryOne(`
      SELECT * FROM department_recommendations WHERE student_id = ?
    `, [student.id]);

    if (existing) {
      // 已有紀錄，直接返回
      return res.json({
        success: true,
        data: {
          department: existing.department,
          reason: existing.reason,
          introduction: existing.introduction,
          career: {
            directions: existing.career_directions,
            salary: existing.career_salary
          },
          suggestion: existing.suggestion,
          generatedAt: existing.generated_at,
          cached: true
        }
      });
    }

    // 檢查 API Key 是否已設定
    if (!GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'Gemini API Key 尚未設定，請在 server/.env 中設定 GEMINI_API_KEY'
      });
    }

    // 取得學生的課程歷史
    const courses = await db.query(`
      SELECT DISTINCT
        c.name as course_name,
        ct.name as course_type_name,
        ce.status
      FROM course_enrollments ce
      JOIN course_schedules cs ON ce.schedule_id = cs.id
      JOIN courses c ON cs.course_id = c.id
      LEFT JOIN course_types ct ON c.course_type_id = ct.id
      WHERE ce.student_id = ?
    `, [student.id]);

    // 取得學生的能力分數 (取最新一筆有數據的紀錄)
    const latestSkills = await db.queryOne(`
      SELECT
        slr.skill_programming, slr.skill_debugging, slr.skill_creativity,
        slr.skill_structure, slr.skill_teamwork
      FROM student_log_records slr
      JOIN course_logs cl ON slr.log_id = cl.id
      WHERE slr.student_id = ?
        AND (COALESCE(slr.skill_programming, 0) > 0
          OR COALESCE(slr.skill_debugging, 0) > 0
          OR COALESCE(slr.skill_creativity, 0) > 0
          OR COALESCE(slr.skill_structure, 0) > 0
          OR COALESCE(slr.skill_teamwork, 0) > 0)
      ORDER BY cl.log_date DESC
      LIMIT 1
    `, [student.id]);

    // 取得學生的競賽紀錄
    const competitions = await db.query(`
      SELECT
        organizer, title, level, rank_name, score, team_name, description
      FROM competitions
      WHERE student_id = ?
      ORDER BY competition_date DESC
    `, [student.id]);

    // 構建 prompt
    const prompt = buildDepartmentRecommendationPrompt(student.name, courses, latestSkills, competitions);

    // 呼叫 Gemini API
    const data = await callGeminiAPI(prompt);
    const generatedText = (data.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();

    if (!generatedText) {
      return res.status(500).json({
        success: false,
        message: 'AI 生成失敗，請稍後再試'
      });
    }

    // 解析回應
    const result = parseDepartmentRecommendation(generatedText);

    // 存入資料庫
    await db.query(`
      INSERT INTO department_recommendations
        (student_id, department, reason, introduction, career_directions, career_salary, suggestion)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      student.id,
      result.department,
      result.reason,
      result.introduction,
      result.career.directions,
      result.career.salary,
      result.suggestion
    ]);

    res.json({
      success: true,
      data: {
        ...result,
        cached: false
      }
    });

  } catch (error) {
    console.error('生成科系推薦錯誤:', error);

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
 * 重新生成科系推薦（刪除舊紀錄後重新生成）
 * POST /api/ai/regenerate-department-recommendation
 */
exports.regenerateDepartmentRecommendation = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ success: false, message: '僅限學生角色使用此功能' });
    }

    const student = await db.queryOne(`
      SELECT s.id FROM students s WHERE s.user_id = ?
    `, [req.user.id]);

    if (!student) {
      return res.status(404).json({ success: false, message: '找不到學生資料' });
    }

    // 刪除舊紀錄
    await db.query('DELETE FROM department_recommendations WHERE student_id = ?', [student.id]);

    // 重新呼叫生成邏輯
    return exports.generateDepartmentRecommendation(req, res);
  } catch (error) {
    console.error('重新生成科系推薦錯誤:', error);
    res.status(500).json({ success: false, message: '伺服器錯誤' });
  }
};

/**
 * 構建科系推薦的 prompt
 */
function buildDepartmentRecommendationPrompt(studentName, courses, skills, competitions) {
  // 整理課程資訊
  const courseList = courses.length > 0
    ? courses.map(c => c.course_type_name || c.course_name).filter(Boolean).join('、')
    : '尚無課程紀錄';

  // 整理能力分數
  const skillsInfo = skills
    ? `程式能力：${skills.skill_programming || 0}/5
除錯能力：${skills.skill_debugging || 0}/5
創意表現：${skills.skill_creativity || 0}/5
結構組織：${skills.skill_structure || 0}/5
團隊合作：${skills.skill_teamwork || 0}/5`
    : '尚無能力評估紀錄';

  // 整理競賽資訊
  let competitionInfo = '尚無競賽紀錄';
  if (competitions.length > 0) {
    competitionInfo = competitions.map(c => {
      const levelLabels = { international: '國際賽', national: '全國賽', regional: '區域賽', county: '縣市賽' };
      return `- ${c.title || '未命名競賽'}（${levelLabels[c.level] || c.level || '其他'}）${c.rank_name ? '，成績：' + c.rank_name : ''}${c.score ? ' ' + c.score : ''}`;
    }).join('\n');
  }

  const prompt = `你是一位經驗豐富的升學輔導專家，專精於 STEAM 教育與科技領域的學涯規劃。
請根據以下學生的學習歷程與表現，推薦最適合的大學科系，並提供完整的學類介紹。

【學生資訊】
姓名：${studentName}

【修課紀錄】
${courseList}

【能力評估】
${skillsInfo}

【競賽經歷】
${competitionInfo}

【分析要求】
請根據上述資料進行綜合分析，考量以下面向：
1. 學生的課程背景顯示的興趣方向
2. 能力雷達圖顯示的優勢與待加強項目
3. 競賽經歷反映的實務能力與成就

【輸出格式】
請嚴格按照以下格式輸出，使用純文字，不要使用 Markdown 符號：

【推薦科系】
（填寫 1 個最推薦的科系名稱，如：資訊工程學系、電機工程學系、機械工程學系等）

【推薦理由】
（約 80-120 字，說明為何這個科系適合此學生，需具體連結學生的課程、能力與競賽表現）

【學類介紹】
（約 100-150 字，介紹該學類的核心課程、學習內容與特色）

【出路分析】
就業方向：（列出 3-5 個主要就業方向，用頓號分隔）
薪資範圍：（提供新鮮人起薪參考範圍）

【學習建議】
（約 60-100 字，根據學生目前的能力分布，建議未來可加強的方向）`;

  return prompt;
}

/**
 * 解析科系推薦回應
 */
function parseDepartmentRecommendation(text) {
  const result = {
    department: '',
    reason: '',
    introduction: '',
    career: {
      directions: '',
      salary: ''
    },
    suggestion: ''
  };

  // 解析推薦科系
  const deptMatch = text.match(/【推薦科系】\s*([\s\S]*?)(?=【推薦理由】|$)/);
  if (deptMatch) {
    result.department = deptMatch[1].trim();
  }

  // 解析推薦理由
  const reasonMatch = text.match(/【推薦理由】\s*([\s\S]*?)(?=【學類介紹】|$)/);
  if (reasonMatch) {
    result.reason = reasonMatch[1].trim();
  }

  // 解析學類介紹
  const introMatch = text.match(/【學類介紹】\s*([\s\S]*?)(?=【出路分析】|$)/);
  if (introMatch) {
    result.introduction = introMatch[1].trim();
  }

  // 解析出路分析
  const careerMatch = text.match(/【出路分析】\s*([\s\S]*?)(?=【學習建議】|$)/);
  if (careerMatch) {
    const careerText = careerMatch[1];
    const dirMatch = careerText.match(/就業方向[：:]\s*(.+)/);
    const salaryMatch = careerText.match(/薪資範圍[：:]\s*(.+)/);
    if (dirMatch) result.career.directions = dirMatch[1].trim();
    if (salaryMatch) result.career.salary = salaryMatch[1].trim();
  }

  // 解析學習建議
  const suggestionMatch = text.match(/【學習建議】\s*([\s\S]*?)$/);
  if (suggestionMatch) {
    result.suggestion = suggestionMatch[1].trim();
  }

  // 如果解析失敗，使用預設值
  if (!result.department) {
    result.department = '資訊工程學系';
    result.reason = '根據您的 STEAM 課程背景與程式設計經歷，資訊工程學系是最適合的選擇。';
    result.introduction = '資訊工程學系培養軟體開發、系統設計與資訊應用的專業人才，課程涵蓋程式設計、資料結構、演算法、人工智慧等領域。';
    result.career.directions = '軟體工程師、系統分析師、資料科學家、AI工程師、資安工程師';
    result.career.salary = '新鮮人起薪約 45,000-60,000 元';
    result.suggestion = '建議持續加強程式邏輯與演算法能力，並多參與團隊專案累積協作經驗。';
  }

  return result;
}
