const { generateVideo, Logger } = require('../dist');
const path = require('path');

Logger.enabled = true;
console.log('Before running the example, please make sure to apply for and obtain the relevant API keys required.');
generateVideo(
  {
    // Get your API key at https://platform.openai.com/api-keys
    // Or Visit https://platform.moonshot.cn/console/api-keys to get your API key.
    // provider: 'moonshot',
    // moonshot: {
    //   apiKey: 'xxxxxxxx',
    //   modelName: 'moonshot-v1-8k',
    // },
    termsNum: 8,
    subtitleMaxWidth: 9,
    videoClipDuration: 10,
    // error WSServerHandshakeError: 403
    // https://github.com/rany2/edge-tts/issues/290
    voiceName: 'zh-CN-XiaoxiaoNeural',
    fontSize: 16,
    textColor: '#ffffff',
    strokeColor: '#30004a',
    fontsDir: path.join(__dirname, './assets/font/'),
    fontName: '071-上首锐锋体',
    bgMusic: path.join(__dirname, './assets/songs/m2.mp3'),
    output: path.join(__dirname, './output'),
    pexels: {
      // Register at https://www.pexels.com/api/ to get your API key.
      apiKey: 'cuXVffUOm1A5ZSkvdrhJVd4wsgqgelD8EBOsgFNe8koKkGoncRJuE9z2',
    },
    videoScript: `意大利，这个位于欧洲南部的国家，以其丰富的历史、文化和美食而闻名于世。古罗马帝国的辉煌在这里留下了深刻的印记，古罗马竞技场、斗兽场和无数历史遗迹都诉说着过去的荣耀。这里还是文艺复兴的发源地，佛罗伦萨、威尼斯、罗马等城市充满了艺术的气息，无数大师的作品令人叹为观止。

    除了历史和艺术，意大利还是美食的天堂。披萨、意面、提拉米苏等美食都是意大利的代表性佳肴，令人垂涎欲滴。漫步在意大利的街头巷尾，你会被浓郁的咖啡香和面包的烘焙香所吸引，每一口都是对味蕾的极致享受。
    
    总之，意大利是一个充满魅力的国家，无论是历史的厚重、艺术的璀璨还是美食的诱惑，都让人流连忘返。
  `,
  },
  progress => {
    console.log(progress);
  },
).then(videoPath => {
  console.log(videoPath);
});
