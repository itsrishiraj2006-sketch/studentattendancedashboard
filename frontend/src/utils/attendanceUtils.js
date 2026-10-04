/**
 * Reusable attendance status classifier
 * @param {number} percentage 
 * @param {object} thresholds { high: 75, low: 60 }
 * @returns {string} 'HIGH' | 'AVERAGE' | 'LOW'
 */
export function calculateAttendanceStatus(percentage, thresholds = { high: 75, low: 60 }) {
  const p = parseFloat(percentage) || 0;
  const high = parseFloat(thresholds.high ?? 75);
  const low = parseFloat(thresholds.low ?? 60);

  if (p >= high) {
    return 'HIGH';
  } else if (p >= low) {
    return 'AVERAGE';
  } else {
    return 'LOW';
  }
}

export function getStatusBadgeConfig(status) {
  switch (status?.toUpperCase()) {
    case 'HIGH':
      return {
        label: 'High Attendance',
        bg: 'bg-[#35D07F]/15 text-[#35D07F] border-[#35D07F]/30',
        text: 'text-[#35D07F]',
        bar: 'bg-[#35D07F]',
        color: '#35D07F',
        glow: '0 0 15px rgba(53, 208, 127, 0.4)'
      };
    case 'AVERAGE':
      return {
        label: 'Average Attendance',
        bg: 'bg-[#FFC857]/15 text-[#FFC857] border-[#FFC857]/30',
        text: 'text-[#FFC857]',
        bar: 'bg-[#FFC857]',
        color: '#FFC857',
        glow: '0 0 15px rgba(255, 200, 87, 0.4)'
      };
    case 'LOW':
    default:
      return {
        label: 'Low Attendance',
        bg: 'bg-[#FF5577]/15 text-[#FF5577] border-[#FF5577]/30',
        text: 'text-[#FF5577]',
        bar: 'bg-[#FF5577]',
        color: '#FF5577',
        glow: '0 0 15px rgba(255, 85, 119, 0.4)'
      };
  }
}
