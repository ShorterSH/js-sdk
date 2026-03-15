import * as readline from 'node:readline';

export function prompt(question: string): Promise<string | null> {
  if (!process.stdin.isTTY) return Promise.resolve(null);

  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

export async function confirm(question: string): Promise<boolean> {
  const answer = await prompt(`${question} [y/N] `);
  return answer !== null && /^y(es)?$/i.test(answer);
}
