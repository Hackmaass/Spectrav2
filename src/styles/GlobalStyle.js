import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  :root,
  [data-theme='light'],
  [data-theme='dark'] {
    --bg: #0A0A0B;
    --bg-surface: #0A0A0B;
    --bg-surface-low: #0A0A0B;
    --bg-surface-container: #0A0A0B;
    --color-primary: #FFFFFF;
    --color-secondary: #E5E5E5;
    --color-on-primary: #0A0A0B;
    --border-color: rgba(255, 255, 255, 0.1);
    --border-muted: rgba(255, 255, 255, 0.08);
    --grid-color: rgba(255, 255, 255, 0.06);
    --dot-color: rgba(255, 255, 255, 0.08);
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: ${({ theme }) => theme.fonts?.primary || "'Poppins', sans-serif"};
    background-color: #0A0A0B;
    color: #FFFFFF;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    transition: background-color 0.25s ease, color 0.25s ease;
  }

  #root {
    min-height: 100vh;
    background-color: #0A0A0B;
    color: #FFFFFF;
  }

  /* Custom utility for the neon purple glow */
  .neon-glow {
    box-shadow: 0 0 12px rgba(176, 38, 255, 0.4),
                0 0 24px rgba(176, 38, 255, 0.2);
    border: 1px solid ${({ theme }) => theme.colors?.neonPurple || '#B026FF'};
  }

  /* Subtle glassmorphic borders */
  .glass-border {
    border: 1px solid ${({ theme }) => theme.colors?.borderGlass || 'rgba(255, 255, 255, 0.1)'};
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    background: rgba(10, 10, 11, 0.55);
  }

  /* Scrollbar styles to match the terminal feel */
  ::-webkit-scrollbar {
    width: 4px;
  }
  ::-webkit-scrollbar-track {
    background: #0A0A0B;
  }
  ::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 99px;
  }

  button, input, textarea {
    font-family: inherit;
    color: #FFFFFF;
  }
`;
