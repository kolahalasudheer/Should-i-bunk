interface CohereResponse {
  generations: Array<{
    text: string;
  }>;
}

export class AIService {
  private apiKey: string;
  private baseUrl = 'https://api.cohere.ai/v1';

  constructor() {
    this.apiKey = process.env.COHERE_API_KEY || process.env.AI_API_KEY || '';
    if (!this.apiKey) {
      console.warn('Cohere API key not found. AI features will use fallback responses.');
    }
  }

  async generateExcuse(
    mood: string,
    weatherCondition: string,
    professorStrictness: string,
    attendancePercentage: number
  ): Promise<string> {
    if (!this.apiKey) {
      return this.getFallbackExcuse(mood, weatherCondition);
    }

    const prompt = `Generate a believable and creative excuse for missing class. Context:
- Student is feeling: ${mood}
- Weather condition: ${weatherCondition}
- Professor is: ${professorStrictness}
- Current attendance: ${attendancePercentage}%

The excuse should be:
- Brief (1-2 sentences)
- Believable but creative
- Appropriate for the context
- Slightly humorous if possible

Excuse:`;

    try {
      const response = await fetch(`${this.baseUrl}/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'command',
          prompt: prompt,
          max_tokens: 100,
          temperature: 0.8,
          stop_sequences: ['\n\n'],
        }),
      });

      if (!response.ok) {
        throw new Error(`Cohere API responded with status: ${response.status}`);
      }

      const data: CohereResponse = await response.json();
      return data.generations[0]?.text?.trim() || this.getFallbackExcuse(mood, weatherCondition);
    } catch (error) {
      console.error('Error generating excuse:', error);
      return this.getFallbackExcuse(mood, weatherCondition);
    }
  }

  async generateAnalysis(
    attendancePercentage: number,
    daysUntilExam: number,
    mood: string,
    bunkScore: number,
    decision: string
  ): Promise<string> {
    if (!this.apiKey) {
      return this.getFallbackAnalysis(attendancePercentage, daysUntilExam, decision);
    }

    const prompt = `Provide a smart analysis for a student's class attendance decision. Context:
- Current attendance: ${attendancePercentage}%
- Days until next exam: ${daysUntilExam}
- Student mood: ${mood}
- Calculated bunk score: ${bunkScore}/100
- AI recommendation: ${decision}

Provide a brief analysis (2-3 sentences) that:
- Explains the reasoning behind the decision
- Considers the attendance percentage and exam timing
- Gives practical advice
- Is supportive but realistic

Analysis:`;

    try {
      const response = await fetch(`${this.baseUrl}/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'command',
          prompt: prompt,
          max_tokens: 150,
          temperature: 0.7,
          stop_sequences: ['\n\n'],
        }),
      });

      if (!response.ok) {
        throw new Error(`Cohere API responded with status: ${response.status}`);
      }

      const data: CohereResponse = await response.json();
      return data.generations[0]?.text?.trim() || this.getFallbackAnalysis(attendancePercentage, daysUntilExam, decision);
    } catch (error) {
      console.error('Error generating analysis:', error);
      return this.getFallbackAnalysis(attendancePercentage, daysUntilExam, decision);
    }
  }

  private getFallbackExcuse(mood: string, weatherCondition: string): string {
    const excuses = [
      "I'm feeling a bit under the weather today - might have caught something from the hostel mess.",
      "Had a family emergency that needs my immediate attention.",
      "Feeling really unwell today, don't want to risk spreading anything to classmates.",
      "Transportation issues due to the weather conditions.",
      "Need to handle an urgent administrative matter at the university office.",
    ];

    if (weatherCondition.includes('rain')) {
      return "The heavy rain has caused severe transportation issues in my area.";
    } else if (mood === 'tired') {
      return "I'm feeling really unwell today and need to rest to recover properly.";
    } else if (mood === 'lazy') {
      return "I have a family commitment that I can't postpone.";
    }

    return excuses[Math.floor(Math.random() * excuses.length)];
  }

  private getFallbackAnalysis(attendancePercentage: number, daysUntilExam: number, decision: string): string {
    if (decision === 'bunk') {
      return `Your attendance is at ${attendancePercentage}%, which gives you some flexibility. With ${daysUntilExam} days until your exam, you have time to catch up on missed material.`;
    } else if (decision === 'risky') {
      return `Your attendance is at ${attendancePercentage}%, which is borderline. Consider the importance of today's class content before making your final decision.`;
    } else {
      return `Your attendance is at ${attendancePercentage}%, and with only ${daysUntilExam} days until your exam, it's better to attend and stay on track.`;
    }
  }
}
