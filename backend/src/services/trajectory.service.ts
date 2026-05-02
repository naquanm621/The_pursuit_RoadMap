export interface TrajectoryInfo {
  weight: number;
  trajectoryName: string;
}

export class TrajectoryService {
  // Prime mapping for core curriculum skills (Weeks 1-8)
  private static readonly skillPrimes: Record<string, number> = {
    'AI Fundamentals': 2,
    'Foundations & Automation': 3,
    'Problem ID & Ideation': 5,
    'Workflow Automation': 7,
    'Data Management': 11,
    'UX/UI Principles': 13,
    'Testing & Debugging': 17,
    'Synthesis & Showcase': 19,
  };

  /**
   * Calculates the weight (W) as the product of primes for each unique skill.
   */
  static calculateWeight(skills: string[]): number {
    const uniqueSkills = [...new Set(skills)];
    return uniqueSkills.reduce((product, skill) => {
      const prime = this.skillPrimes[skill] || 1; // Default to 1 if skill not in core curriculum
      return product * prime;
    }, 1);
  }

  /**
   * Maps a weight to a specific AI career trajectory.
   * This uses a deterministic mapping based on prime factors.
   */
  static getTrajectoryName(weight: number): string {
    if (weight === 1) return "Aspiring AI Explorer";

    // Example mapping logic based on key skill combinations (prime products)
    // Week 1+2 (2*3=6): AI Automation Initiate
    // Week 1+2+3 (2*3*5=30): Product Strategist
    // All 8 Weeks (2*3*5*7*11*13*17*19=9,699,690): Master AI Architect
    
    if (weight % 9699690 === 0) return "Master AI Architect";
    if (weight % 510510 === 0) return "AI Full-Stack Specialist"; // 1-7
    if (weight % 30030 === 0) return "AI Product Engineer"; // 1-6
    if (weight % 2310 === 0) return "AI Data Engineer"; // 1-5
    if (weight % 210 === 0) return "AI Workflow Automator"; // 1-4
    if (weight % 30 === 0) return "AI Product Strategist"; // 1-3
    if (weight % 6 === 0) return "AI Automation Initiate"; // 1-2
    if (weight % 2 === 0) return "AI Prompting Specialist"; // 1
    
    // Custom combinations
    if (weight % 143 === 0) return "Data-Driven UX Specialist"; // 11 (Data) * 13 (UX)
    if (weight % 35 === 0) return "Workflow Designer"; // 5 (Problem ID) * 7 (Workflow)
    
    return "Custom AI Specialist";
  }

  /**
   * Processes new skills to update weight and trajectory.
   */
  static updateTrajectory(currentWeight: number, newSkills: string[]): TrajectoryInfo {
    const newWeight = this.calculateWeight(newSkills);
    const combinedWeight = currentWeight * newWeight; // Since primes, W = W_old * W_new (if newSkills are disjoint)
    // Actually, rule says W is product of ALL skills. 
    // If input is total list of skills, we just calculate it.
    // Let's assume input to this specific method is the full list or just new ones.
    // The prompt says "Input: [List of Skills]". 
    
    return {
      weight: newWeight,
      trajectoryName: this.getTrajectoryName(newWeight)
    };
  }
}
