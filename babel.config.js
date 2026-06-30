module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
          alias: {
            '@': './src',
            '@domain': './src/domain',
            '@data': './src/data',
            '@infrastructure': './src/infrastructure',
            '@presentation': './src/presentation',
            '@ai': './src/ai',
            '@shared': './src/shared',
            '@assets': './assets',
            '@tests': './__tests__',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
