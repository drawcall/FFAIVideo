import { v4 as uuidv4 } from 'uuid';

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

const appequal = (a: number, b: number, c: number = 10) => {
  return Math.abs(a - b) < c;
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

export {
  uuid,
  appequal,
  getEnumKeyByValue,
  strContainsPunctuation,
  convertHexToAssColor,
};
