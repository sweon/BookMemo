# LLMemo

A local-first, offline-capable PWA to log, manage, and search LLM interaction results. Built with Vite, React, TypeScript, and Dexie.js.

## Features

- **Offline Support**: Fully functional PWA that works offline.
- **Data Privacy**: All data is stored locally in your browser (IndexedDB).
- **Markdown & Math**: Write logs with full Markdown and LaTeX math support ($ E=mc^2 $).
- **Organization**: Tag logs, categorize by LLM Model, and search instantly.
- **Backup**: Export your data to JSON and restore/merge it later.

## Getting Started

### Prerequisites

- Node.js (v18+)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/llmemo.git
   cd llmemo
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## Deployment on GitHub Pages

This project is configured to deploy automatically to GitHub Pages using GitHub Actions.

1. Push the code to a GitHub repository.
2. Go to repository **Settings** > **Pages**.
3. Under **Build and deployment**, select **Source** as `Deploy from a branch`.
4. However, with the included workflow, you actually don't need to configure much if you let the Action handle it. The action pushes to `gh-pages` branch.
5. So, go to **Settings** > **Pages** and ensure the **Branch** is set to `gh-pages` / `root`.

## License

MIT
