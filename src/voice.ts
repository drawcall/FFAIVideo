import fs from 'fs-extra';
import { MsEdgeTTS } from 'edge-tts-node';
import { SubMaker } from './sub-maker';
import { Logger } from './utils/log';

const parseVoiceName = (name: string): string => {
  return name.replace('-Female', '').replace('-Male', '').trim();
};

const tts = async (
  text: string,
  voiceName: string,
  voiceFile: string,
): Promise<SubMaker | null> => {
  text = text.trim();
  MsEdgeTTS.wordBoundaryEnabled = true;
  try {
    let edgeTTS = new MsEdgeTTS(undefined, false);
    console.log(voiceName,MsEdgeTTS.OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
    await edgeTTS.setMetadata(
      voiceName,
      MsEdgeTTS.OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3,
    );
    const subMaker = new SubMaker();

    await new Promise((resolve, reject) => {
      edgeTTS
        .toStream(text)
        .on('data', chunk => {
          const message = chunk.toString();
          const obj = JSON.parse(message);
          if (obj.type === 'audio') {
            fs.appendFileSync(voiceFile, Buffer.from(obj.data, 'base64'));
          } else if (obj.type === 'WordBoundary') {
            subMaker.createSub([obj.offset, obj.duration], obj.text);
          }
        })
        .on('end', () => {
          //file.end();
          resolve(voiceFile);
        })
        .on('error', () => {
          //file.end();
          reject();
        });
    });

    if (!subMaker || !subMaker.subs) {
      Logger.log(`failed, subMaker is None or subMaker.subs is None`);
    }

    Logger.log(`voice output file: ${voiceFile}`);
    return subMaker;
  } catch (e) {
    Logger.error(`voice failed, error: ${e}`);
  }
  return null;
};

const getAudioDuration = (subMaker: SubMaker): number => {
  if (!subMaker.offset) {
    return 0.0;
  }
  return subMaker.offset[subMaker.offset.length - 1][1] / 10000000;
};

export { tts, getAudioDuration, parseVoiceName };
