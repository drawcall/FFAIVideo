import { convertHexToAssColor } from '../utils/utils';
import { VideoConfig } from '../config/config';

export function createSubtitlesFilter(
  subtitleFile: string,
  options: VideoConfig,
) {
  const {
    fontsDir,
    fontName,
    fontSize,
    textColor,
    strokeColor,
    strokeWidth,
    textBottom,
  } = options;
  let filter = `subtitles=${subtitleFile}`;

  if (fontsDir || fontName) {
    const str = convertFiltersToString({
      fontsdir: fontsDir,
      fontname: fontName,
      fontsize: fontSize,
      fontcolor: convertHexToAssColor(textColor || ''),
      bordercolor: convertHexToAssColor(strokeColor || ''),
      borderw: strokeWidth,
      y: textBottom,
      wrapStyle: 1,
    });
    filter += `:${str}`;
  } else {
    const str = convertFiltersToString({
      wrapStyle: 1,
    });
    filter += `:${str}`;
  }

  return `[v]${filter}[v]`;
}

function convertFiltersToString(filterObj: Record<string, any>): string {
  const {
    fontsdir,
    fontname,
    fontsize,
    fontcolor,
    bordercolor,
    borderw,
    wrapStyle,
    x,
    y,
  } = filterObj;

  const filterMap: Record<string, string> = {
    FontName: fontname,
    FontSize: fontsize,
    PrimaryColour: fontcolor,
    OutlineColour: bordercolor,
    OutlineWidth: borderw,
    Alignment: '2',
    WrapStyle: wrapStyle,
    MarginV: y,
  };

  const filterParams = Object.entries(filterMap)
    .filter(([_, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${value}`)
    .join(',');

  const forceStyle = filterParams ? `force_style='${filterParams}'` : '';

  return fontsdir
    ? `fontsdir=${fontsdir}${forceStyle ? ':' + forceStyle : ''}`
    : forceStyle;
}
