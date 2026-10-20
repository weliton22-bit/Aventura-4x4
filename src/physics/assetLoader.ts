/**
 * Gerenciador e Pré-carregador Central de Sprites
 * Veículos, Peças, Cenários, Montanhas, Nuvens e Decorações dos Biomas
 */

const imageCache = new Map<string, HTMLImageElement>();
const loadedStatus = new Map<string, boolean>();

export function getImage(src: string): HTMLImageElement | null {
  if (imageCache.has(src)) {
    const img = imageCache.get(src)!;
    return loadedStatus.get(src) ? img : null;
  }

  const img = new Image();
  img.src = src;
  img.onload = () => {
    loadedStatus.set(src, true);
  };
  img.onerror = () => {
    loadedStatus.set(src, false);
  };
  imageCache.set(src, img);
  return null;
}

export const ALL_ASSETS = [
  // Veículo 1 - Speedster Retrô
  '/assets/aistudio/Body_00dfe238.png',
  '/assets/aistudio/Head_352418c6.png',
  '/assets/aistudio/Wheel__1__f1024710.png',
  '/assets/aistudio/Wheel__2__b2c3f27e.png',

  // Veículo 2 - Aríete da Horda
  '/assets/aistudio/Body_7303dd0b.png',
  '/assets/aistudio/Head_396f0d58.png',
  '/assets/aistudio/Wheel__1__80ab2e32.png',
  '/assets/aistudio/Wheel__2__7c041634.png',

  // Veículo 3 - Monster Truck
  '/assets/aistudio/Body_9c187670.png',
  '/assets/aistudio/Head_dd4ff538.png',
  '/assets/aistudio/Wheel__1__c7d1839d.png',
  '/assets/aistudio/Wheel__2__d1d40fab.png',
  '/assets/aistudio/Car_52e95eef.png',

  // Céu, Sol e Nuvens
  '/assets/aistudio/sun_81a02dcd.png',
  '/assets/aistudio/cloud1_6b2120c1.png',
  '/assets/aistudio/cloud2_cdb2c2e1.png',
  '/assets/aistudio/cloud3_3482086e.png',
  '/assets/aistudio/cloudLayer1_1dc6a707.png',
  '/assets/aistudio/cloudLayer2_dff24ccd.png',

  // Montanhas e Colinas de Fundo
  '/assets/aistudio/hills_3ab7cec6.png',
  '/assets/aistudio/hillsLarge_25777502.png',
  '/assets/aistudio/mountains_33e78798.png',
  '/assets/aistudio/mountainA_9721f091.png',
  '/assets/aistudio/mountainB_e970ee01.png',

  // Miniaturas e Fundos dos Cenários
  '/assets/aistudio/backgroundColorGrass_cef70dcc.png',
  '/assets/aistudio/backgroundColorForest_469a60c0.png',
  '/assets/aistudio/backgroundColorFall_b4df338e.png',
  '/assets/aistudio/backgroundColorDesert_0a63e5e3.png',

  // Decorações: Colinas Verdes
  '/assets/aistudio/tree_1aaf2cb3.png',
  '/assets/aistudio/treeSmall_green1_2224591d.png',
  '/assets/aistudio/bush1_e14d775d.png',
  '/assets/aistudio/bush2_35c22084.png',

  // Decorações: Floresta Selvagem
  '/assets/aistudio/treePine_a7314ced.png',
  '/assets/aistudio/treePineSnow_c7a6593f.png',
  '/assets/aistudio/fence_74a4fd03.png',

  // Decorações: Vale do Outono
  '/assets/aistudio/treeOrange_d0c1bf45.png',
  '/assets/aistudio/treePineOrange_22e1170b.png',
  '/assets/aistudio/bushOrange1_23288293.png',
  '/assets/aistudio/bushOrange2_1e372f9d.png',

  // Decorações: Deserto & Pirâmides
  '/assets/aistudio/pyramid_3a3061b2.png',
  '/assets/aistudio/pyramidMayan_2e35b70d.png',
  '/assets/aistudio/cactus1_43a58b9f.png',
  '/assets/aistudio/cactus2_3d81fa30.png',
  '/assets/aistudio/cactus3_628b26ea.png',
  '/assets/aistudio/treePalm_879b25be.png'
];

export function preloadAllVehicleAssets(): Promise<void[]> {
  return Promise.all(
    ALL_ASSETS.map(
      (url) =>
        new Promise<void>((resolve) => {
          if (loadedStatus.get(url)) {
            resolve();
            return;
          }
          const img = new Image();
          img.src = url;
          img.onload = () => {
            imageCache.set(url, img);
            loadedStatus.set(url, true);
            resolve();
          };
          img.onerror = () => {
            loadedStatus.set(url, false);
            resolve();
          };
        })
    )
  );
}
