import fs from 'fs-extra';
import { ISubMaker } from './config/config';

const formatter = (
  startTime: number,
  endTime: number,
  subdata: string,
): string => {
  return (
    `${mktimestamp(startTime)} --> ${mktimestamp(endTime)}\r\n` +
    `${escape(subdata)}\r\n\r\n`
  );
};

const mktimestamp = (timeUnit: number): string => {
  const hour = Math.floor(timeUnit / 10 ** 7 / 3600);
  const minute = Math.floor((timeUnit / 10 ** 7 / 60) % 60);
  const seconds = (timeUnit / 10 ** 7) % 60;
  return `${hour.toString().padStart(2, '0')}:${minute
    .toString()
    .padStart(2, '0')}:${seconds.toFixed(3).padStart(6, '0')}`;
};

class SubMaker implements ISubMaker {
  public offset: [number, number][];
  public subs: string[];

  /**
   * SubMaker
   */
  constructor() {
    this.offset = [];
    this.subs = [];
  }

  createSub(timestamp: [number, number], text: string): void {
    this.offset.push([timestamp[0], timestamp[0] + timestamp[1]]);
    this.subs.push(text);
  }

  generateSubs(wordsInCue: number = 10): string {
    if (this.subs.length !== this.offset.length) {
      throw new Error('subs and offset are not of the same length');
    }

    if (wordsInCue <= 0) {
      throw new Error('wordsInCue must be greater than 0');
    }

    let data = 'WEBVTT\r\n\r\n';
    let subStateCount = 0;
    let subStateStart = -1;
    let subStateSubs = '';

    for (let idx = 0; idx < this.offset.length; idx++) {
      const [startTime, endTime] = this.offset[idx];
      let subs = unescape(this.subs[idx]);

      // wordboundary is guaranteed not to contain whitespace
      if (subStateSubs.length > 0) {
        subStateSubs += ' ';
      }
      subStateSubs += subs;

      if (subStateStart === -1) {
        subStateStart = startTime;
      }
      subStateCount++;

      if (subStateCount === wordsInCue || idx === this.offset.length - 1) {
        subs = subStateSubs;
        const splitSubs: string[] = [];
        for (let i = 0; i < subs.length; i += 79) {
          splitSubs.push(subs.slice(i, i + 79));
        }

        for (let i = 0; i < splitSubs.length - 1; i++) {
          let sub = splitSubs[i];
          let splitAtWord = true;
          if (sub[sub.length - 1] === ' ') {
            splitSubs[i] = sub.slice(0, -1);
            splitAtWord = false;
          }

          if (sub[0] === ' ') {
            splitSubs[i] = sub.slice(1);
            splitAtWord = false;
          }

          if (splitAtWord) {
            splitSubs[i] += '-';
          }
        }

        data += formatter(subStateStart, endTime, splitSubs.join('\r\n'));
        subStateCount = 0;
        subStateStart = -1;
        subStateSubs = '';
      }
    }

    return data;
  }
}

const escape = (str: string): string => {
  return str.replace(/[&<>"']/g, match => {
    switch (match) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      default:
        return match;
    }
  });
};

const unescape = (str: string): string => {
  return str.replace(/&amp;|&lt;|&gt;|&quot;|&#39;/g, match => {
    switch (match) {
      case '&amp;':
        return '&';
      case '&lt;':
        return '<';
      case '&gt;':
        return '>';
      case '&quot;':
        return '"';
      case '&#39;':
        return "'";
      default:
        return match;
    }
  });
};

const fileToSubtitles = async (
  filename: string,
): Promise<[number, string, string][]> => {
  const timesTexts: [number, string, string][] = [];
  let currentTimes: string | null = null;
  let currentText = '';
  let index = 0;

  const fileContent = await fs.readFile(filename, { encoding: 'utf-8' });
  const lines = fileContent.split('\n');
  for (const line of lines) {
    const times = line.match(/([0-9]*:[0-9]*:[0-9]*,[0-9]*)/);
    if (times) {
      currentTimes = line;
    } else if (line.trim() === '' && currentTimes) {
      index += 1;
      timesTexts.push([index, currentTimes.trim(), currentText.trim()]);
      currentTimes = null;
      currentText = '';
    } else if (currentTimes) {
      currentText += line;
    }
  }
  return timesTexts;
};

export { SubMaker, fileToSubtitles };
