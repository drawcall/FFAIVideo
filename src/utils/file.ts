import md5 from 'md5';
import path from 'path';
import fs from 'fs-extra';
import { Stream } from 'stream';
import { Logger } from '../utils/log';

const isFilePath = (url: string): boolean => {
  const ext = path.extname(url);
  return ext !== '';
};

const writeFileWithStream = (stream: Stream, videoPath: string) => {
  return new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(videoPath);
    stream.on('error', reject);
    writer.on('error', reject);

    writer.on('finish', () => {
      Logger.log(`Video ${videoPath} has been downloaded successfully.`);
      resolve(videoPath);
    });

    stream.pipe(writer);
  });
};

const copyLocalFile = async (targetPath: string, cacheDir: string) => {
  try {
    await fs.ensureDir(cacheDir);
    const videoId = `vid-${md5(Math.random().toString())}`;
    const videoPath = path.join(cacheDir, `${videoId}.mp4`);
    await fs.copy(targetPath, videoPath);
    return videoPath;
  } catch (err) {
    return null;
  }
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
        `Sorry, getEqualedLine no vocabulary equaled. formattedSubtitles.length ${formattedSubtitles.length}`,
      );
      await fs.writeFile(subtitleFile, '', { encoding: 'utf-8' });
    }

    if (formattedSubtitles.length !== scriptLinescLength) {
      Logger.warn(
        `formattedSubtitles.length != scriptLines.length, formattedSubtitles len: ${formattedSubtitles.length}, scriptLines len: ${scriptLinescLength}`,
      );
    }
  } catch (e) {
    Logger.error(`subtitle failed, error: ${e}`);
  }
};

export { writeFileWithStream, writeSubtitles, copyLocalFile, isFilePath };
