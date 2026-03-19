const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });


const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isQuotaError = (error) => {
  if (!error) return false;
  if (error.status === 429) return true;
  const message = String(error.message || '').toLowerCase();
  return message.includes('quota') || message.includes('rate') || message.includes('resource_exhausted') || message.includes('429');
};

const callGeminiWithRetry = async (prompt, maxRetries = 3) => {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const retryModel = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: { maxOutputTokens: 8000, temperature: 0.7 },
      });
      const result = await retryModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });
      return result.response.text();
    } catch (error) {
      lastError = error;
      console.error(`Gemini attempt ${attempt} failed:`, error.message);
      if (isQuotaError(error)) throw error;
      if (attempt < maxRetries) {
        const waitTime = attempt * 2000;
        console.log(`Retrying Gemini in ${waitTime / 1000}s...`);
        await sleep(waitTime);
      }
    }
  }
  throw lastError;
};

/**
 * Robust JSON parser: strips markdown fences, then extracts the outermost
 * JSON object or array (whichever comes FIRST in the text).
 */
const parseJSON = (text) => {
  if (!text) return null;
  try {
    // Strip markdown code fences
    let clean = text
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();

    // Find the outermost JSON structure: object or array — whichever starts first
    const objStart = clean.indexOf('{');
    const arrStart = clean.indexOf('[');

    let start = -1;
    let endChar = '';

    if (objStart === -1 && arrStart === -1) return null;

    if (objStart !== -1 && (arrStart === -1 || objStart < arrStart)) {
      start = objStart;
      endChar = '}';
    } else {
      start = arrStart;
      endChar = ']';
    }

    // Find matching closing character using bracket counting
    const openChar = endChar === '}' ? '{' : '[';
    let depth = 0;
    let end = -1;
    let inString = false;
    let escape = false;

    for (let i = start; i < clean.length; i++) {
      const ch = clean[i];
      if (escape) { escape = false; continue; }
      if (ch === '\\' && inString) { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === openChar) depth++;
      else if (ch === endChar) {
        depth--;
        if (depth === 0) { end = i; break; }
      }
    }

    if (end === -1) return null;
    const extracted = clean.substring(start, end + 1);
    return JSON.parse(extracted);
  } catch (err) {
    console.error('JSON parsing failed:', err.message);
    return null;
  }
};

// 1. Generate an 8-week personalized learning path
const generateLearningPath = async (employeeData, gapAnalysis) => {
  try {
    const prompt = `You are a career coach AI. Given this employee profile: ${JSON.stringify(employeeData)}
and their skill gap analysis: ${JSON.stringify(gapAnalysis)}
Generate a detailed, personalized week-by-week learning path for 8 weeks.
For each week specify: weekNumber, focusSkill, learningActivity, resources (array of strings), expectedOutcome.
Return ONLY a valid JSON array with 8 objects, no markdown, no explanation.

Each week object MUST have ALL these fields:
- week (number)
- title (descriptive string)
- focusSkill (exact skill name)
- skillCategory (Frontend/Backend/Cloud/Data/DevOps)
- priority (critical/important/good-to-have)
- overview (2 sentence description)
- weeklyGoalHours (number)
- dailyPlan (object with monday through friday keys)
- resources (ARRAY of resource objects nested here)
- practiceProject (object nested here)
- weeklyCheckpoint (string)
- keyConceptsCovered (array of strings)
- nextWeekPreview (string)`;
    const text = await callGeminiWithRetry(prompt);
    return parseJSON(text);
  } catch (err) {
    console.error('Gemini generateLearningPath error:', err.message);
    return { error: 'AI temporarily unavailable. Please try again later.' };
  }
};

const generateCustomLearningPath = async (prompt) => {
  try {
    return await callGeminiWithRetry(prompt, 3);
  } catch (err) {
    console.error('Gemini generateCustomLearningPath error:', err.message);
    if (isQuotaError(err)) {
      const retryMatch = err.message.match(/(\d+\.?\d*)s/);
      const waitSecs = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) : 60;
      throw { isQuotaError: true, waitSeconds: waitSecs, message: `AI quota exceeded. Please retry in ${waitSecs} seconds.` };
    }
    return null;
  }
};

// 2. Generate career advice
const generateCareerAdvice = async (employeeData) => {
  try {
    const prompt = `You are a senior career advisor. Analyze this employee profile: ${JSON.stringify(employeeData)}
Their current role is ${employeeData.currentRole} and they want to reach ${employeeData.targetRole || 'a senior position'}.
Give exactly: 3 career strengths (array), 3 improvement areas (array), 1 unique career insight (string), motivational message (string).
Return ONLY valid JSON: { "strengths": [], "improvements": [], "uniqueInsight": "", "motivationalMessage": "" }. No markdown, no extra text.`;
    const text = await callGeminiWithRetry(prompt);
    return parseJSON(text);
  } catch (err) {
    console.error('Gemini generateCareerAdvice error:', err.message);
    return { error: 'AI temporarily unavailable. Please try again later.' };
  }
};

// 3. Generate skill recommendations for a project
const generateSkillRecommendations = async (projectDescription) => {
  try {
    const prompt = `Given this project description: "${projectDescription}"
List the top 10 technical skills required to successfully complete this project.
For each skill include: skillName, importance (1-10 integer), reason (why it's needed, 1 sentence).
Return ONLY a valid JSON array of 10 objects. No markdown, no explanation.`;
    const text = await callGeminiWithRetry(prompt);
    return parseJSON(text);
  } catch (err) {
    console.error('Gemini generateSkillRecommendations error:', err.message);
    return { error: 'AI temporarily unavailable. Please try again later.' };
  }
};

// 4. Generate team insights
const generateTeamInsights = async (teamSkillsData) => {
  try {
    const prompt = `You are a team performance analyst. Here is the skill data for a team: ${JSON.stringify(teamSkillsData)}
Analyze the team and return ONLY valid JSON with no markdown fences, no extra text, starting with { and ending with }:
{
  "teamStrengths": ["strength1", "strength2", "strength3"],
  "criticalGaps": ["gap1", "gap2", "gap3"],
  "hiringRecommendations": ["rec1", "rec2"],
  "projectReadiness": { "score": 75, "assessment": "string describing readiness" },
  "ninetyDayPlan": [
    {"day": "Day 1-30", "action": "string"},
    {"day": "Day 31-60", "action": "string"},
    {"day": "Day 61-90", "action": "string"}
  ]
}`;
    const text = await callGeminiWithRetry(prompt);
    const result = parseJSON(text);
    if (!result) throw new Error('Failed to parse team insights JSON from Gemini');
    return result;
  } catch (err) {
    console.error('Gemini generateTeamInsights error:', err.message);
    return { error: 'AI temporarily unavailable. Please try again later.' };
  }
};

// 4.5. Generate Project Training Plan
const generateProjectTrainingPlan = async (projectData) => {
  try {
    const employeeSection = projectData.assignedEmployees && projectData.assignedEmployees.length > 0
      ? `Assigned employees and their skills: ${JSON.stringify(projectData.assignedEmployees)}`
      : 'No employees assigned yet. Generate a general plan based on required skills.';

    const prompt = `You are a technical project manager and learning coach.
Project: "${projectData.name}" — deadline in ${projectData.daysUntilDeadline} days.
Required skills: ${JSON.stringify(projectData.requiredSkills)}
${employeeSection}

Generate a focused training plan. Return ONLY valid JSON starting with { and ending with }, no markdown, no extra text:
{
  "projectReadiness": "Short summary of overall project skill readiness",
  "criticalGaps": ["gap 1 string", "gap 2 string"],
  "employeePlans": [
    {
      "employeeName": "Name",
      "recommendedCourses": ["Course A", "Course B"],
      "focusAreas": ["Area 1", "Area 2"]
    }
  ]
}`;
    const text = await callGeminiWithRetry(prompt);
    const result = parseJSON(text);
    if (!result) throw new Error('Failed to parse training plan JSON from Gemini');
    return result;
  } catch (err) {
    console.error('Gemini generateProjectTrainingPlan error:', err.message);
    return { error: 'AI temporarily unavailable. Please try again later.' };
  }
};

// 5. AI chat assistant
const aiChatAssistant = async (userMessage, employeeContext, history = []) => {
  try {
    const historyText = history.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`).join('\n');
    const prompt = `You are an AI learning assistant for a skill development platform.
Employee context: ${JSON.stringify(employeeContext)}
Recent conversation history:
${historyText}

User message: "${userMessage}"
Answer helpfully, suggest learning resources, give career advice. Keep response under 150 words. Be encouraging and specific. Do NOT mention that you are an AI or repeat yourself unnecessarily.`;
    return await callGeminiWithRetry(prompt, 2);
  } catch (err) {
    console.error('Gemini aiChatAssistant error:', err.message);
    return "I'm temporarily unavailable. Please try again in a moment!";
  }
};

module.exports = {
  callGeminiWithRetry,
  generateLearningPath,
  generateCustomLearningPath,
  generateCareerAdvice,
  generateSkillRecommendations,
  generateTeamInsights,
  generateProjectTrainingPlan,
  aiChatAssistant,
};
