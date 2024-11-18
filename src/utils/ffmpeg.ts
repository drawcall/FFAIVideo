import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';
import { Logger } from '../utils/log';

interface Metadata {
  duration: number;
  height: number;
  width: number;
}

let isFFmpegPathSet = false;
const setDefaultFFPath = () => {
  if (isFFmpegPathSet) return;
  try {
    ffmpeg.setFfmpegPath(ffmpegInstaller.path);
    ffmpeg.setFfprobePath(ffprobeInstaller.path);
    isFFmpegPathSet = true;
  } catch (e) {
    Logger.log(e);
  }
};

const getMetadata = async (videoPath: string): Promise<Metadata> => {
  let duration = 0;
  let width = 0;
  let height = 0;

  try {
    let metadata = (await runFFProbeCommand(
      videoPath,
    )) as ffmpeg.FfprobeData | null;
    if (!metadata) throw Error('ffprobe error');

    const video = metadata.streams.find(
      stream => stream.codec_type === 'video',
    );
    duration = metadata.format.duration || 0;
    width = video?.width || 0;
    height = video?.height || 0;
  } catch (e) {
    console.log(e);
    duration = 0;
    width = -1;
    height = -1;
  }

  return { duration, width, height };
};

const runFFProbeCommand = (file: string) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(file, (err: any, data: ffmpeg.FfprobeData) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

const runFFmpegCommand = (command: ffmpeg.FfmpegCommand) => {
  return new Promise((resolve, reject) => {
    command
      .on('start', commandLine => {
        Logger.log('Command: ' + commandLine);
      })
      .on('end', () => {
        resolve('end');
      })
      .on('error', (err: any, stdout, stderr) => {
        Logger.log('Cannot process video: ' + stdout);
        Logger.log('-----------------------------------');
        Logger.log(err.message, stderr);
        reject(err);
      })
      .run();
  });
};

export { getMetadata, runFFmpegCommand, setDefaultFFPath };
