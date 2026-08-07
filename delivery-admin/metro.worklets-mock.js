'use strict';

// Temporary mock: Expo Go SDK 57 + some devices crash inside native worklets init.
// https://github.com/expo/expo/issues/48390

const noop = () => {};
const identity = (value) => value;
const call = (fn, ...args) => (typeof fn === 'function' ? fn(...args) : fn);

const RuntimeKind = {
  ReactNative: 1,
  UI: 2,
  Worker: 3,
};

const mock = {
  RuntimeKind,
  UIRuntimeId: 1,
  isBundleModeEnabled: () => false,
  toggleSlowAnimationsOnUIRuntime: noop,
  callMicrotasks: noop,
  isShareableRef: () => false,
  makeShareable: identity,
  makeShareableCloneOnUIRecursive: identity,
  makeShareableCloneRecursive: identity,
  shareableMappingCache: new Map(),
  getDynamicFeatureFlag: () => false,
  getStaticFeatureFlag: () => false,
  setDynamicFeatureFlag: noop,
  isShareable: () => false,
  isSynchronizable: () => false,
  createSerializable: identity,
  isSerializableRef: () => false,
  registerCustomSerializable: noop,
  serializableMappingCache: new Map(),
  createShareable: identity,
  createSynchronizable: (value) => ({
    value,
    get: () => value,
    set: noop,
  }),
  getRuntimeKind: () => RuntimeKind.ReactNative,
  isRNRuntime: () => true,
  isUIRuntime: () => false,
  isWorkerRuntime: () => false,
  isWorkletRuntime: () => false,
  createWorkletRuntime: () => ({}),
  getUIRuntimeHolder: () => ({}),
  getUISchedulerHolder: () => ({}),
  runOnRuntime: call,
  runOnRuntimeAsync: async (fn, ...args) => call(fn, ...args),
  runOnRuntimeAsyncWithId: async (fn, ...args) => call(fn, ...args),
  runOnRuntimeSync: call,
  runOnRuntimeSyncWithId: call,
  scheduleOnRuntime: (fn, ...args) => {
    setTimeout(() => call(fn, ...args), 0);
  },
  scheduleOnRuntimeWithId: (fn, ...args) => {
    setTimeout(() => call(fn, ...args), 0);
  },
  executeOnUIRuntimeSync: call,
  runOnJS: (fn) => fn,
  runOnUI: (fn) => fn,
  runOnUIAsync: async (fn, ...args) => call(fn, ...args),
  runOnUISync: call,
  scheduleOnRN: (fn, ...args) => {
    setTimeout(() => call(fn, ...args), 0);
  },
  scheduleOnUI: (fn, ...args) => {
    setTimeout(() => call(fn, ...args), 0);
  },
  isWorkletFunction: () => false,
  WorkletsModule: new Proxy(
    {},
    {
      get: () => noop,
    },
  ),
};

module.exports = {
  __esModule: true,
  default: mock,
  ...mock,
};
