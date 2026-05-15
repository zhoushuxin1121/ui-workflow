// ==========================================================================
// PSD 生成：把 AI 出的图作为底层 raster，叠加 11 个命名图层骨架，
// 让设计师在 PS 里打开后可以直接替换/编辑各图层。
// ==========================================================================

import { writePsdBuffer } from 'ag-psd';
import { PNG } from 'pngjs';

const LAYER_NAMES = [
  '01 Background',
  '02 Brand Logo',
  '03 Title Text',
  '04 Title Stroke / Decoration',
  '05 Hero Visual',
  '06 Prize Assets',
  '07 Step Panel',
  '08 Step Text',
  '09 CTA',
  '10 QR Placeholder',
  '11 Decorations',
];

/**
 * 从 URL 抓取 PNG，解码成 ag-psd 需要的 RGBA ImageData
 */
async function fetchAndDecodePng(url) {
  const buf = await readImageBuffer(url);
  return new Promise((resolve, reject) => {
    new PNG().parse(buf, (err, png) => {
      if (err) return reject(err);
      resolve({
        width: png.width,
        height: png.height,
        data: new Uint8ClampedArray(png.data.buffer, png.data.byteOffset, png.data.byteLength),
      });
    });
  });
}

async function readImageBuffer(src) {
  if (typeof src === 'string' && src.startsWith('data:image/')) {
    const m = src.match(/^data:image\/[a-z0-9.+-]+;base64,(.+)$/i);
    if (!m) throw new Error('unsupported data image format');
    return Buffer.from(m[1], 'base64');
  }
  const r = await fetch(src);
  if (!r.ok) throw new Error(`fetch image ${r.status}`);
  const ab = await r.arrayBuffer();
  return Buffer.from(ab);
}

/**
 * 生成一份多图层 PSD 文件 buffer
 * @param {string} imageUrl  AI 出的底图 URL
 * @param {object} meta       { pageName, styleName, prompt, ops }
 * @returns {Promise<Buffer>}
 */
export async function buildPsd(imageUrl, meta = {}) {
  const img = await fetchAndDecodePng(imageUrl);
  const { width, height } = img;

  // 在底图上方堆 10 个命名空图层（占位），设计师在 PS 里替换
  const placeholderLayers = LAYER_NAMES.slice(1).map(name => ({
    name,
    left: 0, top: 0, right: width, bottom: height,
    canvas: undefined,        // 空图层
    hidden: false,
    opacity: 255,
  }));

  const psd = {
    width,
    height,
    children: [
      // 底层：AI 出的图
      {
        name: LAYER_NAMES[0],
        left: 0, top: 0, right: width, bottom: height,
        imageData: img,
      },
      ...placeholderLayers,
    ],
  };

  return writePsdBuffer(psd);
}

export const PSD_LAYER_NAMES = LAYER_NAMES;
