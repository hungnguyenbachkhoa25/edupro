## Packages
canvas-confetti | Celebration effect when completing a test
@types/canvas-confetti | Types for canvas-confetti
recharts | Dashboard analytics and progress charts

## Notes
Tailwind Config - extend fontFamily:
fontFamily: {
  sans: ["var(--font-sans)"],
  display: ["var(--font-display)"],
}

The backend API is assumed to expose:
GET /api/tests - Returns list of tests
GET /api/tests/:id - Returns a test and its questions
GET /api/results - Returns user's past test results
POST /api/results - Submits a test result
