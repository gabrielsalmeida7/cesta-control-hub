module.exports = {
  presets: [
    ['@babel/preset-env', {targets: {node: 'current'}}],
    '@babel/preset-react', // For React JSX
    '@babel/preset-typescript', // For TypeScript
  ],
};
