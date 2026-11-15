const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const path = require('path');
const config = {
  server: {
    // RN's multipart development downloader dropped bytes at progress boundaries
    // in emulator QA. Serve one complete bundle; release builds are unaffected.
    enhanceMiddleware(middleware) {
      return (req, res, next) => {
        if (req.url?.split('?')[0].endsWith('.bundle')) {
          req.headers.accept = 'application/javascript';
        }
        return middleware(req, res, next);
      };
    },
  },
  resolver: {
    resolveRequest(context, moduleName, platform) {
      if (
        moduleName === 'react-native-gesture-handler' &&
        /[\\/]react-native-draggable-flatlist[\\/]/.test(
          context.originModulePath,
        )
      ) {
        return {
          type: 'sourceFile',
          filePath: path.resolve(__dirname, 'src/compat/draggableGestures.ts'),
        };
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
