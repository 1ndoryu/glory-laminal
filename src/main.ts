import '../styles/variables.css';
import '../styles/editor.css';
import { boot } from './app/bootstrap';
import { requireRootElement } from './platform/dom';

boot(requireRootElement('#app'));
