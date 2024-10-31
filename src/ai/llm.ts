import { G4F } from 'g4f';
import OpenAI from 'openai';
import axios from 'axios';
import getGPT4js from 'gpt4js';
import { get } from 'lodash';
import { OpenAIApi as AzureOpenAIApi, Configuration } from 'azure-openai';
import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
} from '@google/generative-ai';
import { VideoConfig, LLMConfig } from '../config/config';
import { Logger } from '../utils/log';

const getLLMConfig = (config: VideoConfig): LLMConfig => {
  const provider = config.provider!.toLowerCase();
  let llmConfig: LLMConfig = { ...config.default };

  const providerConfigs: { [key: string]: LLMConfig | undefined } = {
    moonshot: config.moonshot,
    openai: config.openai,
    azure: config.azure,
    gemini: config.gemini,
    g4f: config.g4f,
    gpt4js: config.gpt4js,
    custom: config.customAI,
  };

  if (provider in providerConfigs) {
    const providerConfig = providerConfigs[provider];
    if (providerConfig) {
      llmConfig = { ...llmConfig, ...providerConfig };
    }
  } else {
    throw new Error('LLM provider is not set in the config file.');
  }

  if (provider !== 'custom') {
    const requiredFields = ['apiKey', 'modelName', 'baseUrl'] as const;
    for (const field of requiredFields) {
      if (!llmConfig[field]) {
        throw new Error(`${provider}: ${field} is not set in the config file.`);
      }
    }
  }

  return llmConfig;
};

const callAIInterface = async (
  prompt: string,
  config: VideoConfig,
): Promise<string> => {
  let content: string = '';
  const llmConfig: LLMConfig = getLLMConfig(config);
  const provider: string = config.provider!.toLowerCase();

  if (provider === 'g4f') {
    // https://www.npmjs.com/package/g4f
    const g4f = new G4F();
    const modelName = config.g4f!.modelName;
    const messages = [{ role: 'user', content: prompt }];
    try {
      content = await g4f.chatCompletion(messages, {
        model: modelName,
      });
    } catch (e) {
      Logger.log(`Sorry, there was an error calling g4f.`, e);
    }
    return content;
  }

  if (provider === 'gpt4js') {
    // https://www.npmjs.com/package/gpt4js
    const providerName = config.gpt4js?.provider || 'Nextway';
    const gpt4js = await getGPT4js();
    const provider = gpt4js.createProvider(providerName);
    const modelName = config.gpt4js!.modelName;
    const messages = [{ role: 'user', content: prompt }];
    try {
      content = await provider.chatCompletion(
        messages,
        {
          provider: providerName,
          model: modelName,
        },
        (data: any) => {},
      );
    } catch (e) {
      Logger.log(`Sorry, there was an error calling gpt4js.`, e);
    }
    return content;
  }

  // https://github.com/google-gemini
  if (provider === 'gemini') {
    const generationConfig = {
      temperature: 0.5,
      top_p: 1,
      top_k: 1,
      max_output_tokens: 2048,
    };
    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      },
    ];

    const genAI = new GoogleGenerativeAI(llmConfig.apiKey);
    const model = genAI.getGenerativeModel({
      model: llmConfig.modelName || '',
      generationConfig,
      safetySettings,
    });

    const chat = model.startChat();
    try {
      const result = await chat.sendMessage(prompt);
      content = result.response.text();
    } catch (e) {
      Logger.log(`Sorry, there was an error calling gemini.`, e);
    }
    return content;
  }

  if (provider === 'azure') {
    const client: AzureOpenAIApi = new AzureOpenAIApi(
      new Configuration({
        apiKey: llmConfig.apiKey,
        basePath: llmConfig.baseUrl,
        // apiVersion: llmConfig.apiVersion,
        // azureEndpoint: llmConfig.baseUrl,
      }),
    );

    const response = await client.createCompletion({
      model: llmConfig.modelName,
      prompt: prompt,
      max_tokens: 100,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });
    content = response.data.choices[0].text!.trim();
    return content;
  }

  if (provider === 'custom') {
    try {
      const data = { message: prompt, ...llmConfig.data };
      const response = await axios.post(
        llmConfig.baseUrl ?? '',
        data,
        llmConfig.requestConfig,
      );

      if (response && response.data) {
        const responsePath =
          llmConfig.responsePath || 'data.choices[0].message.content';
        content = get(response.data, responsePath, '');
      }
      return content;
    } catch (error) {
      console.error('Error making custom API call:', error);
      throw error;
    }
  }

  Logger.log(provider, JSON.stringify(llmConfig));
  const client = new OpenAI({
    apiKey: llmConfig.apiKey,
    baseURL: llmConfig.baseUrl,
  });
  const response = await client.chat.completions.create({
    model: llmConfig.modelName,
    messages: [{ role: 'user', content: prompt }],
  });
  if (response) {
    content = response.choices[0]!.message?.content || '';
  }

  return content.replace('\n', '');
};

export { callAIInterface };
