export const SITE_URL = 'https://connorabdelnoor.com';
export const SITE_NAME = 'Connor Abdelnoor';
export const SITE_TITLE = "Connor's AI Agent | Connor Abdelnoor";
export const SHARE_TITLE = "Connor's AI Agent: paid to answer questions about him.";
export const STATIC_PORTFOLIO_URL = 'https://connorabdelnoor.github.io';
export const GITHUB_URL = 'https://github.com/lvampa';
export const LINKEDIN_URL = 'https://www.linkedin.com/in/connorabdelnoor/';
export const SITE_DESCRIPTION =
  'Connor Abdelnoor is a software engineer who builds enterprise software from user interfaces to infrastructure. Ask his AI agent about his work.';

export const PERSON_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Connor Abdelnoor',
  url: SITE_URL,
  jobTitle: 'Software Engineer',
  description:
    'Software engineer who designs scalable enterprise software from user interfaces to infrastructure, leads high-performing teams, and works with executives to turn strategic goals into technical requirements. This site is an AI agent that answers questions about him.',
  knowsAbout: [
    'Software Engineering',
    'AWS',
    'Figma',
    'Web Development',
    'React',
    'Infrastructure as Code',
    'RAG',
    'AI Agents',
  ],
  sameAs: [STATIC_PORTFOLIO_URL, GITHUB_URL, LINKEDIN_URL],
};

export const EXAMPLE_QUESTIONS = [
  'What has Connor built on AWS?',
  'How does Connor lead a team?',
  'What tech does Connor use day to day?',
];
