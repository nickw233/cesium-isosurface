import { Isosurface } from '../src/index';
import { Cartesian3, ArcGISTiledElevationTerrainProvider, Entity } from 'cesium';
import { ImageData } from 'canvas';
// @ts-ignore
global.ImageData = ImageData; // 将 ImageData 挂载到全局

describe('Isosurface-analysis', async () => {
  const aoi = [].map(item => new Cartesian3(item.x, item.y, item.z));

  const terrainProv = await ArcGISTiledElevationTerrainProvider.fromUrl(
    'https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer',
    {}
  );

  const analyser = new Isosurface(terrainProv);

  it('analyse', async () => {
    const result = await analyser.analyse(aoi, 50);
    expect(result).toBeInstanceOf(Entity);
  });
});
