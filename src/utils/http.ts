import https from 'https';
import axios, { AxiosRequestConfig, AxiosProxyConfig } from 'axios';
import { MaterialSite } from '../config/config';

const getAxiosConfig = (site: MaterialSite) => {
  const proxyConfig: AxiosProxyConfig = {
    host: site.host || '',
    port: site.port || 0,
  };

  const axiosConfig: AxiosRequestConfig = {
    headers: {
      Authorization: site.apiKey,
    },
    proxy: site.enableProxy ? proxyConfig : false,
    timeout: 2 * 60 * 1000,
    httpsAgent: new https.Agent({ rejectUnauthorized: false }),
  };

  return axiosConfig;
};

const httpGet = async (queryUrl: string, options = {}, site: MaterialSite) => {
  const axiosConfig = getAxiosConfig(site);
  try {
    const r = await axios.get(queryUrl, { ...axiosConfig, ...options });
    if (r.status === 200 && r.data) {
      return r.data;
    }
  } catch (e) {
    console.log('Http error: ', e);
  }

  return null;
};

const buildApiUrl = (baseUrl: string, data = {}) => {
  const params = new URLSearchParams();

  // 遍历 data 对象，将所有键值对添加到 URLSearchParams
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null) {
      params.append(key, value.toString());
    }
  }

  // 如果 params 不为空，则添加 '?' 和参数字符串；否则返回原始 baseUrl
  return params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
};

const isNetUrl = (url: string) => {
  return /^(https?|ftp|file|ws|wss):\/\//.test(url);
};

export { httpGet, buildApiUrl, getAxiosConfig, isNetUrl };
