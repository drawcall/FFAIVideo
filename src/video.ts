import ffmpeg from 'fluent-ffmpeg';
import { VideoConfig } from './config/config';
import { VideoAspect } from './config/constant';
import { toResolution } from './config/video-aspect';
import { getMetadata, runFFmpegCommand } from './utils/ffmpeg';
import { createSubtitlesFilter } from './utils/filter';

const combineFinalVideo = async (
  videoDuration: number,
  audioFile: string,
  subtitleFile: string,
  downloadedVideos: string[],
  config: VideoConfig,
  progress: (progress: number) => void,
): Promise<string> => {
  const {
    bgMusic = '',
    voiceVolume = 1,
    bgMusicVolume = 0.5,
    output,
  } = config;
  const clips = await processingSubVideos(
    videoDuration,
    downloadedVideos,
    config,
  );
  progress(90);

  let command = ffmpeg();
  let vfilter = '';
  clips.forEach((file, index) => {
    vfilter += `[${index}:v]`;
    command = command.addInput(file);
  });
  command.input(audioFile);
  command.input(bgMusic);
  command.input(subtitleFile);

  const filters = [
    `${vfilter}concat=n=${clips.length}:v=1:a=0[v]`,
    `[${clips.length}:a]volume=${voiceVolume}[audio]`,
    `[${clips.length + 1}:a]volume=${bgMusicVolume}[bg]`,
    `[audio][bg]amix=inputs=2[a]`,
    createSubtitlesFilter(subtitleFile, config),
  ];

  command.outputOptions([
    '-filter_complex',
    `${filters.join(';').replace(/;$/gi, '')}`,
    '-map',
    '[v]',
    '-map',
    `[a]`,
    '-c:v',
    'libx264',
    '-c:a',
    'aac',
    '-strict',
    'experimental',
    '-t',
    `${videoDuration}`,
  ]);
  command.fps(30).addOutput(output);
  await runFFmpegCommand(command);
  return output;
};

// Pre-crop all downloaded sub-videos
const processingSubVideos = async (
  videoDuration: number,
  downloadedVideos: string[],
  config: VideoConfig,
): Promise<string[]> => {
  const {
    videoClipDuration: maxClipDuration = 10,
    videoAspect = VideoAspect.Portrait,
  } = config;
  const [videoWidth, videoHeight] = toResolution(videoAspect);
  const clips = [];
  let index = 0;
  let totalDuration = 0;

  while (totalDuration < videoDuration) {
    const videoPath = downloadedVideos[index];
    const { duration, width, height } = await getMetadata(videoPath);
    const lastDur = Math.floor(videoDuration - totalDuration);
    const realDur = Math.min(lastDur, duration, maxClipDuration);
    if (realDur <= 0) break;

    const ffcommand = ffmpeg(videoPath).noAudio();
    ffcommand.inputOptions('-ss 00:00:00').inputOptions(`-t ${realDur >> 0}`);
    ffcommand.fps(30);
    const filters = [];
    if (width != videoWidth || height != videoHeight) {
      let scaleFilter, cropFilter;
      const aspectRatio = videoWidth / videoHeight;
      const inputAspectRatio = width / height;

      if (inputAspectRatio > aspectRatio) {
        const scaledHeight = videoHeight;
        const scaledWidth = Math.round(scaledHeight * inputAspectRatio);
        scaleFilter = `scale=${scaledWidth}:${scaledHeight},setsar=1:1`;
        const cropX = Math.round((scaledWidth - videoWidth) / 2);
        cropFilter = `crop=${videoWidth}:${videoHeight}:${cropX}:0`;
      } else {
        const scaledWidth = videoWidth;
        const scaledHeight = Math.round(scaledWidth / inputAspectRatio);
        scaleFilter = `scale=${scaledWidth}:${scaledHeight},setsar=1:1`;
        const cropY = Math.round((scaledHeight - videoHeight) / 2);
        cropFilter = `crop=${videoWidth}:${videoHeight}:0:${cropY}`;
      }

      filters.push(scaleFilter, cropFilter);
    }
    ffcommand.videoFilters(filters);
    const output = videoPath.replace(/vid-/, 'o-');
    ffcommand.addOutput(output);
    await runFFmpegCommand(ffcommand);
    clips.push(output);

    totalDuration += realDur;
    index++;
    if (index >= downloadedVideos.length) index = 0;
  }

  return clips;
};

export { combineFinalVideo };
