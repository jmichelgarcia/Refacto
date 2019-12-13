import {
  RetroItem,
  RetroItemAttachment,
  RetroData,
  Retro,
} from 'refacto-entities';
import json from './json';

export const extractRetroItem = json.exactObject<RetroItem>({
  id: json.string,
  category: json.string,
  created: json.number,
  message: json.string,
  attachment: json.nullable(json.exactObject<RetroItemAttachment>({
    type: json.string,
    url: json.string,
  })),
  votes: json.number,
  doneTime: json.number,
});

export const extractRetroData = json.exactObject<RetroData>({
  format: json.string,
  options: json.record,
  items: json.array(extractRetroItem),
});

export const extractRetro = json.exactObject<Retro>({
  id: json.string,
  slug: json.string,
  name: json.string,
  ownerId: json.string,
  state: json.record,
  format: json.string,
  options: json.record,
  items: json.array(extractRetroItem),
});
