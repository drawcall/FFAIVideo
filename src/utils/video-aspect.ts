import { VideoAspect } from "../config/constant";

const toResolution = (aspect: VideoAspect): [number, number] => {
  switch (aspect) {
    case VideoAspect.Landscape:
      return [1920, 1080];
    case VideoAspect.Portrait:
      return [1080, 1920];
    case VideoAspect.Square:
      return [1080, 1080];
    default:
      throw new Error("Unknown video aspect ratio");
  }
};

export { toResolution };
