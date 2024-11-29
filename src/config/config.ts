import path from 'path';
import { merge } from 'lodash';
import { LLMConfig, defaultLLMConfig } from './llm-config';
import { VideoAspect } from './constant';
import { isFilePath } from '../utils/file';
import { uuid } from '../utils/utils';

interface MaterialInfo {
  provider: string;
  url: string;
  keyword?: string;
  duration: number;
}

interface AzureTTSSettings {
  subscriptionKey: string;
  serviceRegion: string;
  language?: string;
}

interface MaterialSite {
  apiKey: string;
  host?: string;
  port?: number;
  enableProxy: boolean;
}

interface InsertClip {
  keyword?: string;
  path: string;
  position: number;
}

interface SearchParams {
  searchTerm: string;
  maxClipDuration?: number;
  index: number;
  cacheDir?: string;
}

// ISubMaker.ts
export interface ISubMaker {
  offset: [number, number][];
  subs: string[];

  createSub(timestamp: [number, number], text: string): void;
  generateSubs(wordsInCue?: number): string;
}

interface VideoConfig {
  taskId?: string;
  provider?: string;
  moonshot?: LLMConfig;
  openai?: LLMConfig;
  azure?: LLMConfig;
  gemini?: LLMConfig;
  g4f?: LLMConfig;
  gpt4js?: LLMConfig;
  customAI?: LLMConfig;
  pexels?: MaterialSite;
  videoScript?: string; // Script used to generate video
  videoTerms?: string | string[]; // Keywords used to generate video
  videoAspect?: VideoAspect; // Default can be undefined
  videoClipDuration?: number; // Default is 5 seconds
  termsNum?: number;
  output: string;
  cacheDir?: string;

  voiceName: string;
  voiceVolume?: number; // Default is 1.0
  bgMusic?: string;
  bgMusicVolume?: number; // Default is 0.2
  azureTTSSettings?: AzureTTSSettings;
  lineSplit?: boolean;
  addPunctuation?: boolean;
  perPage?: number;

  fontsDir?: string;
  fontSize?: number;
  fontName?: string;
  textColor?: string; // Default is "#FFFFFF"
  strokeColor?: string; // Default is "#000000"
  strokeWidth?: number;
  textBottom?: number;
  subtitleMaxWidth?: number;
  debug?: boolean;
  lastTime?: number;
  removeCache?: boolean;
  ttsProxy?: string;
  materialAspectRatio?: boolean;

  getMaterial?: (param: SearchParams) => Promise<any[]>;
  getTTS?: (
    text: string,
    voiceName: string,
    voiceFile: string,
  ) => Promise<Promise<ISubMaker | null>>;
  preProcessMaterialVideo?: (
    queryUrl: string,
    searchData: Record<string, any>,
    pexelsApiKey: MaterialSite,
  ) => Promise<MaterialInfo[]>;
  postProcessMaterialVideos?: (
    materialVideos: MaterialInfo[],
  ) => MaterialInfo[];
  insertClips?: InsertClip[];
  [key: string]: any;
}

const defaultPexels: MaterialSite = {
  apiKey: '',
  enableProxy: false,
  host: '10.10.1.10',
  port: 1080,
};

// A default VideoConfig for basic configuration
const defalutVideoConfig: VideoConfig = {
  provider: 'gpt4js',
  pexels: defaultPexels,
  output: '',
  cacheDir: '',
  debug: false,
  lineSplit: true,
  addPunctuation: false,
  termsNum: 5,
  subtitleMaxWidth: 9999,
  materialAspectRatio: true,
  lastTime: 5,
  voiceName: 'zh-CN-XiaoxiaoNeural',
  videoAspect: VideoAspect.Portrait,
  videoClipDuration: 6,
  voiceVolume: 1.0,
  bgMusicVolume: 0.5,
  textColor: '#FFFFFF',
  textBottom: 20,
  fontSize: 24,
  strokeColor: '#000000',
  strokeWidth: 1,
  perPage: 20,
  removeCache: true,
};

// Merge your config and the default config
const mergeConfig = (config: VideoConfig): VideoConfig => {
  const fconfig = merge(defalutVideoConfig, config);
  fconfig.provider = fconfig.provider ?? 'gpt4js';
  fconfig[fconfig.provider] = merge(
    defaultLLMConfig[fconfig.provider],
    fconfig[fconfig.provider],
  );

  return fconfig;
};

const createOutputConfig = (config: VideoConfig): VideoConfig => {
  if (!config.output)
    throw new Error(
      'Sorry, you must enter an output file path or directory path.',
    );

  const taskId = uuid();
  config.taskId = taskId;
  if (isFilePath(config.output)) {
    const dir = path.dirname(config.output);
    config.cacheDir = path.join(dir, taskId, 'cache_files');
    config.output = config.output;
  } else {
    const dir = path.join(config.output, taskId);
    config.cacheDir = path.join(dir, 'cache_files');
    config.output = path.join(dir, `final.mp4`);
  }

  return config;
};

export {
  VideoConfig,
  LLMConfig,
  MaterialInfo,
  AzureTTSSettings,
  MaterialSite,
  mergeConfig,
  createOutputConfig,
};
