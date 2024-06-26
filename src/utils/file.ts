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

export { writeFileWithStream, isFilePath };
