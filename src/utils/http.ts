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

export { httpGet };
