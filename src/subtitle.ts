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
  getEqualedLine,
  resetScriptLinesContent,
  splitSubtitleByPunctuation,
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
    const [starTime, enTime] = offset; // Assume offset is an array or tuple
    if (startTime < 0) startTime = starTime;
    endTime = enTime;
    
    subLine += safeDecodeURIComponent(sub);
    const lineText = getEqualedLine(scriptLinesc, scriptLinesIndex, subLine);
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

const writeSubtitles = async (
  subtitleFile: string,
  formattedSubtitles: string[],
  scriptLinescLength: number,
): Promise<void> => {
  try {
    if (formattedSubtitles.length > 2) {
      await fs.writeFile(subtitleFile, formattedSubtitles.join('\n') + '\n', {
        encoding: 'utf-8',
      });
      Logger.log(`Subtitle synthesis successful. ${formattedSubtitles.length}`);
    } else {
      Logger.log(
        `Sorry, getEqualedLine no vocabulary equaled. ${formattedSubtitles.length}`,
      );
      await fs.writeFile(subtitleFile, '', { encoding: 'utf-8' });
    }

    if (formattedSubtitles.length !== scriptLinescLength) {
      Logger.warn(
        `formattedSubtitles.length != scriptLines.length, formattedSubtitles len: ${formattedSubtitles.length}, scriptLines len: ${scriptLinescLength}`,
      );
    }
  } catch (e) {
    Logger.error(`failed, error: ${e}`);
  }
};

const resplitScriptLinesByMaxWidth = (
  subMaker: SubMaker,
  scriptLines: string[],
  subtitleMaxWidth: number,
): string[] => {
  let subLines = [];
  let scriptLinesIndex = 0;
  let scriptLinesc = clone(scriptLines);

  for (let i = 0; i < subMaker.offset.length; i++) {
    const sub = subMaker.subs[i];
    subLines.push(safeDecodeURIComponent(sub));
    const equaled =
      scriptLines.length > scriptLinesIndex &&
      isLineEqual(scriptLines[scriptLinesIndex], subLines.join(''));

    if (equaled) {
      const lineText = scriptLinesc[scriptLinesIndex];
      if (lineText.length > subtitleMaxWidth) {
        const [index, len, subline] = getSubarrayInfo(
          subLines,
          subtitleMaxWidth,
        );
        const line = lineText.slice(0, len);
        if (index > 0 && isLineEqual(subline, line)) {
          scriptLinesc[scriptLinesIndex] = insertStringAt(lineText, len, SIGN);
        }
      }

      scriptLinesIndex++;
      subLines.length = 0;
    }
  }

  return splitArrayItemsBySign(scriptLinesc);
};

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
