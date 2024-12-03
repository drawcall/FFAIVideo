const { generateVideo, Logger } = require('../dist');
const path = require('path');

Logger.enabled = true;
generateVideo(
  {
    provider: 'gpt4js',
    termsNum: 8,
    isChinese: false,
    lineBreakForce: false,
    subtitleMaxWidth: 20,
    videoClipDuration: 10,
    voiceName: 'zh-CN-XiaoxiaoNeural',
    bgMusic: path.join(__dirname, './assets/songs/m3.mp3'),
    output: path.join(__dirname, './output'),
    pexels: {
      // Register at https://www.pexels.com/api/ to get your API key.
      apiKey: 'cuXVffUOm1A5ZSkvdrhJVd4wsgqgelD8EBOsgFNe8koKkGoncRJuE9z2',
    },
    videoScript: `French cuisine, renowned worldwide as a culinary art, captivates countless diners with its exquisite presentation, rich flavors, and profound cultural heritage.
Upon entering a French restaurant, one is immediately struck by the elegant decor and soft lighting, creating a romantic and serene atmosphere. Dining in such an environment is undoubtedly a supreme pleasure.
French cuisine offers a diverse array of dishes, from appetizers to main courses and desserts, each meticulously prepared. Appetizers typically feature refreshing salads or delectable seafood, setting the stage for the meal to come. The main course is the essence of French dining, with common dishes including steak, foie gras, and escargot. These ingredients, in the hands of skilled chefs, are cooked to be tender, juicy, and rich in flavor. Desserts provide the perfect conclusion to a French meal, with delicacies such as macarons or crème brûlée leaving a lasting impression.
In addition to the delicious dishes, French dining places great emphasis on etiquette. From the arrangement of cutlery to the sequence of courses, everything follows specific conventions. Dining in such an atmosphere allows one to savor not only the food but also the cultural refinement.
In summary, French cuisine offers a unique dining experience. It is not merely a meal but a cultural heritage and expression.`,
  },
  progress => {
    console.log(progress);
  },
);
