export default interface RetroItem {
  id: string;
  category: string;
  created: number;
  message: string;
  votes: number;
  done: boolean;
}

export const makeRetroItem = (id: string): RetroItem => ({
  id,
  category: '',
  created: 0,
  message: '',
  votes: 0,
  done: false,
});
