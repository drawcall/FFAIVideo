interface CustomConfig {
  url: string;
  data: any;
  requestConfig?: any;
}

interface LLMConfig {
  apiKey: string;
  modelName: string;
  baseUrl?: string;
  apiVersion?: string;
  custom?: CustomConfig;
}

const defaultLLMConfig: {
  moonshot: LLMConfig;
  openai: LLMConfig;
  azure: LLMConfig;
  gemini: LLMConfig;
  g4f: LLMConfig;
  defalut: LLMConfig;
  [key: string]: LLMConfig;
} = {
  // moonshot
  moonshot: {
    apiKey: '',
    modelName: 'moonshot-v1-8k',
    baseUrl: 'https://api.moonshot.cn/v1',
  },

  // openai
  openai: {
    apiKey: '',
    modelName: 'gpt-4-turbo-preview',
    baseUrl: 'https://api.openai.com/v1',
  },

  // azure
  azure: {
    apiKey: '',
    modelName: 'gpt-35-turbo',
    baseUrl: '***',
    apiVersion: '2024-02-15-preview',
  },

  // gemini
  gemini: {
    apiKey: '',
    modelName: '',
    baseUrl: '***',
  },

  // g4f
  g4f: {
    apiKey: 'xxx',
    modelName: 'gpt-3.5-turbo-16k-0613',
    baseUrl: '***',
  },

  // defalut
  defalut: {
    apiKey: '',
    modelName: '',
    baseUrl: '***',
  },
};

export { LLMConfig, defaultLLMConfig };
