
import { GoogleGenAI, Type } from "@google/genai";
import { StaffTask, ManagementSummary } from "../types";

export const analyzeTasks = async (tasks: StaffTask[]): Promise<ManagementSummary> => {
  // Use strictly compliant initialization with process.env.GEMINI_API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const prompt = `
    You are an operations assistant reviewing a hierarchical task board for Cloudcrave Solutions.
    
    Data:
    ${JSON.stringify(tasks, null, 2)}
    
    Current Date Reference: Nov 20, 2024
    
    INSTRUCTIONS:
    1. Group tasks by Task Owner (staffName).
    2. Analyze productivity based on "hoursSpent".
    3. CRITICAL: For each staff member and for the global organization, calculate exactly how many hours are spent on tasks based on their "frequency" (Daily, Weekly, Monthly, N/A/One-time).
    4. Provide a "Cadence Breakdown" showing total hours for Daily vs Weekly vs Monthly tasks.
    5. Separate: One-time tasks, Recurring tasks, and Training tasks.
    6. Highlight:
       - Blocked tasks (status is 'Blocked').
       - Pending Approval tasks (status is 'Pending Approval') - these are high priority for admins.
       - Overdue tasks (dueDate is before today and status is not 'Completed' and status is not 'Pending Approval').
       - High-hour tasks that might need review.
    7. Maintain a professional, neutral tone.
    
    Ensure accurate arithmetic for total hours in all analytics fields.
  `;

  try {
    const response = await ai.models.generateContent({
      // Upgraded to gemini-3-pro-preview for complex reasoning/arithmetic analysis tasks
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            executiveSummary: { type: Type.STRING },
            staffWorkload: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  staffName: { type: Type.STRING },
                  oneTimeTasks: { type: Type.ARRAY, items: { type: Type.STRING } },
                  recurringTasks: { type: Type.ARRAY, items: { type: Type.STRING } },
                  trainingTasks: { type: Type.ARRAY, items: { type: Type.STRING } },
                  currentlyWorkingOn: { type: Type.STRING },
                  unresolvedItems: { type: Type.ARRAY, items: { type: Type.STRING } },
                  totalHours: { type: Type.NUMBER },
                  effortByFrequency: {
                    type: Type.OBJECT,
                    properties: {
                      daily: { type: Type.NUMBER },
                      weekly: { type: Type.NUMBER },
                      monthly: { type: Type.NUMBER },
                      oneTime: { type: Type.NUMBER }
                    },
                    required: ["daily", "weekly", "monthly", "oneTime"]
                  }
                },
                required: ["staffName", "oneTimeTasks", "recurringTasks", "trainingTasks", "currentlyWorkingOn", "unresolvedItems", "totalHours", "effortByFrequency"]
              }
            },
            recurringTaskOverview: { type: Type.STRING },
            trainingOverview: { type: Type.STRING },
            blockersAndRisks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  taskTitle: { type: Type.STRING },
                  owner: { type: Type.STRING },
                  reason: { type: Type.STRING }
                },
                required: ["taskTitle", "owner", "reason"]
              }
            },
            analytics: {
              type: Type.OBJECT,
              properties: {
                totalTasks: { type: Type.NUMBER },
                blockedCount: { type: Type.NUMBER },
                overdueCount: { type: Type.NUMBER },
                completionPercentage: { type: Type.NUMBER },
                totalHoursLogged: { type: Type.NUMBER },
                cadenceBreakdown: {
                  type: Type.OBJECT,
                  properties: {
                    dailyTotal: { type: Type.NUMBER },
                    weeklyTotal: { type: Type.NUMBER },
                    monthlyTotal: { type: Type.NUMBER },
                    oneTimeTotal: { type: Type.NUMBER }
                  },
                  required: ["dailyTotal", "weeklyTotal", "monthlyTotal", "oneTimeTotal"]
                }
              },
              required: ["totalTasks", "blockedCount", "overdueCount", "completionPercentage", "totalHoursLogged", "cadenceBreakdown"]
            }
          },
          required: ["executiveSummary", "staffWorkload", "recurringTaskOverview", "trainingOverview", "blockersAndRisks", "analytics"]
        }
      }
    });

    // Directly access .text property from GenerateContentResponse
    const text = response.text;
    if (!text) {
      throw new Error("No textual response received from the analysis model.");
    }
    return JSON.parse(text.trim());
  } catch (err: any) {
    console.error("Gemini Analysis Error:", err);
    throw new Error(err.message || "Failed to communicate with AI model.");
  }
};

export const getWritingSuggestions = async (text: string, type: 'clarity' | 'professional' | 'measurable'): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const prompts = {
    clarity: "Improve the clarity and grammar of this deliverable description while keeping it concise.",
    professional: "Make this deliverable description sound more professional and suitable for a high-level business report.",
    measurable: "Make this deliverable description more measurable and outcome-driven. Use specific metrics or clear completion criteria."
  };

  const prompt = `
    Task: ${prompts[type]}
    Original Text: "${text}"
    
    Return ONLY the improved text. Do not include any explanations or conversational filler.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text?.trim() || text;
  } catch (err) {
    console.error("Gemini Suggestion Error:", err);
    return text;
  }
};
