import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

console.log('main.tsx: attempting to mount React app...');
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('main.tsx: #root element not found!');
} else {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log('main.tsx: app rendered');
}
