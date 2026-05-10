export interface MockLink {
  id: string;
  title: string;
  url: string;
}

export interface MockGroup {
  id: string;
  name: string;
  links: MockLink[];
}

export const mockGroups: MockGroup[] = [
  {
    id: 'work',
    name: '工作',
    links: [
      { id: 'w1', title: 'Linear', url: 'https://linear.app' },
      { id: 'w2', title: 'Notion', url: 'https://notion.so' },
      { id: 'w3', title: 'Figma', url: 'https://figma.com' },
      { id: 'w4', title: 'Slack', url: 'https://slack.com' },
      { id: 'w5', title: 'Calendar', url: 'https://calendar.google.com' },
    ],
  },
  {
    id: 'ai',
    name: 'AI',
    links: [
      { id: 'a1', title: 'ChatGPT', url: 'https://chat.openai.com' },
      { id: 'a2', title: 'Claude', url: 'https://claude.ai' },
      { id: 'a3', title: 'Gemini', url: 'https://gemini.google.com' },
      { id: 'a4', title: 'Perplexity', url: 'https://perplexity.ai' },
      { id: 'a5', title: 'v0', url: 'https://v0.dev' },
    ],
  },
  {
    id: 'dev',
    name: '开发',
    links: [
      { id: 'd1', title: 'GitHub', url: 'https://github.com' },
      { id: 'd2', title: 'MDN', url: 'https://developer.mozilla.org' },
      { id: 'd3', title: 'npm', url: 'https://npmjs.com' },
      { id: 'd4', title: 'Stack Overflow', url: 'https://stackoverflow.com' },
      { id: 'd5', title: 'CanIUse', url: 'https://caniuse.com' },
    ],
  },
];
