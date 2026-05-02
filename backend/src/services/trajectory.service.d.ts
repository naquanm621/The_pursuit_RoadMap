export interface TrajectoryInfo {
    weight: number;
    trajectoryName: string;
}
export declare class TrajectoryService {
    private static readonly skillPrimes;
    /**
     * Calculates the weight (W) as the product of primes for each unique skill.
     */
    static calculateWeight(skills: string[]): number;
    /**
     * Maps a weight to a specific AI career trajectory.
     * This uses a deterministic mapping based on prime factors.
     */
    static getTrajectoryName(weight: number): string;
    /**
     * Processes new skills to update weight and trajectory.
     */
    static updateTrajectory(currentWeight: number, newSkills: string[]): TrajectoryInfo;
}
//# sourceMappingURL=trajectory.service.d.ts.map