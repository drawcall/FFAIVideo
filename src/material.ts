import fs from 'fs-extra';
import md5 from 'md5';
import { VideoAspect } from './config/constant';
import { VideoConfig } from './config/config';
import { toResolution } from './utils/video-aspect';
import { getEnumKeyByValue } from './utils/utils';
import { writeFileWithStream } from './utils/file';
import { appequal } from './utils/utils';
import { httpGet } from './utils/http';
import { toJson } from './utils/json';
import { Logger } from './utils/log';

interface MaterialInfo {
  provider: string;
  url: string;
  duration: number;
}

const searchVideos = async (
  searchTerm: string,
  minDuration: number,
  config: VideoConfig,
): Promise<MaterialInfo[]> => {
  const { videoAspect = VideoAspect.Portrait } = config;
  const videoOrientation: string = getEnumKeyByValue(VideoAspect, videoAspect);
  const [videoWidth, videoHeight] = toResolution(videoAspect);

  const params = new URLSearchParams();
  params.append('query', searchTerm);
  params.append('per_page', '20');
  params.append('orientation', videoOrientation);
  const queryUrl = `https://api.pexels.com/videos/search?${params.toString()}`;
  const data = await httpGet(queryUrl, {}, config.pexels!);
  if (!data) return [];

  const videoItems: MaterialInfo[] = [];
  if (!('videos' in data)) {
    Logger.error(`search videos failed: ${JSON.stringify(data)}`);
    return videoItems;
  }
  const videos = data['videos'];
  for (const video of videos) {
    const duration = video['duration'];
    if (duration < minDuration) {
      continue;
    }

    const videoFiles = video['video_files'];
    for (const file of videoFiles) {
      const w = parseInt(file['width']);
      const h = parseInt(file['height']);
      const n = 10;
      if (appequal(w, videoWidth, n) && appequal(h, videoHeight, n)) {
        const item: MaterialInfo = {
          provider: 'pexels',
          url: file['link'],
          duration: duration,
        };
        videoItems.push(item);
        break;
      }
    }
  }
  return videoItems;
};

const saveVideo = async (
  videoUrl: string,
  cacheDir: string = '',
  config: VideoConfig,
): Promise<string> => {
  fs.ensureDirSync(cacheDir);
  const urlNoQuery = videoUrl.split('?')[0];
  const videoId = `vid-${md5(urlNoQuery)}`;
  const videoPath = `${cacheDir}/${videoId}.mp4`;

  // if video already exists, return the path
  if (fs.existsSync(videoPath) && fs.statSync(videoPath).size > 0) {
    return videoPath;
  }

  const stream = await httpGet(
    videoUrl,
    { responseType: 'stream' },
    config.pexels!,
  );
  if (!stream) return '';
  await writeFileWithStream(stream, videoPath);
  if (fs.existsSync(videoPath) && fs.statSync(videoPath).size > 0) {
    return videoPath;
  }
  return '';
};

const downloadVideos = async (
  searchTerms: string[],
  videoDuration: number = 0.0,
  cacheDir: string,
  config: VideoConfig,
  progress: Function,
): Promise<string[]> => {
  const { videoClipDuration: maxClipDuration = 5 } = config;
  let validVideoItems: MaterialInfo[] = [];
  const validVideoUrls: string[] = [];
  let foundDuration = 0.0;

  for (const searchTerm of searchTerms) {
    const videoItems = await searchVideos(searchTerm, maxClipDuration, config);

    for (const item of videoItems) {
      if (!validVideoUrls.includes(item.url)) {
        validVideoItems.push(item);
        validVideoUrls.push(item.url);
        foundDuration += item.duration;
      }
    }
  }

  const videoPaths: string[] = [];
  let totalDuration = 0.0;
  let index = 0;
  for (const item of validVideoItems) {
    try {
      index++;
      const savedVideoPath = await saveVideo(item.url, cacheDir, config);
      progress(40 + Math.floor((index * 45) / validVideoItems.length));
      if (savedVideoPath) {
        videoPaths.push(savedVideoPath);
        const seconds = Math.min(maxClipDuration, item.duration);
        totalDuration += seconds;
        if (totalDuration > videoDuration) {
          break;
        }
      }
    } catch (e) {
      Logger.error(`failed to download video: ${toJson(item)} => ${e}`);
    }
  }

  Logger.log(`downloaded ${videoPaths.length} videos`);
  return videoPaths;
};

export { downloadVideos };
