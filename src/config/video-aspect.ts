import { VideoAspect } from './constant';
import { Root } from './root';

const toResolution = (aspect: VideoAspect): [number, number] => {
  switch (aspect) {
    case VideoAspect.Landscape:
      return [1920, 1080];
    case VideoAspect.Portrait:
      return [1080, 1920];
    case VideoAspect.Square:
      return [1080, 1080];
    default:
      throw new Error('Unknown video aspect ratio');
  }
};

const getWH = () => {
  const { videoAspect = VideoAspect.Portrait } = Root.currentConfig || {};
  const [videoWidth, videoHeight] = toResolution(videoAspect);
  return [videoWidth, videoHeight];
};

export { toResolution, getWH };
