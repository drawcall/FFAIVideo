import path from 'path';
import fs from 'fs-extra';
import { Stream } from 'stream';
import md5 from 'md5';
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

export { writeFileWithStream, copyLocalFile, isFilePath };
