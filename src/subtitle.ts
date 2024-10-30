import { clone } from 'lodash';
import { SubMaker } from './sub-maker';
import { formatter } from './utils/date';
import {
  insertStringAt,
  normalizeWhitespace,
  safeDecodeURIComponent,
} from './utils/char';
import { getEqualedLine, splitSubtitleByPunctuation } from './utils/line';
import { writeSubtitles } from './utils/file';

const SIGN = '__x__';
const generateSubtitle = async (
  subMaker: SubMaker,
  text: string,
  subtitleFile: string,
  subtitleMaxWidth: number,
): Promise<void> => {
  const formattedSubtitles: string[] = [];
  let scriptLines = splitSubtitleByPunctuation(normalizeWhitespace(text));
  let startTime = -1.0;
  let endTime = -1.0;
  let scriptLinesIndex = 0;
  let subLine = '';

  const scriptLinesc = resplitScriptLinesByMaxWidth(
    subMaker,
    scriptLines,
    subtitleMaxWidth,
  );

  for (let i = 0; i < subMaker.offset.length; i++) {
    let [offset, sub] = [subMaker.offset[i], subMaker.subs[i]];
    const [starTime, enTime] = offset;
    if (startTime < 0) startTime = starTime;
    endTime = enTime;
    subLine += safeDecodeURIComponent(sub);

    // get equaled lineText
    let lineText = '';
    if (scriptLinesc.length > scriptLinesIndex) {
      const targetLine = scriptLinesc[scriptLinesIndex];
      lineText = getEqualedLine(targetLine, subLine);
    }

    // create new subtitle
    if (lineText) {
      scriptLinesIndex++;
      const subtitle = formatter(
        scriptLinesIndex,
        startTime,
        endTime,
        lineText,
      );
      formattedSubtitles.push(subtitle);
      startTime = -1.0;
      endTime = -1.0;
      subLine = '';
    }
  }

  await writeSubtitles(subtitleFile, formattedSubtitles, scriptLinesc.length);
};

const resplitScriptLinesByMaxWidth = (
  subMaker: SubMaker,
  scriptLines: string[],
  subtitleMaxWidth: number,
): string[] => {
  let scriptLinesc = clone(scriptLines);
  let scriptLinesIndex = 0;
  let subLine = '';
  let targetLine = '';

  for (let i = 0; i < subMaker.offset.length; i++) {
    const sub = subMaker.subs[i];
    const newWord = safeDecodeURIComponent(sub);
    subLine += newWord;

    // get equaled lineText
    let lineText = '';
    if (scriptLinesc.length > scriptLinesIndex) {
      targetLine = scriptLinesc[scriptLinesIndex];
      lineText = getEqualedLine(targetLine, subLine);
    }

    // If both lines exceed the length.
    if (
      targetLine.length > subtitleMaxWidth &&
      subLine.length > subtitleMaxWidth
    ) {
      scriptLinesc[scriptLinesIndex] = insertSIGNWord(targetLine, newWord);
    }

    if (lineText) {
      scriptLinesIndex++;
      targetLine = '';
      subLine = '';
    }
  }

  return splitArrayItemsBySign(scriptLinesc);
};

function insertSIGNWord(targetLine: string, newWord: string) {
  if (targetLine.endsWith(newWord)) {
    const insertPosition = targetLine.length - newWord.length;
    return insertStringAt(targetLine, insertPosition, SIGN);
  } else {
    const cleanTargetLine = targetLine.replace(/[ _《》]/g, '');
    const cleanNewWord = newWord.replace(/[ _《》]/g, '');
    if (cleanTargetLine.endsWith(cleanNewWord)) {
      let startIndex = targetLine.length - newWord.length;
      while (startIndex > 0) {
        const subString = targetLine.slice(startIndex);
        if (subString.replace(/[ _《》]/g, '') === cleanNewWord) {
          break;
        }
        startIndex--;
      }

      return insertStringAt(targetLine, startIndex, SIGN);
    }

    return targetLine;
  }

  return targetLine;
}

// ['apple', 'banana__x__cherry', 'date__x____x__fig', 'grape'];
// ['apple', 'banana', 'cherry', 'date', 'fig', 'grape']
const splitArrayItemsBySign = (target: string[]): string[] => {
  const result = [];
  for (let i = 0; i < target.length; i++) {
    const item = target[i];
    if (typeof item === 'string' && item.includes(SIGN)) {
      const parts = item.split(SIGN);
      result.push(...parts.filter(part => part !== ''));
    } else {
      result.push(item);
    }
  }
  return result;
};

export { generateSubtitle };
