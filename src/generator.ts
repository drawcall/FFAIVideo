import path from 'path';
import fs from 'fs-extra';
import { isEmpty, isArray } from 'lodash';
import { Root } from './config/root';
import { progressFun, successFun } from './config/constant';
import { VideoConfig, mergeConfig, createOutputConfig } from './config/config';
import { generateTermsWithAI, addPunctuationWithAI } from './terms';
import { combineFinalVideo } from './video';
import { fileToSubtitles } from './sub-maker';
import { generateSubtitle } from './subtitle';
import { downloadVideos, copyClipToCache } from './material';
import { tts, getAudioDuration, parseVoiceName } from './voice';
import { addPunctuationToParagraph, normalizeWhitespace } from './utils/line';
import { Logger } from './utils/log';
import { setDefaultFFPath } from './utils/ffmpeg';

const generateVideo = async (
  params: VideoConfig,
  progress: (progress: number) => void = progressFun,
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
    lineBreakForce = true,
    addPunctuation = false,
    isChinese = true,
    genTTSAndSub = null,
    subtitleMaxWidth = 9999,
  } = config;

  Root.currentConfig = config;
  if (isChinese) {
    videoScript = normalizeWhitespace(addPunctuationToParagraph(videoScript));
  }
  if (addPunctuation) {
    videoScript = await addPunctuationWithAI(videoScript, config);
  }

  setDefaultFFPath();
  progress(5);
  fs.ensureDir(path.dirname(output));
  fs.ensureDirSync(cacheDir);
  // AI generates Terms based on text content.
  if (isEmpty(videoTerms)) {
    videoTerms = await generateTermsWithAI(videoScript.trim(), config);
  } else {
    if (typeof videoTerms === 'string') {
      videoTerms = videoTerms.split(/[,，]/).map(term => term.trim());
    } else if (isArray(videoTerms)) {
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
  let subtitleFile = path.join(cacheDir, 'subtitle.srt');
  let videoDuration;
  if (genTTSAndSub) {
    videoDuration = await genTTSAndSub({
      text: videoScript,
      voiceName,
      voiceFile: audioFile,
      subtitleFile,
      subtitleMaxWidth,
      lineBreakForce,
    });
  } else {
    const subMaker = await tts(videoScript, voiceName, audioFile, config);
    if (!subMaker) return '';

    progress(30);
    // Generate subtitles based on audio and text
    videoDuration = Math.ceil(getAudioDuration(subMaker) + lastTime);
    await generateSubtitle({
      subMaker,
      videoScript,
      subtitleFile,
      subtitleMaxWidth,
      lineBreakForce,
      isChinese,
    });
  }

  if (!fs.exists(subtitleFile)) {
    Logger.warn('subtitle file not found, fallback to whisper');
  }

  const subtitleLines = fileToSubtitles(subtitleFile);
  if (!subtitleLines) {
    Logger.warn(`subtitle file is invalid: ${subtitleFile}`);
    subtitleFile = '';
  }
  progress(40);

  const downloadedVideos: string[] = await downloadVideos(
    videoTerms,
    videoDuration,
    cacheDir,
    config,
    progress,
  );

  if (isEmpty(downloadedVideos)) {
    Logger.error(
      'Failed to download videos, maybe the network is not available!',
    );
    return '';
  } else {
    if (params.insertClips && isArray(params.insertClips)) {
      for (const clip of params.insertClips) {
        try {
          const { videoId, newPath } = await copyClipToCache(
            clip.path,
            cacheDir,
          );
          const insertPosition = clip.position || 0;
          if (insertPosition >= downloadedVideos.length) {
            downloadedVideos.push(newPath);
          } else {
            downloadedVideos.splice(insertPosition, 0, newPath);
          }
        } catch (error) {
          console.error('Error processing insert clip:', error);
        }
      }
    }
  }

  progress(85);

  // Combine and generate the final video
  const finalVideo = await combineFinalVideo(
    videoDuration,
    audioFile, // Dubbing
    subtitleFile,
    downloadedVideos, // Downloaded fragments
    config,
    progress,
  );

  if (removeCache) {
    fs.remove(cacheDir);
  }
  progress(100);
  return finalVideo;
};

export { generateVideo };
