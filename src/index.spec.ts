import { Isosurface } from '../src/index';
import { Cartesian3, ArcGISTiledElevationTerrainProvider, Entity } from 'cesium';
import { ImageData } from 'canvas';
// @ts-ignore
global.ImageData = ImageData; // 将 ImageData 挂载到全局

describe('Isosurface-analysis', async () => {
  const aoi = [
    {
      x: -998681.6898578501,
      y: 5588935.019799818,
      z: 2896640.106919751,
    },
    {
      x: -998586.3381075171,
      y: 5594248.936262258,
      z: 2886465.727390874,
    },
    {
      x: -1012827.2245570157,
      y: 5591413.529755917,
      z: 2886994.184443394,
    },
    {
      x: -1010784.4078201713,
      y: 5586788.325505503,
      z: 2896583.6726234523,
    },
  ].map(item => new Cartesian3(item.x, item.y, item.z));

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
