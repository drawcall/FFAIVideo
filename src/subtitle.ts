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
  isLineMatch,
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
  const subItems: string[] = [];
  let scriptLines = splitSubtitleByPunctuation(normalizeWhitespace(text));
  let startTime = -1.0;
  let subIndex = 0;
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
      const subText = extractMatchedLine(scriptLinesc, subLine, subIndex);
      if (subText) {
        subIndex++;
        const line = formatter(subIndex, startTime, endTime, subText);
        subItems.push(line);
        startTime = -1.0;
        subLine = '';
      }
    }

    if (subItems.length > 2) {
      await fs.writeFile(subtitleFile, subItems.join('\n') + '\n', {
        encoding: 'utf-8',
      });
      Logger.log(`Subtitle synthesis successful. ${subItems.length}`);
    } else {
      Logger.log(
        `Sorry, extractMatchedLine no vocabulary matched. ${subItems.length}`,
      );
      await fs.writeFile(subtitleFile, '', { encoding: 'utf-8' });
    }

    if (subItems.length !== scriptLinesc.length) {
      Logger.warn(
        `subItems.length != scriptLines.length, subItems len: ${subItems.length}, scriptLines len: ${scriptLinesc.length}`,
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
  let subIndex = 0;
  let subLines = [];
  let scriptLinesc = clone(scriptLines);

  for (let i = 0; i < subMaker.offset.length; i++) {
    const sub = subMaker.subs[i];
    subLines.push(safeDecodeURIComponent(sub));
    const match = isLineMatch(scriptLinesc, subLines.join(''), subIndex);
    if (match) {
      const lineStr = scriptLinesc[subIndex];
      if (lineStr.length > subtitleMaxWidth) {
        const [index, len, subline] = getSubarrayInfo(
          subLines,
          subtitleMaxWidth,
        );
        const line = lineStr.slice(0, len);
        if (index > 0 && isLineEqual(subline, line)) {
          scriptLinesc[subIndex] = insertStringAt(lineStr, len, SIGN);
        }
      }

      subIndex++;
      subLines.length = 0;
    }
  }

  return splitArrayItemsBySign(scriptLinesc);
};

const splitArrayItemsBySign = (arr: string[]): string[] => {
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    const item = arr[i];
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
