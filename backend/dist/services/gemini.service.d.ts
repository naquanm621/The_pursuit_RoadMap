export declare class GeminiService {
    /**
     * Helper to execute a model call with fallback to 1.5-flash if 2.0-flash fails with 429
     */
    private static runWithModelFallback;
    /**
     * Processes curriculum screenshots to extract a structured syllabus.
     */
    static processScreenshots(imagePaths: string[]): Promise<any>;
    /**
     * Generates a tutoring/logging response for the Journey Log.
     */
    static getChatResponse(message: string, history: any[], trajectoryName?: string): Promise<string | undefined>;
    /**
     * Search using DuckDuckGo (free, no API key needed)
     */
    private static searchDuckDuckGo;
    /**
     * Generates a dynamic career path with mesh coordinates.
     */
    static getCombinedCareerPath(skills: string[], gaps?: string[], trajectoryName?: string, existingTitles?: string[]): Promise<any>;
}
//# sourceMappingURL=gemini.service.d.ts.map