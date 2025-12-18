import * as esbuild from 'esbuild';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Build React components as bundled HTML resources
const components = [
  'RecruitmentList',
  'RecruitmentDetail',
  'RecruitmentForm',
  'ApplicationsList',
  'StatisticsDashboard'
];

async function buildComponents() {
  console.log('Building React components...');

  for (const component of components) {
    const result = await esbuild.build({
      entryPoints: [`src/components/${component}.tsx`],
      bundle: true,
      format: 'iife',
      globalName: 'Component',
      write: false,
      jsx: 'automatic',
      loader: { '.tsx': 'tsx' },
      minify: true
    });

    const code = result.outputFiles[0].text;

    // Wrap in HTML template with Tailwind CSS (provided by ChatGPT sandbox)
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
</head>
<body>
  <div id="root"></div>
  <script>${code}</script>
  <script>
    const props = window.openai?.data || {};
    ReactDOM.render(
      React.createElement(Component.default, props),
      document.getElementById('root')
    );
  </script>
</body>
</html>`;

    // Save bundled HTML
    writeFileSync(
      join('dist', 'components', `${component}.html`),
      html,
      'utf-8'
    );
  }

  console.log('Components built successfully!');
}

buildComponents().catch(console.error);
