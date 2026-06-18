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

        // Enhance error message for common ffmpeg failures
        if (err.message && err.message.includes('No such file or directory')) {
          const enhancedMsg =
            `${err.message}\n\n` +
            `[FFAIVideo Diagnostic] ffmpeg failed because one or more input files do not exist.\n` +
            `Full ffmpeg stderr: ${stderr || '(empty)'}\n` +
            `Full ffmpeg stdout: ${stdout || '(empty)'}\n` +
            `This typically means:\n` +
            `  1. The audio file (TTS output) was not generated — check if edge TTS / Azure TTS succeeded.\n` +
            `  2. Downloaded video clips are missing — check network/proxy when downloading materials.\n` +
            `  3. A subtitle file path is invalid — check if subtitle generation completed.\n` +
            `  4. The bgMusic file path does not exist.\n` +
            `  5. The cache directory was cleaned prematurely (removeCache=true before ffmpeg finished).`;
          reject(new Error(enhancedMsg));
        } else {
          reject(err);
        }
      })
      .run();
  });
};

export { getMetadata, runFFmpegCommand, setDefaultFFPath };
