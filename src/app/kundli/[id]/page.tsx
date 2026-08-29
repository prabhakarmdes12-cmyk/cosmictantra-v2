'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import KundliWorkspaceClient from './KundliWorkspaceClient';

export default function KundliPage() {
  const params = useParams();
  const id = (params?.id as string) || 'gandhi-1869';

  return <KundliWorkspaceClient id={id} />;
}
