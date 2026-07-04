// Local leaderboard stored in localStorage
export interface ScoreEntry {
  name: string;
  score: number;
  date: string;
}

const PREFIX = 'lampa_games_lb_';

export function getScores(gameId: string): ScoreEntry[] {
  try {
    const raw = localStorage.getItem(PREFIX + gameId);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

export function addScore(gameId: string, score: number, name = 'Player'): ScoreEntry[] {
  const scores = getScores(gameId);
  scores.push({ name, score, date: new Date().toLocaleDateString() });
  scores.sort((a, b) => b.score - a.score);
  const top = scores.slice(0, 10);
  localStorage.setItem(PREFIX + gameId, JSON.stringify(top));
  return top;
}

export function getHighScore(gameId: string): number {
  const scores = getScores(gameId);
  return scores.length > 0 ? scores[0].score : 0;
}
