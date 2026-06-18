import { SubMaker } from '../subtitle/sub-maker';
import { azureTTS } from '../tts/azure';
import { edgeTTS } from '../tts/edge';
import { VideoConfig } from '../config/config';

const parseVoiceName = (name: string): string => {
  return name.replace('-Female', '').replace('-Male', '').trim();
};

const tts = async (
  text: string,
  voiceName: string,
  voiceFile: string,
  config: VideoConfig,
): Promise<SubMaker | null> => {
  const { ttsProxy = '', azureTTSSettings, genTTS } = config;

  if (genTTS) {
    return await genTTS(text, voiceName, voiceFile);
  }
  
  if (azureTTSSettings) {
    return await azureTTS(text, voiceName, voiceFile, azureTTSSettings);
  }

  return await edgeTTS(text, voiceName, voiceFile, ttsProxy);
};

const getAudioDuration = (subMaker: SubMaker): number => {
  if (!subMaker || !subMaker.offset) {
    return 0.0;
  }
  if (subMaker.offset.length === 0) {
    const subsLen = subMaker.subs ? subMaker.subs.length : 'N/A';
    throw new Error(
      `getAudioDuration failed: subMaker.offset is empty (length=0, subs.length=${subsLen}). ` +
      'This means the TTS engine returned no WordBoundary events. ' +
      'Possible causes: (1) network/proxy issue preventing TTS service access; ' +
      '(2) TTS service rejected the input text; ' +
      '(3) edge-tts-node returned audio but no word boundary metadata. ' +
      'Please check your ttsProxy setting, network connectivity, and input text content.',
    );
  }
  const lastEntry = subMaker.offset[subMaker.offset.length - 1];
  if (!lastEntry || lastEntry.length < 2 || lastEntry[1] == null) {
    throw new Error(
      `getAudioDuration failed: last offset entry is invalid. ` +
      `Index: ${subMaker.offset.length - 1}, Value: ${JSON.stringify(lastEntry)}, ` +
      `Total offset entries: ${subMaker.offset.length}. ` +
      'The TTS WordBoundary data may be corrupted or incomplete.',
    );
  }
  return lastEntry[1] / 10000000;
};

export { tts, getAudioDuration, parseVoiceName };
