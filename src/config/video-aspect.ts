import { VideoAspect } from './constant';
import { Root } from './root';

let stageWidth = 1920;
let stageHeight = 1080;

const setWH = (width: number, height: number): void => {
  stageWidth = width;
  stageHeight = height;
};

const toResolution = (aspect: VideoAspect): [number, number] => {
  switch (aspect) {
    case VideoAspect.Landscape:
      return [stageWidth, stageHeight];
    case VideoAspect.Portrait:
      return [stageHeight, stageWidth];
    case VideoAspect.Square:
      return [stageHeight, stageHeight];
    default:
      throw new Error('Unknown video aspect ratio');
  }
};

const getWH = (): [number, number] => {
  const { videoAspect = VideoAspect.Portrait } = Root.currentConfig || {};
  const [videoWidth, videoHeight] = toResolution(videoAspect);
  return [videoWidth, videoHeight];
};

const setSize = (width: number, height: number): void => {
  setWH(width, height);
};

const getSize = (): [number, number] => {
  return getWH();
};

export { toResolution, getWH, setWH, setSize, getSize };
