import React from 'react';
import {
  FaBrain,
  FaUserShield,
  FaRobot,
  FaDesktop,
  FaNetworkWired,
} from 'react-icons/fa';
import { FaShield } from 'react-icons/fa6';

export const aiFeatures = [
  { icon: <FaBrain />, text: 'AI-Powered Detection', color: '#4A90E2' },
  { icon: <FaShield />, text: 'Fake News Analysis', color: '#50C878' },
  { icon: <FaUserShield />, text: 'Hate Speech Monitor', color: '#FF6B6B' },
  { icon: <FaRobot />, text: 'Neural Networks', color: '#9B59B6' },
  { icon: <FaDesktop />, text: 'Machine Learning', color: '#F39C12' },
  { icon: <FaNetworkWired />, text: 'Real-time Analysis', color: '#1ABC9C' },
];