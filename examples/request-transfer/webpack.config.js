const { merge } = require('webpack-merge');

module.exports = (config) => {
  return merge(config, {
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
  });
};
