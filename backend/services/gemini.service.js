const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

const parseJSON = (text) => {
  try {
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return { raw: text };
  }
};

// 1. Generate a 12-week personalized learning path
const generateLearningPath = async (employeeData, gapAnalysis) => {
  try {
    const prompt = `You are a career coach AI. Given this employee profile: ${JSON.stringify(employeeData)}
and their skill gap analysis: ${JSON.stringify(gapAnalysis)}
Generate a detailed, personalized week-by-week learning path for 12 weeks.
For each week specify: weekNumber, focusSkill, learningActivity, resources (array of strings), expectedOutcome.
Return ONLY a valid JSON array with 12 objects, no markdown, no explanation.`;
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return parseJSON(text);
  } catch (err) {
    console.error('Gemini generateLearningPath error:', err.message);
    return { error: 'AI temporarily unavailable. Please try again later.' };
  }
};

// 2. Generate career advice
const generateCareerAdvice = async (employeeData) => {
  try {
    const prompt = `You are a senior career advisor. Analyze this employee profile: ${JSON.stringify(employeeData)}
Their current role is ${employeeData.currentRole} and they want to reach ${employeeData.targetRole || 'a senior position'}.
Give exactly: 3 career strengths (array), 3 improvement areas (array), 1 unique career insight (string), motivational message (string).
Return ONLY valid JSON: { strengths: [], improvements: [], uniqueInsight: "", motivationalMessage: "" }. No markdown.`;
    const result = await model.generateContent(prompt);
    const text = result.response.text();
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
    const result = await model.generateContent(prompt);
    const text = result.response.text();
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
Identify and return ONLY valid JSON (no markdown):
{
  "teamStrengths": ["strength1", "strength2", "strength3"],
  "criticalGaps": ["gap1", "gap2", "gap3"],
  "hiringRecommendations": ["rec1", "rec2"],
  "projectReadiness": { "score": 0-100, "assessment": "string" },
  "ninetyDayPlan": [{"day": "Day 1-30", "action": "string"}, {"day": "Day 31-60", "action": "string"}, {"day": "Day 61-90", "action": "string"}]
}`;
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return parseJSON(text);
  } catch (err) {
    console.error('Gemini generateTeamInsights error:', err.message);
    return { error: 'AI temporarily unavailable. Please try again later.' };
  }
};

// 5. AI chat assistant
const aiChatAssistant = async (userMessage, employeeContext) => {
  try {
    const prompt = `You are an AI learning assistant for a skill development platform.
Employee context: ${JSON.stringify(employeeContext)}
User message: "${userMessage}"
Answer helpfully, suggest learning resources, give career advice. Keep response under 150 words. Be encouraging and specific.`;
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    console.error('Gemini aiChatAssistant error:', err.message);
    return 'I\'m temporarily unavailable. Please try again in a moment!';
  }
};

module.exports = {
  generateLearningPath,
  generateCareerAdvice,
  generateSkillRecommendations,
  generateTeamInsights,
  aiChatAssistant,
};
