import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import { Logger } from '../utils/log';
import { SubMaker } from '../sub-maker';
import { AzureTTSSettings } from '../config/config';

const azureTTS = async (
  text: string,
  voiceName: string,
  voiceFile: string,
  settings: AzureTTSSettings,
): Promise<SubMaker> => {
  const subMaker = new SubMaker();
  // Create audio config pointing to output file
  const audioConfig = sdk.AudioConfig.fromAudioFileOutput(voiceFile);
  const speechConfig = sdk.SpeechConfig.fromSubscription(
    settings.subscriptionKey,
    settings.serviceRegion,
  );

  // Set synthesis language, voice name, and output audio format
  speechConfig.speechSynthesisLanguage =
    settings.language || getLanguageCode(voiceName);
  speechConfig.speechSynthesisVoiceName = voiceName;
  speechConfig.speechSynthesisOutputFormat =
    sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;

  // Create the speech synthesizer
  const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

  synthesizer.synthesisCompleted = (s, e) => {
    Logger.log(
      `(synthesized) Reason: ${
        sdk.ResultReason[e.result.reason]
      } Audio length: ${e.result.audioData.byteLength}`,
    );
  };

  synthesizer.synthesisStarted = () => {
    // Logger.log('(synthesis started)');
  };

  synthesizer.wordBoundary = (s, e) => {
    Logger.log(
      `(WordBoundary), Text: ${e.text}, Audio offset: ${
        e.audioOffset / 10000
      }ms duration: ${e.duration / 10000}.`,
    );
    subMaker.createSub([e.audioOffset, e.duration], e.text);
  };

  // Start the synthesizer and wait for a result
  return new Promise((resolve, reject) => {
    synthesizer.speakTextAsync(
      text,
      result => {
        Logger.log('azuretts synthesizer complete');
        synthesizer.close();
        resolve(subMaker);
      },
      err => {
        Logger.error('azuretts err - ' + err);
        synthesizer.close();
        reject(null);
      },
    );
  });
};

function getLanguageCode(voiceName: string): string {
  const match = voiceName.match(/^([a-z]{2}-[A-Z]{2})/);
  if (match) {
    return match[1];
  }

  return 'zh-CN';
}

export { azureTTS, AzureTTSSettings };
