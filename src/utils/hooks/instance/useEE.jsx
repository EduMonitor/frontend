// src/hooks/useSSE.js
import { useState, useEffect, useRef } from 'react';

const useSSE = (axiosInstance, enabled = false, params = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState({ current: 0, total: 0, message: '' });
  const eventSourceRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    
    if (!enabled) {
      // Clean up if disabled
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    const connect = async () => {
      setLoading(true);
      setError(null);
      setData(null);
      setProgress({ current: 0, total: 0, message: 'Initializing...' });
      
      try {
        // Get temporary streaming token from your backend
        const authResponse = await axiosInstance.post('/api/v2/osint/stream-auth');
        const { streamToken } = authResponse.data;
        
        // Build query parameters
        const queryParams = new URLSearchParams({
          ...params,
          stream_token: streamToken
        }).toString();
        
        // Construct FULL URL properly - this was the issue
        const baseURL = axiosInstance.defaults.baseURL || '';
        const path = '/api/v2/osint/search/stream';
        
        // Remove any existing protocol/base from path if present
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        
        // Build proper URL
        let fullUrl;
        if (baseURL) {
          // Remove trailing slash from baseURL if present
          const cleanBaseURL = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
          fullUrl = `${cleanBaseURL}${cleanPath}?${queryParams}`;
        } else {
          // If no baseURL, assume relative path
          fullUrl = `${cleanPath}?${queryParams}`;
        }
        
        console.log('Attempting to connect to:', fullUrl); // Debug log
        
        // Create EventSource
        eventSourceRef.current = new EventSource(fullUrl);
        
        eventSourceRef.current.onmessage = (event) => {
          if (!isMountedRef.current) return;
          
          try {
            const parsedData = JSON.parse(event.data);
            
            if (parsedData.type === 'progress') {
              setProgress(parsedData);
            } else if (parsedData.type === 'result') {
              setData(prev => {
                if (!prev) {
                  return {
                    success: true,
                    count: 1,
                    results: {
                      [parsedData.platform]: [parsedData.result]
                    }
                  };
                }
                
                // Update existing data with new result
                const newResults = { ...prev.results };
                if (!newResults[parsedData.platform]) {
                  newResults[parsedData.platform] = [];
                }
                
                // Check for duplicates
                const exists = newResults[parsedData.platform].some(
                  r => r.link === parsedData.result.link
                );
                
                if (!exists) {
                  newResults[parsedData.platform] = [
                    ...newResults[parsedData.platform],
                    parsedData.result
                  ];
                  
                  // Recalculate total count
                  const totalCount = Object.values(newResults).reduce(
                    (sum, platformResults) => sum + platformResults.length, 0
                  );
                  
                  return {
                    ...prev,
                    count: totalCount,
                    results: newResults
                  };
                }
                
                return prev;
              });
            } else if (parsedData.type === 'complete') {
              setLoading(false);
              if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
              }
            } else if (parsedData.type === 'error') {
              setError(parsedData.message);
              setLoading(false);
              if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
              }
            }
          } catch (parseError) {
            console.error('Error parsing SSE data:', parseError);
          }
        };
        
        eventSourceRef.current.onerror = (err) => {
          if (!isMountedRef.current) return;
          console.error('SSE Error occurred:', err);
          setError('Connection error occurred');
          setLoading(false);
          if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
              }
        };
        
        // Handle connection opened
        eventSourceRef.current.onopen = () => {
          console.log('SSE connection opened successfully');
        };
        
      } catch (err) {
        if (!isMountedRef.current) return;
        console.error('SSE connection failed:', err);
        setError(err.response?.data?.message || err.message || 'Failed to establish connection');
        setLoading(false);
      }
    };
    
    connect();
    
    return () => {
      isMountedRef.current = false;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [axiosInstance, enabled, params]);
  
  const disconnect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setLoading(false);
    setError(null);
  };
  
  return { data, loading, error, progress, disconnect };
};

export default useSSE;