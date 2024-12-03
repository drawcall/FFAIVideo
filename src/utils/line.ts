import { PUNCTUATIONS } from '../config/constant';
import { removeSpecialCharacters } from './char';

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
  getEqualedLine,
  normalizeWhitespace,
  cleanString,
  cleanSentences,
  resetScriptLinesContent,
  addPunctuationToParagraph,
  splitSubtitleByPunctuation,
};
