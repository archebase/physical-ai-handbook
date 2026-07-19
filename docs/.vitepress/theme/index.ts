import DefaultTheme from 'vitepress/theme';
import './custom.css';
import MermaidDiagram from './MermaidDiagram.vue';

export default {
  extends: DefaultTheme,
  enhanceApp({app}) { app.component('MermaidDiagram', MermaidDiagram); }
};
