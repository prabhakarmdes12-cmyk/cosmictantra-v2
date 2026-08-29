'use client';

import React, { useEffect, useState } from 'react';
import Workbench from './Workbench';

export default function WorkbenchClient() {
  const [theme, setTheme] = useState('dark');
  useEffect(() => {
    try { setTheme(localStorage.getItem('cosmictantra_theme') || 'dark'); } catch { /* noop */ }
  }, []);
  return <Workbench theme={theme} />;
}
