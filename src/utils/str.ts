import { PUNCTUATIONS } from '../config/constant';

const matchLine = (
  scriptLines: string[],
  subLine: string,
  subIndex: number,
): boolean => {
  if (scriptLines.length <= subIndex) {
    return false;
  }
  const line = scriptLines[subIndex];
  return matchStr(line, subLine);
};

const removeSpecialCharacters = (str: string) => {
  const cnRegex =
    /[，。！？、；：“”‘’（）《》【】〈〉「」『』【】〔〕〖〗〈〉《》「」『』【】〔〕【】﹝﹞（）［］｛｝＜＞﹤﹥「」『』【】＜＞《》「」『』【】]/g;
  const enRegex = /[!"#$%&'()*+,\-./:;<=>?@\[\]^_`{|}~]/g;
  return str.replace(cnRegex, '').replace(enRegex, '');
};

const matchStr = (line: string, subLine: string): boolean => {
  if (subLine === line) {
    return true;
  }

  const cleanedSubLine = removeSpecialCharacters(subLine);
  const cleanedLine = removeSpecialCharacters(line);
  if (cleanedSubLine === cleanedLine) {
    return true;
  }

  return false;
};

const getMatchLineStr = (
  scriptLines: string[],
  subLine: string,
  subIndex: number,
): string => {
  if (scriptLines.length <= subIndex) {
    return '';
  }

  const line = scriptLines[subIndex];
  if (subLine === line) {
    return scriptLines[subIndex].trim();
  }

  const cleanedSubLine = removeSpecialCharacters(subLine);
  const cleanedLine = removeSpecialCharacters(line);
  if (cleanedSubLine === cleanedLine) {
    return cleanedLine;
  }

  return '';
};

const replaceSpecialChar = (text: string): string => {
  return text
    .replace('\n', ' ')
    .replace('[', ' ')
    .replace(']', ' ')
    .replace('(', ' ')
    .replace(')', ' ')
    .replace('{', ' ')
    .replace('}', ' ')
    .trim();
};

// "Hello, world! This is an example. Sentence number two.";
// Output: [ 'Hello', ' world', ' This is an example', ' Sentence number two', '' ]
const splitSubtitleString = (s: string, maxWidth: number = 9999): string[] => {
  const result: string[] = [];
  let txt = '';
  for (const char of s) {
    if (!PUNCTUATIONS.includes(char) && txt.length < maxWidth) {
      txt += char;
    } else {
      result.push(txt.trim());
      txt = '';
    }
  }
  return result;
};

const splitStringAtIndex = (arr: string[], index: number, x: number) => {
  if (index >= 0 && index < arr.length) {
    const str = arr[index];
    if (x >= 0 && x < str.length) {
      const firstPart = str.slice(0, x);
      const secondPart = str.slice(x);
      arr.splice(index, 1, firstPart, secondPart);
    }
  }
  return arr;
};

const getSplitIndexAndLenth = (
  arr: string[],
  max: number,
): [number, number, string] => {
  let len = 0;
  let index = 0;
  let str = '';
  for (let i = 0; i < arr.length; i++) {
    if (len > max) {
      break;
    } else {
      len += arr[i].length;
      str += arr[i];
      index = i;
    }
  }
  return [index, len, str];
};

const insertAtIndex = (
  str: string,
  index: number,
  toInsert: string,
): string => {
  if (index > str.length || index < 0) {
    throw new Error('Index out of bounds');
  }
  return str.slice(0, index) + toInsert + str.slice(index);
};

const splitArrayItemsBySign = (arr: string[], sign: string): string[] => {
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    const item = arr[i];
    if (typeof item === 'string' && item.includes(sign)) {
      const parts = item.split(sign);
      result.push(...parts.filter(part => part !== ''));
    } else {
      result.push(item);
    }
  }
  return result;
};

const removeEmptyLines = (text: string) => {
  return text
    .split('\n')
    .filter(line => line.trim() !== '')
    .join('\n');
};

export {
  matchStr,
  matchLine,
  getMatchLineStr,
  insertAtIndex,
  removeEmptyLines,
  splitArrayItemsBySign,
  replaceSpecialChar,
  splitStringAtIndex,
  splitSubtitleString,
  getSplitIndexAndLenth,
};
