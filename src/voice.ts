import { SubMaker } from './sub-maker';
import { azureTTS } from './tts/azuretts';
import { edgeTTS } from './tts/edgetts';
import { VideoConfig } from './config/config';

const parseVoiceName = (name: string): string => {
  return name.replace('-Female', '').replace('-Male', '').trim();
};

const tts = async (
  text: string,
  voiceName: string,
  voiceFile: string,
  config: VideoConfig,
): Promise<SubMaker | null> => {
  const { ttsProxy = '', azureTTSSettings, getTTS } = config;

  if (getTTS) {
    return await getTTS(text, voiceName, voiceFile);
  }
  
  if (azureTTSSettings) {
    return await azureTTS(text, voiceName, voiceFile, azureTTSSettings);
  }

  return await edgeTTS(text, voiceName, voiceFile, ttsProxy);
};

const getAudioDuration = (subMaker: SubMaker): number => {
  if (!subMaker.offset) {
    return 0.0;
  }
  return subMaker.offset[subMaker.offset.length - 1][1] / 10000000;
};

export { tts, getAudioDuration, parseVoiceName };
