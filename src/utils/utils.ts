import { v4 as uuidv4 } from 'uuid';
import { sample, sampleSize } from 'lodash';

const PUNCTUATIONS: string[] = [
  '!',
  '"',
  '#',
  '$',
  '%',
  '&',
  "'",
  '(',
  ')',
  '*',
  '+',
  ',',
  '-',
  '.',
  '/',
  ':',
  ';',
  '<',
  '=',
  '>',
  '?',
  '@',
  '[',
  '\\',
  ']',
  '^',
  '_',
  '`',
  '{',
  '|',
  '}',
  '~',
];

const strContainsPunctuation = (word: string): boolean => {
  for (const p of PUNCTUATIONS) {
    if (word.includes(p)) {
      return true;
    }
  }
  return false;
};

const getEnumKeyByValue = <T extends string>(
  obj: { [key: string]: T },
  value: T,
): string => {
  for (const key in obj) {
    if (obj[key] === value) {
      return key as any;
    }
  }
  throw new Error(`No key found for value: ${value}`);
};

const uuid = (length: number = -1): string => {
  let u = uuidv4();
  u = u.replace(/-/g, '');
  if (length > 0) {
    u = u.slice(0, length);
  }
  return u;
};

const greater = (a: number, b: number) => {
  return a >= b;
};

const less = (a: number, b: number) => {
  return a < b;
};

const convertHexToAssColor = (hexColor: string): string => {
  if (/^\&H00/g.test(hexColor)) return hexColor;

  let hex = hexColor.replace('#', '');
  if (hex.length !== 6) {
    throw new Error('Invalid hex color format. Expected format: #RRGGBB');
  }
  let r = hex.substring(0, 2);
  let g = hex.substring(2, 4);
  let b = hex.substring(4, 6);
  let assColor = `&H00${b}${g}${r}`;
  return assColor;
};

const insertTriplet = (arr: any[], a: any, b: any, c: any) => {
  const n = arr.length / 3;
  arr.splice(n * 1, 0, a);
  arr.splice(n * 2 + 1, 0, b);
  arr.splice(n * 3 + 2, 0, c);
  return arr;
};

const getSampleItems = (items: any[], count: number) => {
  if (items.length === 0) return items;

  let randoms = sampleSize(items, count);
  while (randoms.length < count) {
    randoms = randoms.concat(sample(items));
  }
  return randoms.slice(0, count);
};

export {
  uuid,
  less,
  greater,
  insertTriplet,
  getSampleItems,
  getEnumKeyByValue,
  strContainsPunctuation,
  convertHexToAssColor,
};
