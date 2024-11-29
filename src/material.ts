import fs from 'fs-extra';
import md5 from 'md5';
import path from 'path';
import axios from 'axios';
import { isEmpty } from 'lodash';
import { VideoAspect } from './config/constant';
import { VideoConfig, MaterialInfo } from './config/config';
import { toResolution } from './config/video-aspect';
import { getEnumKeyByValue } from './utils/utils';
import { writeFileWithStream, copyLocalFile } from './utils/file';
import { less } from './utils/utils';
import { httpGet, buildApiUrl } from './utils/http';
import { toJson } from './utils/json';
import { Logger } from './utils/log';
import { uuid, insertTriplet, getSampleItems } from './utils/utils';
import { isNetUrl } from './utils/http';

const searchVideos = async (
  searchTerm: string,
  minDuration: number,
  config: VideoConfig,
): Promise<MaterialInfo[]> => {
  const {
    videoAspect = VideoAspect.Portrait,
    perPage = 20,
    materialAspectRatio = true,
  } = config;
  const videoOrientation: string = getEnumKeyByValue(VideoAspect, videoAspect);
  const [videoWidth, videoHeight] = toResolution(videoAspect);
  const searchData = {
    query: searchTerm,
    per_page: perPage.toString(),
    ...(materialAspectRatio && {
      orientation: videoOrientation.toLocaleLowerCase(),
    }),
  };
  const queryUrl = `https://api.pexels.com/videos/search`;
  const data = await httpGet(
    buildApiUrl(queryUrl, searchData),
    {},
    config.pexels!,
  );
  if (!data) return [];

  const videoItems: MaterialInfo[] = [];
  if (!('videos' in data)) {
    Logger.error(`search videos failed: ${JSON.stringify(data)}`);
    return videoItems;
  }

  let videos = data['videos'];
  if (videos.length <= 1 && config.preProcessMaterialVideo) {
    videos = await config.preProcessMaterialVideo(
      queryUrl,
      searchData,
      config.pexels!,
    );
  }

  for (const video of videos) {
    const duration = video['duration'];
    if (duration < minDuration) {
      continue;
    }

    const videoFiles = video['video_files'];
    let minWidth = 99999;
    let minHeight = 99999;
    let selectedItem = null;
    for (const file of videoFiles) {
      const w = parseInt(file['width']);
      const h = parseInt(file['height']);
      if (materialAspectRatio) {
        if (less(w, videoWidth) || less(h, videoHeight)) continue;
      } else {
        if (less(w, videoWidth) && less(h, videoHeight)) continue;
      }

      if (w < minWidth || h < minHeight) {
        minWidth = w;
        minHeight = h;
        selectedItem = {
          provider: 'pexels',
          keyword: searchTerm,
          url: file['link'],
          duration: duration,
        };
      }
    }

    if (selectedItem) {
      videoItems.push(selectedItem);
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
  progress: (progress: number) => void,
): Promise<string[]> => {
  const { videoClipDuration: maxClipDuration = 10 } = config;
  let materialVideos: MaterialInfo[] = [];

  for (const [index, searchTerm] of searchTerms.entries()) {
    let videoItems = [];
    if (config.getMaterial) {
      videoItems = await config.getMaterial({
        searchTerm,
        index,
        maxClipDuration,
        cacheDir,
      });
      if (isEmpty(videoItems)) {
        videoItems = await searchVideos(searchTerm, maxClipDuration, config);
      }
    } else {
      videoItems = await searchVideos(searchTerm, maxClipDuration, config);
    }

    if (videoItems.length > 0) {
      const [a, b, c] = getSampleItems(videoItems, 3);
      materialVideos = insertTriplet(materialVideos, a, b, c);
    }
  }

  if (config.postProcessMaterialVideos) {
    materialVideos = config.postProcessMaterialVideos(materialVideos);
  }

  const videoPaths: string[] = [];
  let totalDuration = 0.0;
  let index = 0;
  for (const item of materialVideos) {
    try {
      index++;
      let savedVideoPath;
      if (isNetUrl(item.url)) {
        savedVideoPath = await saveVideo(item.url, cacheDir, config);
      } else {
        savedVideoPath = await copyLocalFile(item.url, cacheDir);
      }

      progress(40 + Math.floor((index * 45) / materialVideos.length));
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

const copyClipToCache = async (
  clipPath: string,
  cacheDir: string,
): Promise<{ videoId: string; newPath: string }> => {
  const videoId = `vid-${uuid().substring(0, 8)}`;
  const newPath = path.join(cacheDir, videoId);
  const isUrl = isNetUrl(clipPath);

  if (isUrl) {
    try {
      const response = await axios({
        method: 'GET',
        url: clipPath,
        responseType: 'stream',
      });

      await fs.ensureDir(cacheDir);
      const writer = fs.createWriteStream(newPath);
      response.data.pipe(writer);
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  } else {
    try {
      await fs.copy(clipPath, newPath);
    } catch (error) {
      console.error('Error copying file:', error);
      throw error;
    }
  }

  return { videoId, newPath };
};

export { downloadVideos, copyClipToCache };
