import { createContext, useEffect, useState, useContext } from 'react';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { useAuth } from './AuthContext';

const SignalRContext = createContext(null);

export const SignalRProvider = ({ children }) => {
  const [connection, setConnection] = useState(null);
  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      // Construct SignalR hub URL from API base URL
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
      const hubUrl = apiBaseUrl.replace('/api', '/hubs/order');
      
      const newConnection = new HubConnectionBuilder()
        .withUrl(hubUrl, {
          accessTokenFactory: () => token,
        })
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Information)
        .build();

      // Set connection before starting to allow components to register handlers
      setConnection(newConnection);

      newConnection.start()
        .then(() => {})
        .catch(() => {});

      return () => {
        newConnection.stop();
      };
    }
  }, [token]);

  return (
    <SignalRContext.Provider value={connection}>
      {children}
    </SignalRContext.Provider>
  );
};

export const useSignalR = () => useContext(SignalRContext);