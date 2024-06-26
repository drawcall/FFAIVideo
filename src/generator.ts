import path from 'path';
import fs from 'fs-extra';
import { progressFun, successFun } from './config/constant';
import { VideoConfig, mergeConfig, createOutputConfig } from './config/config';
import { generateTerms } from './llm';
import { downloadVideos } from './material';
import { combineFinalVideo } from './video';
import { fileToSubtitles } from './sub-maker';
import {
  tts,
  getAudioDuration,
  generateSubtitle,
  parseVoiceName,
} from './voice';
import { Logger } from './utils/log';

const generateVideo = async (
  params: VideoConfig,
  progress: Function = progressFun,
): Promise<string> => {
  const config = createOutputConfig(mergeConfig(params));
  const voiceName = parseVoiceName(config.voiceName);
  let {
    videoScript = '',
    videoTerms,
    lastTime = 10,
    output = '',
    cacheDir = '',
    removeCache = true,
    subtitleMaxWidth = 9999,
  } = config;

  progress(5);
  fs.ensureDir(path.dirname(output));
  fs.ensureDirSync(cacheDir);
  // AI generates Terms based on text content.
  if (!videoTerms) {
    videoTerms = await generateTerms(videoScript.trim(), config);
  } else {
    if (typeof videoTerms === 'string') {
      videoTerms = videoTerms.split(/[,，]/).map(term => term.trim());
    } else if (Array.isArray(videoTerms)) {
      videoTerms = videoTerms.map(term => term.trim());
    } else {
      throw new Error('video_terms must be a string or an array of strings');
    }
  }
  Logger.log(`video_terms: ${videoTerms}`);

  progress(10);
  // Generate json for log information.
  const scriptFile = path.join(cacheDir, 'script.json');
  const scriptData = {
    script: videoScript,
    searchTerms: videoTerms,
    params: config,
  };
  fs.writeJSON(scriptFile, scriptData);
  progress(15);

  // Generate voiceover by tts engine.
  const audioFile = path.join(cacheDir, 'audio.mp3');
  const subMaker = await tts(videoScript, voiceName, audioFile);
  if (!subMaker) return '';
  progress(30);

  // Generate subtitles based on audio and text
  const videoDuration = Math.ceil(getAudioDuration(subMaker) + lastTime);
  let subtitleFile = path.join(cacheDir, 'subtitle.srt');
  await generateSubtitle(subMaker, videoScript, subtitleFile, subtitleMaxWidth);
  if (!fs.exists(subtitleFile)) {
    Logger.warn('subtitle file not found, fallback to whisper');
  }

  const subtitleLines = fileToSubtitles(subtitleFile);
  if (!subtitleLines) {
    Logger.warn(`subtitle file is invalid: ${subtitleFile}`);
    subtitleFile = '';
  }
  progress(40);

  const downloadedVideos = await downloadVideos(
    videoTerms,
    videoDuration,
    cacheDir,
    config,
    progress,
  );

  if (!downloadedVideos) {
    Logger.error(
      'Failed to download videos, maybe the network is not available!',
    );
    return '';
  }
  progress(85);

  // Combine and generate the final video
  const finalVideo = await combineFinalVideo(
    videoDuration,
    audioFile, // Dubbing
    subtitleFile,
    downloadedVideos, // Downloaded fragments
    config,
    progress
  );

  if (removeCache) {
    fs.remove(cacheDir);
  }
  progress(100);
  return finalVideo;
};

export { generateVideo };
