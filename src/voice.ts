import fs from 'fs-extra';
import { clone } from 'lodash';
import { MsEdgeTTS } from 'edge-tts-node';
import { VoiceConfig } from './config/voice-config';
import { formatter } from './utils/time';
import { SubMaker } from './sub-maker';
import {
  matchStr,
  matchLine,
  insertAtIndex,
  getMatchLineStr,
  splitArrayItemsBySign,
  getSplitIndexAndLenth,
  replaceSpecialChar,
  splitSubtitleString,
  safeDecodeURIComponent
} from './utils/str';
import { Logger } from './utils/log';

const getAllVoices = (filterLocals?: string[]): string[] => {
  if (!filterLocals) {
    filterLocals = ['zh-CN', 'en-US', 'zh-HK', 'zh-TW'];
  }

  const voicesStr = VoiceConfig.trim();
  const voices: string[] = [];
  let name = '';
  for (const line of voicesStr.split('\n')) {
    const trimmedLine = line.trim();
    if (!trimmedLine) {
      continue;
    }

    if (trimmedLine.startsWith('Name: ')) {
      name = trimmedLine.substring(6).trim();
    }

    if (trimmedLine.startsWith('Gender: ')) {
      const gender = trimmedLine.substring(8).trim();
      if (name && gender) {
        if (filterLocals) {
          for (const filterLocal of filterLocals) {
            if (name.toLowerCase().startsWith(filterLocal.toLowerCase())) {
              voices.push(`${name}-${gender}`);
            }
          }
        } else {
          voices.push(`${name}-${gender}`);
        }
        name = '';
      }
    }
  }

  voices.sort();
  return voices;
};

const parseVoiceName = (name: string): string => {
  return name.replace('-Female', '').replace('-Male', '').trim();
};

const tts = async (
  text: string,
  voiceName: string,
  voiceFile: string,
): Promise<SubMaker | null> => {
  text = text.trim();
  MsEdgeTTS.wordBoundaryEnabled = true;
  try {
    let edgeTTS = new MsEdgeTTS(undefined, false);
    await edgeTTS.setMetadata(
      voiceName,
      MsEdgeTTS.OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3,
    );
    const subMaker = new SubMaker();
    //const file = fs.createWriteStream(voiceFile);
    await new Promise((resolve, reject) => {
      edgeTTS
        .toStream(text)
        .on('data', chunk => {
          const message = chunk.toString();
          const obj = JSON.parse(message);
          if (obj.type === 'audio') {
            fs.appendFileSync(voiceFile, Buffer.from(obj.data, 'base64'));
          } else if (obj.type === 'WordBoundary') {
            subMaker.createSub([obj.offset, obj.duration], obj.text);
          }
        })
        .on('end', () => {
          //file.end();
          resolve(voiceFile);
        })
        .on('error', () => {
          //file.end();
          reject();
        });
    });

    if (!subMaker || !subMaker.subs) {
      Logger.log(`failed, subMaker is None or subMaker.subs is None`);
    }

    Logger.log(`voice output file: ${voiceFile}`);
    return subMaker;
  } catch (e) {
    Logger.log(`failed, error: ${e}`);
  }
  return null;
};

const generateSubtitle = async (
  subMaker: SubMaker,
  text: string,
  subtitleFile: string,
  subtitleMaxWidth: number,
): Promise<void> => {
  const subItems: string[] = [];
  let scriptLines = splitSubtitleString(replaceSpecialChar(text));
  let startTime = -1.0;
  let subIndex = 0;
  let subLine = '';

  try {
    const cscriptLines = preSegmentScriptLines(
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
      const subText = getMatchLineStr(cscriptLines, subLine, subIndex);
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
    } else {
      Logger.log(
        `Sorry, getMatchLineStr no vocabulary matched. ${subItems.length}`,
      );
      await fs.writeFile(subtitleFile, '', { encoding: 'utf-8' });
    }

    if (subItems.length !== cscriptLines.length) {
      Logger.warn(
        `subItems.length != scriptLines.length, subItems len: ${subItems.length}, scriptLines len: ${cscriptLines.length}`,
      );
    }
  } catch (e) {
    Logger.error(`failed, error: ${e}`);
  }
};

const preSegmentScriptLines = (
  subMaker: SubMaker,
  scriptLines: string[],
  subtitleMaxWidth: number,
): string[] => {
  const sign = '__x__';
  let subIndex = 0;
  let subLines = [];
  let cscriptLines = clone(scriptLines);

  for (let i = 0; i < subMaker.offset.length; i++) {
    const sub = subMaker.subs[i];
    subLines.push(safeDecodeURIComponent(sub));
    const match = matchLine(cscriptLines, subLines.join(''), subIndex);
    if (match) {
      const lineStr = cscriptLines[subIndex];
      if (lineStr.length > subtitleMaxWidth) {
        const [index, len, subline] = getSplitIndexAndLenth(
          subLines,
          subtitleMaxWidth,
        );
        const line = lineStr.slice(0, len);
        if (index > 0 && matchStr(subline, line)) {
          cscriptLines[subIndex] = insertAtIndex(lineStr, len, sign);
        }
      }

      subIndex++;
      subLines.length = 0;
    }
  }

  return splitArrayItemsBySign(cscriptLines, sign);
};

const getAudioDuration = (subMaker: SubMaker): number => {
  if (!subMaker.offset) {
    return 0.0;
  }
  return subMaker.offset[subMaker.offset.length - 1][1] / 10000000;
};

export { tts, generateSubtitle, getAudioDuration, parseVoiceName };
