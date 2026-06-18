import { PUNCTUATIONS } from '../config/constant';

// ---- from utils/char.ts ----

const removeSpecialCharacters = (str: string) => {
  const cnRegex =
    /[，。！？、；：“”‘’（）《》【】〈〉「」『』【】〔〕〖〗〈〉《》「」『』【】〔〕【】﹝﹞（）［］｛｝＜＞﹤﹥「」『』【】＜＞《》「」『』【】]/g;
  const enRegex = /[!"#$%&'()*+,\-./:;<=>?@\[\]^_`{|}~]/g;
  return str.replace(cnRegex, '').replace(enRegex, '');
};

const normalizeWhitespaceChar = (text: string): string => {
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

const insertStringAt = (
  str: string,
  index: number,
  toInsert: string,
): string => {
  if (index > str.length || index < 0) {
    throw new Error('Index out of bounds');
  }
  return str.slice(0, index) + toInsert + str.slice(index);
};

const safeDecodeURIComponent = (str: string) => {
  try {
    return decodeURIComponent(str);
  } catch (e) {
    return str;
  }
};

const removeBlankLines = (text: string) => {
  return text
    .split('\n')
    .filter(line => line.trim() !== '')
    .join('\n');
};

const addLineBreaks = (lineText: string, subtitleMaxWidth: number) => {
  let result = '';
  for (let i = 0; i < lineText.length; i += subtitleMaxWidth) {
    if (i + subtitleMaxWidth < lineText.length) {
      result += lineText.slice(i, i + subtitleMaxWidth) + '\\N';
    } else {
      result += lineText.slice(i, i + subtitleMaxWidth);
    }
  }
  return result;
};

// ---- from utils/line.ts ----

// const scriptLines = ["Hello, world!", "This is a test."];
// const scriptLinesIndex = 1;
// const subLine = "This is a test!";
// output: "This is a test"
const getEqualedLine = (
  targetLine: string,
  subLine: string,
  isChinese: boolean,
): string => {
  if (isChinese) {
    if (subLine === targetLine) {
      return targetLine.trim();
    }
  } else {
    if (subLine.trim() === targetLine.trim()) {
      return targetLine.trim();
    }
  }

  const cleanedSubLine = removeSpecialCharacters(subLine);
  const cleanedTargetLine = removeSpecialCharacters(targetLine);
  if (cleanedSubLine === cleanedTargetLine) {
    return cleanedTargetLine;
  }
  return '';
};

// "Hello, world! This is an example. Sentence number two.";
// Output: [ 'Hello', ' world', ' This is an example', ' Sentence number two', '' ]
const splitSubtitleByPunctuation = (
  s: string,
  maxWidth: number = 9999,
): string[] => {
  const result: string[] = [];
  let txt = '';
  for (const char of s) {
    if (!PUNCTUATIONS.includes(char) && txt.length < maxWidth) {
      txt += char;
    } else {
      result.push(txt.replace(/[\s\u3000]+/g, ' ').trim());
      txt = '';
    }
  }
  return result;
};

function cleanString(sentence: string): string {
  const punctuationRegex = new RegExp(`^[\\s${PUNCTUATIONS.join('')}]+`, 'g');
  return sentence.replace(punctuationRegex, '');
}

function cleanSentences(sentences: string[]): string[] {
  return sentences.map(cleanString);
}

const resetScriptLinesContent = (
  scriptLines: string[],
  scriptLinesIndex: number,
  subLine: string,
): void => {
  const lineText = scriptLines[scriptLinesIndex];
  const cleanedSubLine = removeSpecialCharacters(subLine);
  const cleanedLine = removeSpecialCharacters(lineText);

  if (cleanedSubLine.length > cleanedLine.length) {
    const excessStr = cleanedSubLine.slice(cleanedLine.length);
    if (scriptLines.length > scriptLinesIndex + 1) {
      const nextLine = scriptLines[scriptLinesIndex + 1];
      if (nextLine.startsWith(excessStr)) {
        scriptLines[scriptLinesIndex + 1] = nextLine.slice(excessStr.length);
      }
    }
  }
};

const normalizeWhitespace = (text: string): string => {
  return text.replace(/[\s\u3000]+/g, ' ').trim();
};

const addPunctuationToParagraph = (text: string) => {
  const chinesePunctuation = /[，。？！；]/;
  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    // 处理空行前的一行
    if (i < lines.length - 1 && lines[i + 1].trim() === '') {
      if (!chinesePunctuation.test(lines[i].slice(-1))) {
        lines[i] += '。';
      }
    }

    // 处理包含 1-3 个空格的情况
    const parts = lines[i].split(/\s+/);
    for (let j = 0; j < parts.length - 1; j++) {
      if (
        parts[j] &&
        parts[j + 1] &&
        !chinesePunctuation.test(parts[j].slice(-1)) &&
        !chinesePunctuation.test(parts[j + 1][0])
      ) {
        parts[j] += '。';
      }
    }
    lines[i] = parts.join(' ');
  }

  return lines.join('\n');
};

export {
  // from char
  removeSpecialCharacters,
  normalizeWhitespaceChar,
  splitStringAtIndex,
  insertStringAt,
  safeDecodeURIComponent,
  removeBlankLines,
  addLineBreaks,
  // from line
  getEqualedLine,
  normalizeWhitespace,
  cleanString,
  cleanSentences,
  resetScriptLinesContent,
  addPunctuationToParagraph,
  splitSubtitleByPunctuation,
};
