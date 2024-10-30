declare module 'gpt4js' {
  export interface Message {
    role: string;
    content: string;
  }

  export interface Options {
    provider: string;
    model?: string;
    stream?: boolean;
    temperature?: number;
    webSearch?: boolean;
    codeModelMode?: boolean;
    isChromeExt?: boolean;
  }

  export interface Provider {
    chatCompletion(
      messages: Message[],
      options: Options,
      callback?: (data: any) => void,
    ): Promise<string>;
  }

  export default function getGPT4js(...args: any[]): Promise<typeof GPT4js>;

  export class GPT4js {
    static createProvider(providerName: string): Provider;
  }
}
