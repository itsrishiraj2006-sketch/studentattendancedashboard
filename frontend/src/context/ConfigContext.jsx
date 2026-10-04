import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const ConfigContext = createContext();

export function ConfigProvider({ children }) {
  const [thresholds, setThresholds] = useState({ high: 75, low: 60, late_weight: 0.5 });
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      if (res.data?.settings) {
        setThresholds({
          high: res.data.settings.high_threshold ?? 75,
          low: res.data.settings.low_threshold ?? 60,
          late_weight: res.data.settings.late_weight ?? 0.5
        });
      }
    } catch (err) {
      console.warn('Using default threshold settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateThresholds = async (newSettings) => {
    await api.put('/settings', newSettings);
    await fetchSettings();
  };

  return (
    <ConfigContext.Provider value={{ thresholds, updateThresholds, fetchSettings, loading }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  return useContext(ConfigContext);
}
