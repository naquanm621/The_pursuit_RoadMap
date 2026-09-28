export declare class GeminiService {
    private static runWithModelFallback;
    static processScreenshots(imagePaths: string[]): Promise<any>;
    static getChatResponse(message: string, history: any[], trajectoryName?: string): Promise<string | undefined>;
    private static searchDuckDuckGo;
    static matchJobDescription(jobDescription: string, skills: string[]): Promise<any>;
    static getCombinedCareerPath(skills: string[], gaps?: string[], trajectoryName?: string, existingTitles?: string[]): Promise<any[]>;
}
//# sourceMappingURL=gemini.service.d.ts.map