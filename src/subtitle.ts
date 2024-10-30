import fs from 'fs-extra';
import { clone } from 'lodash';
import { SubMaker } from './sub-maker';
import { formatter } from './utils/date';
import {
  insertStringAt,
  getSubarrayInfo,
  normalizeWhitespace,
  safeDecodeURIComponent,
} from './utils/char';
import {
  isLineEqual,
  splitSubtitleByPunctuation,
  extractMatchedLine,
} from './utils/line';
import { Logger } from './utils/log';

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
  let scriptLinesIndex = 0;
  let subLine = '';

  try {
    const scriptLinesc = segmentLinesBasedOnSubtitles(
      subMaker,
      scriptLines,
      subtitleMaxWidth,
    );

    for (let i = 0; i < subMaker.offset.length; i++) {
      let [offset, sub] = [subMaker.offset[i], subMaker.subs[i]];
      const [initialStartTime, endTime] = offset; // Assume offset is an array or tuple
      if (startTime < 0) {
        startTime = initialStartTime;
      }

      subLine += safeDecodeURIComponent(sub);
      const matchedLine = extractMatchedLine(
        scriptLinesc,
        scriptLinesIndex,
        subLine,
      );
      if (matchedLine) {
        scriptLinesIndex++;
        const subtitle = formatter(
          scriptLinesIndex,
          startTime,
          endTime,
          matchedLine,
        );
        formattedSubtitles.push(subtitle);
        startTime = -1.0;
        subLine = '';
      }
    }

    // write file
    if (formattedSubtitles.length > 2) {
      await fs.writeFile(subtitleFile, formattedSubtitles.join('\n') + '\n', {
        encoding: 'utf-8',
      });
      Logger.log(`Subtitle synthesis successful. ${formattedSubtitles.length}`);
    } else {
      Logger.log(
        `Sorry, extractMatchedLine no vocabulary matched. ${formattedSubtitles.length}`,
      );
      await fs.writeFile(subtitleFile, '', { encoding: 'utf-8' });
    }

    if (formattedSubtitles.length !== scriptLinesc.length) {
      Logger.warn(
        `formattedSubtitles.length != scriptLines.length, formattedSubtitles len: ${formattedSubtitles.length}, scriptLines len: ${scriptLinesc.length}`,
      );
    }
  } catch (e) {
    Logger.error(`failed, error: ${e}`);
  }
};

const segmentLinesBasedOnSubtitles = (
  subMaker: SubMaker,
  scriptLines: string[],
  subtitleMaxWidth: number,
): string[] => {
  let scriptLinesIndex = 0;
  let subLines = [];
  let scriptLinesc = clone(scriptLines);

  for (let i = 0; i < subMaker.offset.length; i++) {
    const sub = subMaker.subs[i];
    subLines.push(safeDecodeURIComponent(sub));
    const matched = isLineMatch(
      scriptLinesc,
      scriptLinesIndex,
      subLines.join(''),
    );

    if (matched) {
      const lineStr = scriptLinesc[scriptLinesIndex];
      if (lineStr.length > subtitleMaxWidth) {
        const [index, len, subline] = getSubarrayInfo(
          subLines,
          subtitleMaxWidth,
        );
        const line = lineStr.slice(0, len);
        if (index > 0 && isLineEqual(subline, line)) {
          scriptLinesc[scriptLinesIndex] = insertStringAt(lineStr, len, SIGN);
        }
      }

      scriptLinesIndex++;
      subLines.length = 0;
    }
  }

  return splitArrayItemsBySign(scriptLinesc);
};

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

const isLineMatch = (
  scriptLines: string[],
  scriptLinesIndex: number,
  subLine: string,
): boolean => {
  if (scriptLines.length <= scriptLinesIndex) {
    return false;
  }
  const line = scriptLines[scriptLinesIndex];
  return isLineEqual(line, subLine);
};

export { generateSubtitle };
