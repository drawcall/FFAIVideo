import { G4F } from 'g4f';
import OpenAI from 'openai';
import axios from 'axios';
import { get } from 'lodash';
import { OpenAIApi as AzureOpenAIApi, Configuration } from 'azure-openai';
import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
} from '@google/generative-ai';
import { VideoConfig, LLMConfig } from './config/config';
import { Logger } from './utils/log';

const getLLMConfig = (config: VideoConfig): LLMConfig => {
  const provider = config.provider!.toLowerCase();
  let llmConfig: LLMConfig = { ...config.default };

  const providerConfigs: { [key: string]: LLMConfig | undefined } = {
    moonshot: config.moonshot,
    openai: config.openai,
    azure: config.azure,
    gemini: config.gemini,
    g4f: config.g4f,
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

const generateResponse = async (
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
        Logger.log(
          provider,
          content,
          '\n',
          llmConfig.responsePath,
          response.data,
        );
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

const generateTerms = async (
  videoScript: string,
  config: VideoConfig,
): Promise<string[]> => {
  const { termsNum = 5 } = config;
  const prompt = `
# Role: Video Search Terms Generator

## Goals:
Generate ${termsNum} search terms for stock videos, depending on the subject of a video.

## Constrains:
1. the search terms are to be returned as a json-array of strings.
2. each search term should consist of 1-3 words, always add the main subject of the video.
3. you must only return the json-array of strings. you must not return anything else. you must not return the script.
4. the search terms must be related to the subject of the video.
5. reply with english search terms only.

## Output Example:
["search term 1", "search term 2", "search term 3","search term 4","search term 5"]

## Context:
### Video Script
${videoScript}
`.trim();
  const response = await generateResponse(prompt, config);
  const searchTerms: string[] = [];

  try {
    const parsedResponse = JSON.parse(response);
    if (
      !Array.isArray(parsedResponse) ||
      !parsedResponse.every(term => typeof term === 'string')
    ) {
      throw new Error('response is not a list of strings.');
    }
    searchTerms.push(...parsedResponse);
  } catch (error) {
    const match = response.match(/\["(?:[^"\\]|\\.)*"(?:,\s*"[^"\\]*")*\]/);
    if (match) {
      try {
        searchTerms.push(...JSON.parse(match[0]));
      } catch (parseError) {
        Logger.error(`could not parse response: ${response}`);
        return [];
      }
    }
  }

  return searchTerms;
};

export { generateTerms };
