import { createStorage } from './storage';

export const Player = createStorage('Player');
export const Round = createStorage('Round');
export const Payment = createStorage('Payment');
export const PlayerRating = createStorage('PlayerRating');

export async function uploadFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve({ file_url: e.target.result });
    reader.readAsDataURL(file);
  });
}
