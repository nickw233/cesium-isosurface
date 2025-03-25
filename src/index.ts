import * as Cesium from 'cesium';

/**
 * @description 等高面配置
 * @export
 * @interface IsosurfaceOptions
 */
export interface IsosurfaceOptions {
  /**
   * @description 贴图宽度，单位像素
   * @type {number}
   * @memberof IsosurfaceOptions
   */
  width: number;
  /**
   * @description 颜色表，数量要和breakCount一致
   * @type {Cesium.Color[]}
   * @memberof IsosurfaceOptions
   */
  colors: Cesium.Color[];
  /**
   * @description 等高面高度间隔
   * @type {number}
   * @memberof IsosurfaceOptions
   */
  interval: number;
  /**
   * @description 等高面断点个数
   * @type {number}
   * @memberof IsosurfaceOptions
   */
  breakCount: number;
}

export class Isosurface {
  private _terrainProvider: Cesium.TerrainProvider;
  private _minHeight: number = 0;
  private _maxHeight: number = 0;
  private hwr: number = 1;

  /**
   * @description 等高面断点
   * @type {number[]}
   * @memberof Isosurface
   */
  breaks: number[] = [];
  /**
   * @description 等高面断点个数
   * @type {number}
   * @memberof Isosurface
   */
  breakCount: number = 5;
  /**
   * @description 贴图宽度
   * @type {number}
   * @memberof Isosurface
   */
  width: number = 1000;
  /**
   * @description 颜色表
   * @type {Cesium.Color[]}
   * @memberof Isosurface
   */
  colors: Cesium.Color[] = [];
  /**
   * @description 等高面高度间隔
   * @type {number}
   * @memberof Isosurface
   */
  interval: number = 50;
  constructor(terrainProvider: Cesium.TerrainProvider, options?: Partial<IsosurfaceOptions>) {
    this._terrainProvider = terrainProvider;
    Object.assign(this, options);
  }

  /**
   * @description 等高线等级数量（基于断点）
   * @readonly
   * @memberof ContourAnalysis
   */
  get gradeCount() {
    return this.breaks.length;
  }

  private getBbox(positions: Cesium.Cartesian3[]) {
    let sp = Cesium.Cartographic.fromCartesian(positions[0]);
    let minLat = Cesium.Math.toDegrees(sp.latitude),
      minLng = Cesium.Math.toDegrees(sp.longitude),
      maxLat = Cesium.Math.toDegrees(sp.latitude),
      maxLng = Cesium.Math.toDegrees(sp.longitude);

    for (let i = 1; i < positions.length; i++) {
      const carto = Cesium.Cartographic.fromCartesian(positions[i]);
      const lat = Cesium.Math.toDegrees(carto.latitude);
      const lng = Cesium.Math.toDegrees(carto.longitude);

      minLat = Math.min(minLat, lat);
      minLng = Math.min(minLng, lng);
      maxLat = Math.max(maxLat, lat);
      maxLng = Math.max(maxLng, lng);
    }
    return { minLat, minLng, maxLat, maxLng };
  }

  private genGrid(positions: Cesium.Cartesian3[]): Cesium.Cartographic[] {
    const cellPosisitons: Cesium.Cartographic[] = [];
    const bbox = this.getBbox(positions);
    const { minLat, minLng, maxLat, maxLng } = bbox;
    const wDist = Cesium.Cartesian3.distance(Cesium.Cartesian3.fromDegrees(minLng, minLat, 0), Cesium.Cartesian3.fromDegrees(maxLng, maxLat, 0));
    const hDist = Cesium.Cartesian3.distance(Cesium.Cartesian3.fromDegrees(minLng, minLat, 0), Cesium.Cartesian3.fromDegrees(minLng, maxLat, 0));
    this.hwr = wDist / hDist;
    const width = this.width,
      height = this.width / this.hwr;
    const dx = (maxLng - minLng) / width;
    const dy = (maxLat - minLat) / height;

    let rows: Cesium.Cartographic[][] = [];

    for (let y = 0; y < height; y++) {
      const row: Cesium.Cartographic[] = [];
      for (let x = 0; x < width; x++) {
        row.push(Cesium.Cartographic.fromDegrees(bbox.minLng + x * dx, bbox.minLat + y * dy, 0));
      }
      rows.push(row);
    }
    rows = rows.reverse();

    for (let i = 0; i < rows.length; i++) {
      for (let j = 0; j < rows[i].length; j++) {
        cellPosisitons.push(rows[i][j]);
      }
    }
    return cellPosisitons;
  }

  /**
   * 执行分析
   * @param positions 分析区域坐标点
   * @param interval 间隔
   * @returns
   */
  async analyse(positions: Cesium.Cartesian3[], interval: number | null = null): Promise<Cesium.Entity> {
    try {
      if (typeof interval === 'number') this.interval = interval;
      if (positions.length < 3) throw new Error('positions.length < 3');
      this.clear();
      return new Promise((resolve, reject) => {
        const cellPosisitons = this.genGrid(positions);
        Cesium.sampleTerrainMostDetailed(this._terrainProvider, cellPosisitons)
          .then(updatedPositions => {
            const p = this.createMaterial(positions, updatedPositions);
            resolve(p);
          })
          .catch(err => reject(err));
      });
    } catch (err) {
      return Promise.reject(err);
    }
  }

  private detectColor(height: number) {
    let color: Cesium.Color | undefined;
    for (let i = 0; i < this.breaks.length - 1; i++) {
      if (height < this.breaks[0]) {
        color = Cesium.Color.WHITE.withAlpha(0.3);
        break;
      }
      if (height >= this.breaks[i] && height < this.breaks[i + 1]) {
        color = this.colors[i];
        break;
      }
      if (height >= this.breaks[this.breaks.length - 1]) {
        color = this.colors[this.breaks.length - 1];
        break;
      }
    }
    if (!color) color = Cesium.Color.fromRandom().withAlpha(0.3);
    return color;
  }

  /**
   * 生成canvas贴图
   * @param positions 坐标点
   * @param cls 级别个数
   * @returns
   */
  private toCanvas(positions: Cesium.Cartographic[], cls: number = 5): HTMLCanvasElement {
    const hs = positions.map(p => p.height);
    const w = this.width;
    const h = Math.ceil(this.width / this.hwr);
    console.log(`w: ${w}, h: ${h}`);
    const canvas = document.createElement('canvas');
    canvas.height = h;
    canvas.width = w;
    let maxH = hs[0];
    let minH = hs[0];
    hs.forEach(h => {
      maxH = Math.max(maxH, h);
      minH = Math.min(minH, h);
    });
    this._maxHeight = maxH;
    this._minHeight = minH;

    const breaksStep = (maxH - minH) / cls;
    this.breaks = new Array(cls).fill(0).map((_, i) => Number((minH + i * breaksStep).toFixed(2)));
    const ctx = canvas.getContext('2d');
    const bitmap = new Uint8ClampedArray(w * h * 4);
    const colorMap = new Map<number, Cesium.Color>();
    this.breaks.forEach(b => {
      colorMap.set(b, Cesium.Color.fromRandom().withAlpha(0.7));
    });
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const h = hs[y * w + x];
        const color = this.detectColor(h);
        const bitmapIndex = (y * w + x) * 4;
        bitmap[bitmapIndex + 0] = color.red * 255;
        bitmap[bitmapIndex + 1] = color.green * 255;
        bitmap[bitmapIndex + 2] = color.blue * 255;
        bitmap[bitmapIndex + 3] = color.alpha * 255;
      }
    }
    const imageData = new ImageData(bitmap, w, h);
    //@ts-ignore
    ctx.putImageData(imageData, 0, 0);

    return canvas;
  }

  /**
   * 创建实体并设置材质
   * @param areaPositions 区域范围坐标
   * @param gridPositons 格网坐标
   * @returns
   */
  private createMaterial(areaPositions: Cesium.Cartesian3[], gridPositons: Cesium.Cartographic[]): Cesium.Entity {
    const canvas = this.toCanvas(gridPositons, this.breakCount);
    let polygon = new Cesium.Entity({
      polygon: {
        hierarchy: new Cesium.PolygonHierarchy(areaPositions),
        material: new Cesium.ImageMaterialProperty({
          image: canvas,
        }),
        classificationType: Cesium.ClassificationType.BOTH,
      },
    });
    return polygon;
  }

  /**
   * 清理
   */
  clear() {
    this.breaks.length = 0;
    this._minHeight = 0;
    this._maxHeight = 0;
  }
}
