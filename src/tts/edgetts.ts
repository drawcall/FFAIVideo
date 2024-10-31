import fs from 'fs-extra';
import { MsEdgeTTS } from 'edge-tts-node';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { SubMaker } from '../sub-maker';
import { Logger } from '../utils/log';

const edgeTTS = async (
  text: string,
  voiceName: string,
  voiceFile: string,
  ttsProxy: string,
): Promise<SubMaker | null> => {
  text = text.trim();
  MsEdgeTTS.wordBoundaryEnabled = true;
  try {
    const agent = ttsProxy ? new HttpsProxyAgent(ttsProxy) : undefined;
    const edgeTTS = new MsEdgeTTS({ agent, enableLogger: false });
    await edgeTTS.setMetadata(
      voiceName,
      MsEdgeTTS.OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3,
    );
    const subMaker = new SubMaker();

    await new Promise((resolve, reject) => {
      edgeTTS
        .toStream(text)
        .on('data', (chunk: any) => {
          const message = chunk.toString();
          const obj = JSON.parse(message);
          if (obj.type === 'audio') {
            fs.appendFileSync(voiceFile, Buffer.from(obj.data, 'base64'));
          } else if (obj.type === 'WordBoundary') {
            subMaker.createSub([obj.offset, obj.duration], obj.text);
          }
        })
        .on('end', () => {
          resolve(voiceFile);
        })
        .on('error', () => {
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

export { edgeTTS };
