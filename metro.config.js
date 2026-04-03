const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    assetExts: [
      ...defaultConfig.resolver.assetExts,
      'glb',
      'gltf',
      'obj',
      'mtl',
      'vrx',
    ],
  },
};

module.exports = mergeConfig(defaultConfig, config);
