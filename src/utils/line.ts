import { PUNCTUATIONS } from '../config/constant';
import { removeSpecialCharacters } from './char';

const isLineEqual = (line: string, subLine: string): boolean => {
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

const extractMatchedLine = (
  scriptLines: string[],
  scriptLinesIndex: number,
  subLine: string,
): string => {
  if (scriptLines.length <= scriptLinesIndex) {
    return '';
  }

  const line = scriptLines[scriptLinesIndex];
  if (subLine === line) {
    return scriptLines[scriptLinesIndex].trim();
  }

  const cleanedSubLine = removeSpecialCharacters(subLine);
  const cleanedLine = removeSpecialCharacters(line);
  if (cleanedSubLine === cleanedLine) {
    return cleanedLine;
  } else if (cleanedSubLine.length > cleanedLine.length) {
    const excessStr = cleanedSubLine.slice(cleanedLine.length);
    if (scriptLines.length > scriptLinesIndex + 1) {
      const nextLine = scriptLines[scriptLinesIndex + 1];
      if (nextLine.startsWith(excessStr)) {
        scriptLines[scriptLinesIndex + 1] = nextLine.slice(excessStr.length);
      }
    }
    return cleanedSubLine;
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
      result.push(txt.trim());
      txt = '';
    }
  }
  return result;
};

const removeBlankLines = (text: string) => {
  return text
    .split('\n')
    .filter(line => line.trim() !== '')
    .join('\n');
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
  isLineEqual,
  extractMatchedLine,
  addPunctuationToParagraph,
  removeBlankLines,
  splitSubtitleByPunctuation,
};
