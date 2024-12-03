<p align="center">  
  <img src="./logo.png" alt="Logo" style="width:380px;">  
</p>

<p align="center"> 
A node.js project that generates short videos using popular AI LLM.
</p>

## FFAIVideo
A lightweight node.js project that utilizes the currently popular AI LLM in the industry to intelligently generate short videos. Without the need for complex configurations, simply input a short piece of text, and it can automatically synthesize an exciting video content.

## Features
- Fully developed on Node.js, enabling quick mastery by front-end developers.  
- Minimal dependencies, easy installation, cross-platform, and low machine requirements.  
- Simple usage, just input text to intelligently create compelling videos.  
- Supports Chinese and English scripts, with multiple voice options.  
- Includes subtitle generation, adjustable for font, position, color, and size.  
- Supports background music with adjustable volume.  

## Installation

```shell
npm install ffaivideo
```
Note: To run the preceding commands, Node.js and npm must be installed.

## Example usage

```javascript
const { generateVideo } = require('ffaivideo');

generateVideo(
  {
    provider: 'gpt4js',
    // Use the free gpt4js, g4f, or OpenAI, or Moonshot account
    // Or use openai gpt
    // provider: 'openai',
    // openai: {
    //   apiKey: '*',
    //   modelName: 'gpt-4-turbo-preview',
    //   baseUrl: 'https://api.openai.com/v1',
    // },
    termsNum: 8,
    subtitleMaxWidth: 9,
    videoClipDuration: 12,
    voiceName: 'zh-CN-YunjianNeural',
    bgMusic: path.join(__dirname, './assets/songs/m1.mp3'),
    output: path.join(__dirname, './output'),
    pexels: {
      apiKey: 'xxx',
    },
    videoScript: `
    ...Enter your text here
  `,
  },
  progress => {
    console.log(progress);
  },
).then(videoPath => {
  console.log(videoPath);
});
```

## Installation preparation

#### About the config of LLM
The current project already supports multiple AI LLM models such as **OpenAI**, **Moonshot**, **Azure**, **g4f**, **Google Gemini**, etc. to meet your different needs. If you want to introduce other AI LLM models, please fork this project and submit a **Pull Request (PR)** for us to evaluate and merge.

Before using this project, please make sure that you have applied for an API Key from the corresponding service provider. For example, if you plan to use **GPT-4.0** or **GPT-3.5**, you need to make sure that you already have an API Key from [OpenAI](https://openai.com/). In addition, you can also choose to use g4f, which is an open source library that provides free GPT usage services. Please note that although g4f is free, its service stability may fluctuate, and the usage experience may be good and bad from time to time. You can find its repository link on GitHub: [https://github.com/xtekky/gpt4free](https://github.com/xtekky/gpt4free).

In addition, as another option, you can apply for API services by visiting the [Moonshot ai](https://www.moonshot.cn/) platform. After registration, you will immediately receive 15 of experience money, which is enough to support about 1,500 conversations. After successfully applying, you need to set the provider to moonshot and configure the corresponding apiKey to complete the project setup.

You need to configure **apiKey**, **modelName** and **baseUrl**. For azure ai, you also need to configure **apiVersion**.

```javascript
openai: {
  apiKey: 'xxxx',
  modelName: 'gpt-4-turbo-preview',
  baseUrl: 'https://api.openai.com/v1',
},
```

#### About video material site
The video resources of this project use the [Pexels](https://www.pexels.com) website. Please visit [https://www.pexels.com/api/new/](https://www.pexels.com/api/new/) and follow the instructions to apply for a new API key so that you can use the rich materials provided by Pexels in your project.

#### About voice tts
FFAIVideo by default integrates Microsoft Edge's online text-to-speech service. This service is not only powerful but also allows users to customize and set up their own application tokens, offering more flexible configuration and usage options.
However, users in China may encounter access restrictions. For more details, please refer to this GitHub issue: https://github.com/rany2/edge-tts/issues/290.
To address this issue, we provide an alternative: you can use the Azure TTS service. This requires purchasing an Azure AI Speech service account. For more information, please visit: https://azure.microsoft.com/en-us/products/ai-services/ai-speech.
When using the Azure TTS service, a configuration example is as follows:
```
azureTTSSettings: {
  subscriptionKey: '*',
  serviceRegion: '*',
},
```

#### About installing ffmpeg
Since FFAIVideo relies on FFmpeg for its functionality, it is essential that you install a standard, well-maintained version of FFmpeg. This will ensure that FFAIVideo operates smoothly and without any compatibility issues.

* How to Install and Use FFmpeg on CentOS [https://linuxize.com/post/how-to-install-ffmpeg-on-centos-7/](https://linuxize.com/post/how-to-install-ffmpeg-on-centos-7/)  
* How to Install FFmpeg on Debian [https://linuxize.com/post/how-to-install-ffmpeg-on-debian-9/](https://linuxize.com/post/how-to-install-ffmpeg-on-debian-9/)  
* How to compiling from Source on Linux [https://www.tecmint.com/install-ffmpeg-in-linux/](https://www.tecmint.com/install-ffmpeg-in-linux/)

## API Configuration
| Parameter name | Type | Default value | Description |
|--------|------|--------|------|
| provider | string | gpt4js | LLM Provider |
| moonshot | LLMConfig | - | Moonshot configuration |
| openai | LLMConfig | - | OpenAI configuration |
| azure | LLMConfig | - | Azure configuration |
| gemini | LLMConfig | - | Gemini configuration |
| g4f | LLMConfig | - | G4F configuration |
| gpt4js | LLMConfig | - | GPT4js simplifies AI model interaction |
| customoAI | LLMConfig | - | custom ai configuration |
| pexels | MaterialSite | - | Pexels material site |
| videoScript | string | - | Script for generating videos |
| videoTerms | string \| string[] | - | Keywords for generating videos |
| videoAspect | VideoAspect | undefined | Video aspect ratio, can be undefined by default |
| videoClipDuration | number | 5 | Video clip duration, default is 5 seconds |
| lineBreakForce | boolean | true | Use line breaks to split long subtitles |
| termsNum | number | 5 | Number of keywords |
| output | string | - | Output path |
| cacheDir | string | - | Cache directory |
| voiceName | string | - | Voice name |
| voiceVolume | number | 1.0 | Voice volume, default is 1.0 |
| bgMusic | string | - | Background music |
| bgMusicVolume | number | 0.5 | Background music volume, default is 0.2 |
| fontsDir | string | - | Font directory |
| fontSize | number | 24 | Font size |
| fontName | string | - | Font name |
| textColor | string | "#FFFFFF" | Text color, default is "#FFFFFF" |
| strokeColor | string | "#000000" | Stroke color, default is "#000000" |
| strokeWidth | number | - | Stroke width |
| textBottom | number | 20 | Text bottom position |
| subtitleMaxWidth | number | - | Maximum subtitle width |
| debug | boolean | false | Debug mode |
| lastTime | number | 5 | Last time |
| azureTTSSettings | object | null | Azure TTS settings |
| getMaterial | function | null | A custom material synthesis |
| removeCache | boolean | true | Whether to remove cache |

## Reference Project
This project is inspired by and builds upon the open-source contributions from several notable repositories, including [MoneyPrinterTurbo](https://github.com/harry0703/MoneyPrinterTurbo), [MoneyPrinter](https://github.com/FujiwaraChoki/MoneyPrinter), and [MsEdgeTTS](https://github.com/Migushthe2nd/MsEdgeTTS). We express our sincere gratitude to the original authors for their dedication to the open-source community and their innovative spirit.

## License

[MIT LICENSE](./LICENSE)
