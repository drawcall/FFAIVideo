import { VideoConfig } from './config/config';
import { Logger } from './utils/log';
import { callAIInterface } from './ai/llm';

const generateTermsWithAI = async (
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
  let response = await callAIInterface(prompt, config);
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
    response = response || '';
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

const addPunctuationWithAI = async (
  text: string,
  config: VideoConfig,
): Promise<string> => {
  const prompt = `
# Role: Text Language Detector and Punctuation Corrector

## Goals:
1. Determine if the text is in Chinese or English.
2. Add appropriate punctuation to the text if needed.
3. Remove unnecessary punctuation from the text if needed.

## Constraints:
1. First, analyze the language of the input text.
2. If the text is in Chinese, add appropriate Chinese punctuation and remove unnecessary punctuation.
3. If the text is in English, add appropriate English punctuation and remove unnecessary punctuation.
4. Return only the processed text with corrected punctuation. Do not return anything else.

## Output Format:
{
  "processedText": "这里是文字结果"
}

## Context:
### Original Text
${text}
`.trim();
  let result = text;
  const response = await callAIInterface(prompt, config);
  try {
    const parsedResponse = JSON.parse(response);
    Logger.log(parsedResponse);
    result = parsedResponse.processedText || text;
  } catch (error) {
    Logger.error(`could not parse response: ${error}`);
  }

  return result;
};

export { generateTermsWithAI, addPunctuationWithAI };
