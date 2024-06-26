const PUNCTUATIONS: string[] = [
  '?',
  ',',
  '.',
  '、',
  ';',
  ':',
  '!',
  '…',
  '？',
  '，',
  '。',
  '、',
  '；',
  '：',
  '！',
  '...',
];

enum VideoAspect {
  Landscape = '16:9',
  Portrait = '9:16',
  Square = '1:1',
}

enum VideoConcatMode {
  Sequential = 'sequential',
  Random = 'random',
}

const progressFun = (p: number) => {};
const successFun = (r: string) => {};

export { VideoAspect, VideoConcatMode, progressFun, successFun, PUNCTUATIONS };
