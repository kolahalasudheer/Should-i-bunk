interface ScoringInputs {
  attendancePercentage: number;
  daysUntilExam: number;
  mood: string;
  professorStrictness: string;
  weatherScore: number;
}

interface ScoringWeights {
  attendance: number;
  examProximity: number;
  mood: number;
  weather: number;
  professorStrictness: number;
}

export class ScoringService {
  private weights: ScoringWeights = {
    attendance: 0.4,
    examProximity: 0.2,
    mood: 0.15,
    weather: 0.15,
    professorStrictness: 0.1,
  };

  calculateBunkScore(inputs: ScoringInputs): number {
    const attendanceScore = this.calculateAttendanceScore(inputs.attendancePercentage);
    const examProximityScore = this.calculateExamProximityScore(inputs.daysUntilExam);
    const moodScore = this.calculateMoodScore(inputs.mood);
    const professorScore = this.calculateProfessorScore(inputs.professorStrictness);

    const totalScore = 
      (attendanceScore * this.weights.attendance) +
      (examProximityScore * this.weights.examProximity) +
      (moodScore * this.weights.mood) +
      (inputs.weatherScore * this.weights.weather) +
      (professorScore * this.weights.professorStrictness);

    return Math.round(Math.max(0, Math.min(100, totalScore)));
  }

  private calculateAttendanceScore(percentage: number): number {
    // Higher attendance = higher bunk score (more flexibility)
    if (percentage >= 90) return 90;
    if (percentage >= 80) return 75;
    if (percentage >= 75) return 50; // Minimum requirement
    if (percentage >= 70) return 25;
    return 0; // Too risky to bunk
  }

  private calculateExamProximityScore(daysUntilExam: number): number {
    // More days = higher bunk score (safer to bunk)
    if (daysUntilExam >= 30) return 90;
    if (daysUntilExam >= 14) return 75;
    if (daysUntilExam >= 7) return 60;
    if (daysUntilExam >= 3) return 30;
    return 10; // Exam is very close
  }

  private calculateMoodScore(mood: string): number {
    switch (mood) {
      case 'tired':
        return 70; // Good reason to bunk
      case 'lazy':
        return 80; // Classic bunk mood
      case 'energetic':
        return 20; // Should probably attend
      default:
        return 50;
    }
  }

  private calculateProfessorScore(strictness: string): number {
    switch (strictness) {
      case 'chill':
        return 80; // More forgiving
      case 'moderate':
        return 50; // Neutral
      case 'strict':
        return 20; // Risky to bunk
      default:
        return 50;
    }
  }

  getDecisionFromScore(score: number): string {
    if (score > 70) return 'bunk';
    if (score >= 50) return 'risky';
    return 'attend';
  }

  getDecisionColor(decision: string): string {
    switch (decision) {
      case 'bunk':
        return 'secondary'; // Green
      case 'risky':
        return 'warning'; // Yellow
      case 'attend':
        return 'danger'; // Red
      default:
        return 'secondary';
    }
  }

  getDecisionIcon(decision: string): string {
    switch (decision) {
      case 'bunk':
        return 'fas fa-check';
      case 'risky':
        return 'fas fa-question';
      case 'attend':
        return 'fas fa-times';
      default:
        return 'fas fa-question';
    }
  }
}
