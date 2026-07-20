import DefaultTheme from 'vitepress/theme';
import './custom.css';
import MermaidDiagram from './MermaidDiagram.vue';

function preloadSearchIndex() {
  if (typeof window === 'undefined') return;

  const preload = () => {
    // VitePress generates this virtual module during the production build.
    // @ts-expect-error virtual module provided by VitePress local search
    import('@localSearchIndex')
      .then(({default: indexes}) => indexes.root?.())
      .catch(() => {});
  };

  window.setTimeout(preload, 1000);
}

export default {
  extends: DefaultTheme,
  enhanceApp({app}) {
    app.component('MermaidDiagram', MermaidDiagram);
    preloadSearchIndex();
  }
};
