import React from 'react';
import {createRoot} from 'react-dom/client';
import App from '../app/page';
createRoot(document.getElementById('root')!).render(<App previewOnly/>);
