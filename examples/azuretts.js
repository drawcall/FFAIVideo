const { generateVideo, Logger } = require('../dist');
const path = require('path');

Logger.enabled = true;
generateVideo(
  {
    provider: 'gpt4js',
    termsNum: 6,
    subtitleMaxWidth: 9,
    videoClipDuration: 10,
    lineSplit: false,
    voiceName: 'zh-CN-XiaoxiaoNeural',
    bgMusic: path.join(__dirname, './assets/songs/m3.mp3'),
    output: path.join(__dirname, './output'),
    // https://azure.microsoft.com/en-us/products/ai-services/ai-speech
    // https://azure.microsoft.com/en-us/pricing/purchase-options/azure-account?icid=AI-Speech-Hero
    azureTTSSettings: {
      subscriptionKey: 'your azure key',
      serviceRegion: 'southeastasia',
    },
    removeCache: false,
    pexels: {
      // Register at https://www.pexels.com/api/ to get your API key.
      apiKey: 'cuXVffUOm1A5ZSkvdrhJVd4wsgqgelD8EBOsgFNe8koKkGoncRJuE9z2',
    },
    videoScript: `法国大餐，作为一种世界闻名的烹饪艺术以其精致的摆盘丰富的口感和深厚的文化底蕴，吸引着无数食客。

  走进一家法式餐厅首先映入眼帘的是典雅的装饰和柔和的灯光，营造出一种浪漫而宁静的氛围。在这样的环境中，享用一顿法国大餐，无疑是一种极致的享受。
  
  法国大餐的菜品丰富多样，从开胃菜到主菜，再到甜点，每一道都经过精心烹饪。前菜通常以清爽的沙拉或鲜美的海鲜为主，为接下来的大餐做好准备。主菜则是法式大餐的精髓，常见的有牛排、鹅肝、蜗牛等，这些食材在厨师的巧手下，被烹饪得鲜嫩多汁、口感丰富。甜点则是法国大餐的完美收尾，无论是精致的马卡龙还是香甜的焦糖布丁，都能让人回味无穷。
  
  除了美味的菜品法国大餐还注重用餐礼仪。`,
  },
  progress => {
    console.log(progress);
  },
);
