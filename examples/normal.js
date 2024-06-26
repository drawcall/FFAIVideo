const { generateVideo, Logger } = require('../dist');
const path = require('path');

Logger.enabled = true;
generateVideo(
  {
    // provider: 'moonshot',
    // moonshot: {
    //   apiKey: 'xxxxxxxx',
    //   modelName: 'moonshot-v1-8k',
    // },
    termsNum: 8,
    subtitleMaxWidth: 9,
    videoClipDuration: 10,
    voiceName: 'zh-CN-XiaoxiaoNeural',
    fontSize: 16,
    textColor: '#ffffff',
    strokeColor: '#30004a',
    fontsDir: path.join(__dirname, './assets/font/'),
    fontName: '071-上首锐锋体',
    bgMusic: path.join(__dirname, './assets/songs/m2.mp3'),
    output: path.join(__dirname, './output'),
    pexels: {
      apiKey: 'AkSBH49b2Vn0VN6aK8FrFxP0w9OoWbUT8rve68jArgGAWQHCs2GVPd1u',
    },
    videoScript: `西班牙火腿，作为一种享誉世界的佳肴，不仅承载了深厚的历史底蕴，更展现了卓越的烹饪艺术。

  这款火腿源自古老的西班牙传统，选用优质的猪种，经过精细的饲养和挑选，确保原料的品质上乘。制作过程中，火腿会在低温下经过长时间的腌制和风干，使肉质更加紧实，口感更为醇厚。
  
  西班牙火腿的独特之处在于其浓郁的风味和丰富的口感。每一片火腿都散发着诱人的香气，肉质鲜嫩多汁，口感层次分明。无论是直接切片享用，还是作为冷盘搭配其他食材，都能让人感受到其独特的魅力。
  `,
  },
  progress => {
    console.log(progress);
  },
).then(videoPath => {
  console.log(videoPath);
});
