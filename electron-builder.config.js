module.exports = {
  appId: 'com.splayer.app',
  productName: 'SPlayer',
  copyright: 'Copyright © 2024 SPlayer',

  directories: {
    output: 'dist',
    buildResources: 'build-resources'
  },

  files: [
    'dist-electron/**/*',
    'dist/**/*',
    'node_modules/**/*',
    'package.json'
  ],

  extraMetadata: {
    main: 'dist-electron/main.js'
  },

  win: {
    target: [
      {
        target: 'nsis',
        arch: ['x64']
      },
      {
        target: 'portable',
        arch: ['x64']
      }
    ],
    icon: 'build-resources/icon.ico',
    requestedExecutionLevel: 'asInvoker',
    publisherName: 'SPlayer',
    verifyUpdateCodeSignature: false
  },

  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    allowElevation: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'SPlayer',
    include: 'build-resources/installer.nsh',
    script: 'build-resources/installer.nsh'
  },

  portable: {
    artifactName: 'SPlayer-${version}-portable.exe'
  },

  mac: {
    target: [
      {
        target: 'dmg',
        arch: ['x64', 'arm64']
      }
    ],
    icon: 'build-resources/icon.icns',
    category: 'public.app-category.music',
    hardenedRuntime: true,
    entitlements: 'build-resources/entitlements.mac.plist',
    entitlementsInherit: 'build-resources/entitlements.mac.plist'
  },

  linux: {
    target: [
      {
        target: 'AppImage',
        arch: ['x64']
      },
      {
        target: 'deb',
        arch: ['x64']
      }
    ],
    icon: 'build-resources/icon.png',
    category: 'AudioVideo'
  },

  publish: [
    {
      provider: 'github',
      owner: 'your-username',
      repo: 'SPlayer'
    }
  ],

  compression: 'maximum',

  asar: true,

  afterSign: 'build-resources/notarize.js'
};