import { useState, useEffect, useRef } from 'react';
import { Layout, Row, Col, Card, Input, List, Button, InputNumber, message, Typography, Space, Divider } from 'antd';
import { ShoppingCartOutlined, DeleteOutlined, UpOutlined, DownOutlined } from '@ant-design/icons';
import axiosClient from '../../api/axiosClient';
import { useSignalR } from '../../context/SignalRContext';

const { Content, Sider } = Layout;
const { Title, Text } = Typography;
const { Search } = Input;

const POSPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const searchTimeoutRef = useRef(null);
  const connection = useSignalR();

  const [cart, setCart] = useState([]);
  const [finalAmount, setFinalAmount] = useState(0);

  const fetchProducts = async (page = 1, search = '') => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/product', {
        params: { PageNumber: page, PageSize: 10, SearchTerm: search }
      });
      setProducts(res.data.items);
      setPagination(prev => ({ ...prev, current: page, total: res.data.totalCount }));
    } catch (error) {
      message.error('Không thể tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(1, '');
  }, []);

  // Listen for real-time product stock updates via SignalR
  useEffect(() => {
    if (connection) {
      connection.on('ReceiveProductStockUpdate', (data) => {
        const { productId, quantityInStock } = data;
        
        setProducts(prevProducts => 
          prevProducts.map(product => {
            const prodId = product.productId || product.id;
            if (prodId === productId) {
              return { ...product, quantityInStock };
            }
            return product;
          })
        );

        setCart(prevCart => 
          prevCart.map(item => {
            const itemId = item.productId || item.id;
            if (itemId === productId) {
              const newQuantity = Math.min(item.quantity, quantityInStock);
              if (newQuantity < item.quantity) {
                message.warning(`${item.name}: Số lượng đã được điều chỉnh về ${newQuantity} do tồn kho thay đổi`);
              }
              return { ...item, quantityInStock, quantity: newQuantity };
            }
            return item;
          })
        );
      });
    }

    return () => {
      if (connection) {
        connection.off('ReceiveProductStockUpdate');
      }
    };
  }, [connection]);

  // Debounce search input to avoid excessive API calls
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      fetchProducts(1, searchTerm);
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  const addToCart = (product) => {
    const productId = product.productId || product.id;
    if (!product || !productId) {
      return;
    }
    
    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(item => {
        const itemId = item.productId || item.id;
        return itemId === productId || String(itemId) === String(productId);
      });
      
      if (existingIndex >= 0) {
        const newCart = [...prevCart];
        newCart[existingIndex] = {
          ...newCart[existingIndex],
          quantity: newCart[existingIndex].quantity + 1
        };
        return newCart;
      } else {
        const productToAdd = { ...product };
        if (!productToAdd.id && productToAdd.productId) {
          productToAdd.id = productToAdd.productId;
        }
        return [...prevCart, { ...productToAdd, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => {
      const itemId = item.productId || item.id;
      return String(itemId) !== String(productId);
    }));
  };

  const updateCartQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart(prevCart => prevCart.map(item => {
      const itemId = item.productId || item.id;
      if (String(itemId) === String(productId)) {
        const maxQuantity = item.quantityInStock || 0;
        const validatedQuantity = Math.min(newQuantity, maxQuantity);
        
        if (validatedQuantity < newQuantity) {
          message.warning(`Số lượng tối đa là ${maxQuantity}`);
        }
        
        return { ...item, quantity: validatedQuantity };
      }
      return item;
    }));
  };

  useEffect(() => {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setFinalAmount(total);
  }, [cart]);

  const handleCheckout = async () => {
    if (cart.length === 0) return message.warning('Giỏ hàng đang trống!');

    const validItems = cart.filter(item => item.quantity > 0);

    if (validItems.length === 0) {
      message.warning('Giỏ hàng không có sản phẩm hợp lệ!');
      return;
    }

    const invalidItems = validItems.filter(item => {
      const maxQuantity = item.quantityInStock || 0;
      return item.quantity > maxQuantity;
    });

    if (invalidItems.length > 0) {
      message.error('Số lượng sản phẩm vượt quá tồn kho!');
      return;
    }

    const validTotalAmount = validItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    try {
      const payload = {
        totalAmount: validTotalAmount,
        items: validItems.map(item => ({
          productId: item.productId || item.id,
          quantity: item.quantity
        }))
      };

      await axiosClient.post('/order', payload);
      
      message.success('Tạo đơn hàng thành công!');
      setCart([]);
      fetchProducts(pagination.current, searchTerm);
    } catch (error) {
      message.error(error.response?.data?.Message || 'Tạo đơn hàng thất bại!');
    }
  };


  return (
    <Layout style={{ height: '100vh', display: 'flex', flexDirection: 'row', overflow: 'hidden', margin: 0, padding: 0 }}>
      <Content style={{ 
        padding: '8px', 
        flex: '0 0 70%',
        width: '70%',
        maxWidth: '70%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        margin: 0
      }}>
        <Title level={3} style={{ margin: '0 0 8px 0', fontSize: 18, padding: '0 4px' }}>Danh Sách Sản Phẩm</Title>
        <Search 
          placeholder="Tìm tên sản phẩm..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onSearch={(val) => { setSearchTerm(val); fetchProducts(1, val); }} 
          enterButton 
          allowClear
          style={{ marginBottom: 8 }}
          size="middle"
        />
        
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', margin: 0, padding: 0 }}>
          <List
            grid={{ gutter: 8, column: 2 }}
            dataSource={products}
            loading={loading}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              onChange: (page) => fetchProducts(page, searchTerm),
              size: 'small',
              showSizeChanger: false,
              showQuickJumper: false
            }}
            renderItem={item => {
              const itemId = item.productId || item.id;
              return (
              <List.Item
                key={itemId}
                style={{ 
                  padding: '2px',
                  marginBottom: 4
                }}
              >
                <div 
                  style={{ 
                    width: '100%', 
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #f0f0f0',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    backgroundColor: '#fff'
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    addToCart(item);
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                    e.currentTarget.style.borderColor = '#1890ff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#fff';
                    e.currentTarget.style.borderColor = '#f0f0f0';
                  }}
                >
                  <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 4 }}>
                    {item.name}
                  </Text>
                  <Space direction="vertical" size={2} style={{ width: '100%' }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Giá: <Text strong style={{ color: '#1890ff' }}>{item.price.toLocaleString()} đ</Text>
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12, color: 'green' }}>
                      Còn: {item.quantityInStock}
                    </Text>
                  </Space>
                </div>
              </List.Item>
              );
            }}
          />
        </div>
      </Content>

      <Sider 
        width="30%" 
        theme="light" 
        style={{ 
          padding: '8px', 
          borderLeft: '1px solid #ddd', 
          display: 'flex', 
          flexDirection: 'column',
          flex: '0 0 30%',
          maxWidth: '30%',
          overflow: 'hidden',
          height: '100vh',
          margin: 0
        }}
      >
        <Title level={4} style={{ margin: '0 0 8px 0', fontSize: 16, padding: '0 4px' }}><ShoppingCartOutlined /> Giỏ Hàng</Title>
        
        <div style={{ 
          maxHeight: 'calc(100vh - 280px)',
          overflowY: 'auto', 
          overflowX: 'hidden',
          marginBottom: 8,
          minHeight: 0
        }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#999', fontSize: 14 }}>
              Giỏ hàng trống
            </div>
          ) : (
            <List
              dataSource={cart}
              size="small"
              renderItem={(item, index) => {
                const itemId = item.productId || item.id;
                return (
                <List.Item
                  key={`${itemId}-${index}`}
                  style={{ 
                    padding: '8px 0',
                    borderBottom: '1px solid #f0f0f0'
                  }}
                >
                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Text strong style={{ display: 'block', marginBottom: 2, fontSize: 13 }}>{item.name}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>ĐG: {item.price.toLocaleString()} đ</Text>
                      </div>
                      <Button 
                        danger 
                        icon={<DeleteOutlined />} 
                        size="small" 
                        onClick={() => removeFromCart(itemId)}
                        style={{ marginLeft: 8, padding: '0 8px', height: 24 }}
                      />
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Text type="secondary" style={{ marginRight: 4, fontSize: 12 }}>SL:</Text>
                        <Button 
                          size="small" 
                          icon={<DownOutlined />} 
                          onClick={() => updateCartQuantity(itemId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          style={{ padding: '0 6px', height: 24, width: 24 }}
                        />
                        <InputNumber
                          min={1}
                          max={item.quantityInStock || 0}
                          value={item.quantity}
                          onChange={(val) => {
                            if (val && val > 0) {
                              updateCartQuantity(itemId, val);
                            }
                          }}
                          onBlur={(e) => {
                            const val = Number(e.target.value);
                            if (!val || val < 1) {
                              updateCartQuantity(itemId, 1);
                            } else if (val > (item.quantityInStock || 0)) {
                              updateCartQuantity(itemId, item.quantityInStock || 0);
                            }
                          }}
                          style={{ width: 60, height: 24 }}
                          controls={false}
                          size="small"
                        />
                        <Button 
                          size="small" 
                          icon={<UpOutlined />} 
                          onClick={() => updateCartQuantity(itemId, item.quantity + 1)}
                          disabled={item.quantity >= (item.quantityInStock || 9999)}
                          style={{ padding: '0 6px', height: 24, width: 24 }}
                        />
                      </div>
                      <Text strong style={{ color: '#1890ff', fontSize: 14 }}>
                        {(item.price * item.quantity).toLocaleString()} đ
                      </Text>
                    </div>
                  </div>
                </List.Item>
                );
              }}
            />
          )}
        </div>
        
        <Divider style={{ margin: '8px 0' }} />
        
        <div style={{ flexShrink: 0, padding: '0 4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text strong style={{ fontSize: 14 }}>Tạm tính:</Text>
            <Text strong style={{ fontSize: 15 }}>
              {cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()} đ
            </Text>
          </div>
          
          <div style={{ marginBottom: 6 }}>
            <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 4 }}>Khách phải trả:</Text>
            <InputNumber 
              style={{ width: '100%' }} 
              value={finalAmount}
              onChange={val => setFinalAmount(val || 0)}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
              min={0}
              size="middle"
            />
          </div>
          
          <Button type="primary" size="middle" block onClick={handleCheckout} disabled={cart.length === 0}>
            THANH TOÁN
          </Button>
        </div>
      </Sider>
    </Layout>
  );
};

export default POSPage;