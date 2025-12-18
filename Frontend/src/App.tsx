import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { Layout, Menu, Spin } from 'antd';
import { ShopOutlined, HistoryOutlined, LogoutOutlined } from '@ant-design/icons';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SignalRProvider } from './context/SignalRContext';
import LoginPage from './pages/LoginPage';
import POSPage from './pages/POS/POSPage';
import DashboardPage from './pages/Dashboard/DashboardPage';

const { Header, Content } = Layout;

interface MainLayoutProps {
  children: ReactNode;
}

// Layout chung có Menu
const MainLayout = ({ children }: MainLayoutProps) => {
  const { logout, user } = useAuth();
  return (
    <Layout style={{ margin: 0, padding: 0, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header style={{ display: 'flex', alignItems: 'center', margin: 0, padding: '0 16px', flexShrink: 0 }}>
        <div style={{ color: 'white', fontWeight: 'bold', fontSize: 20, marginRight: 30 }}>VNPos</div>
        <Menu 
          theme="dark" 
          mode="horizontal" 
          defaultSelectedKeys={['1']} 
          style={{ flex: 1 }}
          items={[
            {
              key: '1',
              icon: <ShopOutlined />,
              label: <Link to="/pos">Bán Hàng</Link>
            },
            {
              key: '2',
              icon: <HistoryOutlined />,
              label: <Link to="/dashboard">Lịch Sử</Link>
            }
          ]}
        />
        <div style={{ color: 'white' }}>
            Xin chào, {(user as any)?.fullName || ''} 
            <LogoutOutlined style={{ marginLeft: 10, cursor: 'pointer' }} onClick={logout} />
        </div>
      </Header>
      <Content style={{ flex: 1, margin: 0, padding: 0, overflow: 'auto' }}>{children}</Content>
    </Layout>
  );
};

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <SignalRProvider> 
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            
            <Route path="/pos" element={
              <ProtectedRoute>
                <MainLayout><POSPage /></MainLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <MainLayout><DashboardPage /></MainLayout>
              </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/pos" />} />
          </Routes>
        </BrowserRouter>
      </SignalRProvider>
    </AuthProvider>
  );
}

export default App;