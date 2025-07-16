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
    attendancePercentage: number,
    dayOfWeek: string,
    recentAttendance: string,
    trendingExcuses: string
  ): Promise<string> {
    if (!this.apiKey) {
      return this.getFallbackExcuse(mood, weatherCondition);
    }

    const prompt = `Generate a realistic, practical excuse for missing class.
Context:
- Student is feeling: ${mood}
- Weather condition: ${weatherCondition}
- Professor is: ${professorStrictness}
- Current attendance: ${attendancePercentage}%
- Today is: ${dayOfWeek}
- Recent attendance: ${recentAttendance}
- Trending excuses among students: ${trendingExcuses}

Guidelines:
- The excuse should be short (1-2 sentences).
- It must sound like something a real student would say to a professor in daily life.
- Use simple, clear English.
- Avoid fantasy, jokes, or anything that sounds made up.
- Example excuses:
  - "I had a mild fever this morning and didn't want to risk coming to class."
  - "There was a traffic jam due to heavy rain, and I couldn't reach on time."
  - "I had to help my family with an urgent matter at home."
  - "I had a doctor's appointment that I couldn't reschedule."
  - "I was feeling very tired and needed to rest to recover."

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

  private getFallbackExcuse(mood: string, weatherCondition: string, professorStrictness?: string): string {
    // Context-specific excuses
    const healthExcuses = [
      "I'm feeling really unwell today and need to rest to recover properly.",
      "I'm experiencing a severe migraine and need to rest in a quiet environment.",
      "I'm feeling mentally exhausted and need a day to recover to avoid burnout.",
      "I had a mild fever this morning and didn't want to risk coming to class.",
      "I had to stay back to take care of a sick sibling who is unwell.",
    ];
    const weatherExcuses = [
      "The heavy rain has caused severe transportation issues in my area.",
      "There was a traffic jam due to heavy rain, and I couldn't reach on time.",
      "My bus broke down on the way to college because of the weather, and there were no alternatives available.",
      "Flooded roads in my neighborhood made it impossible to get to class today.",
      "The storm warning in my area made it unsafe to travel to campus.",
    ];
    const familyExcuses = [
      "Had a family emergency that needs my immediate attention.",
      "I had to accompany a family member to a medical appointment this morning.",
      "I had to help my family with an urgent matter at home.",
      "There was an unexpected maintenance issue at home that I had to help resolve.",
      "I had to attend to a family commitment that couldn't be postponed.",
    ];
    const transportExcuses = [
      "My bus broke down on the way to college, and there were no alternatives available.",
      "I was caught up in unexpected traffic due to a local event.",
      "There was a strike affecting public transport in my area.",
      "I missed my usual train due to delays and couldn't find another way in time.",
    ];
    const techExcuses = [
      "There was a power outage at home, and I couldn't finish an important assignment in time.",
      "My internet was down, and I couldn't access the online class materials in time.",
      "My laptop stopped working this morning, and I had to get it repaired urgently.",
    ];
    const adminExcuses = [
      "Need to handle an urgent administrative matter at the university office.",
      "I had to attend an urgent bank appointment that couldn't be rescheduled.",
      "I had to submit important documents at the college office during class time.",
    ];
    const formalExcuses = [
      "I had a doctor's appointment that I couldn't reschedule.",
      "I was advised by my doctor to rest today due to health reasons.",
      "I had to attend a mandatory government appointment this morning.",
    ];
    const examExcuses = [
      "I'm feeling overwhelmed with exam preparation and needed extra time to study.",
      "I stayed up late last night revising for upcoming exams and couldn't wake up in time.",
      "I needed to attend a group study session for an important test coming up soon.",
    ];
    const mentalHealthExcuses = [
      "I'm feeling anxious and needed a day to focus on my mental health.",
      "I've been under a lot of stress lately and needed a break to avoid burnout.",
      "I had a counseling appointment to help manage academic pressure.",
    ];
    const peerPressureExcuses = [
      "My friends convinced me to join them for a club activity during class hours.",
      "There was a major student event on campus that everyone was attending.",
      "I was asked to help organize a college fest event that overlapped with class.",
    ];
    const localEventExcuses = [
      "There was a local festival in my area, and the roads were blocked.",
      "A community event required my participation this morning.",
      "There was a sudden public holiday declared in my locality, causing confusion.",
    ];

    // Contextual selection (expanded)
    if (weatherCondition && weatherCondition.toLowerCase().includes('rain')) {
      return weatherExcuses[Math.floor(Math.random() * weatherExcuses.length)];
    }
    if (weatherCondition && (weatherCondition.toLowerCase().includes('storm') || weatherCondition.toLowerCase().includes('thunder'))) {
      return weatherExcuses[Math.floor(Math.random() * weatherExcuses.length)];
    }
    if (mood === 'tired') {
      // 50% chance to return a mental health excuse
      if (Math.random() < 0.5) {
        return mentalHealthExcuses[Math.floor(Math.random() * mentalHealthExcuses.length)];
      }
      return healthExcuses[Math.floor(Math.random() * healthExcuses.length)];
    }
    if (mood === 'lazy') {
      // 30% chance to return a peer pressure excuse
      if (Math.random() < 0.3) {
        return peerPressureExcuses[Math.floor(Math.random() * peerPressureExcuses.length)];
      }
      return familyExcuses[Math.floor(Math.random() * familyExcuses.length)];
    }
    if (mood === 'energetic') {
      // 20% chance to return a local event excuse
      if (Math.random() < 0.2) {
        return localEventExcuses[Math.floor(Math.random() * localEventExcuses.length)];
      }
      return techExcuses[Math.floor(Math.random() * techExcuses.length)];
    }
    if (professorStrictness === 'strict') {
      return formalExcuses[Math.floor(Math.random() * formalExcuses.length)];
    }
    // If days until exam is low, use exam stress excuses
    if (typeof arguments[3] === 'number' && arguments[3] <= 7) {
      return examExcuses[Math.floor(Math.random() * examExcuses.length)];
    }
    // General pool
    const allExcuses = [
      ...healthExcuses,
      ...weatherExcuses,
      ...familyExcuses,
      ...transportExcuses,
      ...techExcuses,
      ...adminExcuses,
      ...formalExcuses,
      ...examExcuses,
      ...mentalHealthExcuses,
      ...peerPressureExcuses,
      ...localEventExcuses,
      "I'm feeling a bit under the weather today - might have caught something from the hostel mess.",
      "Transportation issues due to the weather conditions.",
    ];
    return allExcuses[Math.floor(Math.random() * allExcuses.length)];
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
