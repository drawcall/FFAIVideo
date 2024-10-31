import { clone } from 'lodash';
import { SubMaker } from './sub-maker';
import { formatter } from './utils/date';
import { PUNCTUATIONS } from './config/constant';
import {
  addLineBreaks,
  normalizeWhitespace,
  safeDecodeURIComponent,
} from './utils/char';
import {
  getEqualedLine,
  cleanSentences,
  splitSubtitleByPunctuation,
} from './utils/line';
import { writeSubtitles } from './utils/file';

const generateSubtitle = async ({
  subMaker,
  videoScript,
  subtitleFile,
  subtitleMaxWidth,
  lineBreaks,
}: {
  subMaker: SubMaker;
  videoScript: string;
  subtitleFile: string;
  subtitleMaxWidth: number;
  lineBreaks: boolean;
}): Promise<void> => {
  const formattedSubtitles: string[] = [];
  let scriptLines = cleanSentences(
    splitSubtitleByPunctuation(normalizeWhitespace(videoScript)),
  );
  let startTime = -1.0;
  let endTime = -1.0;
  let scriptLinesIndex = 0;
  let subLine = '';

  let scriptLinesc;
  if (lineBreaks) {
    scriptLinesc = clone(scriptLines);
  } else {
    scriptLinesc = restructureScriptLines(subMaker, subtitleMaxWidth);
  }
  console.log(scriptLinesc);

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
      if (lineBreaks) {
        lineText = addLineBreaks(lineText, subtitleMaxWidth);
      } else {
        lineText = addLineBreaks(lineText, subtitleMaxWidth + 4);
      }
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

const restructureScriptLines = (
  subMaker: SubMaker,
  subtitleMaxWidth: number,
): string[] => {
  let scriptLinesc = [];
  let subLine = '';
  let oldSubLine = '';

  for (let i = 0; i < subMaker.offset.length; i++) {
    const sub = subMaker.subs[i];
    oldSubLine = subLine;
    subLine += sub;

    if (PUNCTUATIONS.includes(sub)) {
      scriptLinesc.push(subLine);
      subLine = '';
      continue;
    }

    if (subLine.length > subtitleMaxWidth) {
      scriptLinesc.push(oldSubLine);
      subLine = sub;
      continue;
    }
  }

  if (subLine.length > 0) {
    scriptLinesc.push(subLine);
  }

  return scriptLinesc;
};

export { generateSubtitle };
