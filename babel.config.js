module.exports = {
  presets: [
    [
      '@vue/cli-plugin-babel/preset',
      { useBuiltIns: false }
    ]
  ],
  env: {
    test: {
      plugins: [
        [
          'module-resolver',
          {
            root:  ['.'],
            alias: {
              '@': '.',
              '~': '.',
            },
          },
        ],
      ],
    },
  },
};
