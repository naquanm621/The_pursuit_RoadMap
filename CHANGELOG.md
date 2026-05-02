# Pursuit Roadmap - Project Changelog

All major updates and architectural changes for the Pursuit AI Native Journey application.

## [1.0.0] - 2026-05-01

### Added
- **Futuristic Login System**: Integrated a high-fidelity "In Pursuit" login page with `@pursuit.org` email validation.
- **Onboarding Experience**: Implemented a pre-skill collection system that feeds into the AI career discovery engine.
- **AI Journey Log**: Added a dedicated chat interface with a "Pursuit Build Instructor" persona for MVP scoping and technical tutoring.
- **Dynamic Roadmap Mesh**: Developed a non-linear roadmap that connects nodes based on the user's specific completion order.
- **Skill Review HUD**: Created floating banners for every week node providing detailed curriculum summaries on hover.
- **Multi-Platform Job Match**: Integrated direct search linking for Indeed, LinkedIn, and Glassdoor with AI-optimized queries.
- **Knowledge Graph**: Added a real-time sidebar in the Journey Log tracking learned skills and AI-discovered career branches.

### Changed
- **Backend Architecture**: Migrated to a dual-model system using `gemini-2.0-flash` for complex career mapping and `gemini-1.5-flash` for high-frequency chat tutoring.
- **Curriculum Mapping**: Updated all 8 weeks to align with the Pursuit.org AI Native curriculum.
- **API Resilience**: Implemented randomized neural fallbacks and frontend debouncing (1s) to handle API rate limits gracefully.

### Technical Specs
- **Frontend**: React, Tailwind CSS 4, Motion (formerly Framer Motion), Lucide Icons.
- **Backend**: Node.js, Express, Google Generative AI SDK.
- **AI Models**: Gemini 2.0 Flash (Discovery), Gemini 1.5 Flash (Tutoring).
