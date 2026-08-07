const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const workletsMock = path.resolve(__dirname, 'metro.worklets-mock.js');
const baseResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Keep babel plugin real; mock only the runtime package that crashes Expo Go.
  if (
    moduleName === 'react-native-worklets' ||
    (moduleName.startsWith('react-native-worklets/') &&
      !moduleName.includes('plugin'))
  ) {
    return { type: 'sourceFile', filePath: workletsMock };
  }

  return baseResolveRequest
    ? baseResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
