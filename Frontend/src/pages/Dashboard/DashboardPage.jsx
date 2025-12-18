import { useState, useEffect } from 'react';
import { Table, Tag, Typography, Card, Modal, Descriptions, List, Divider } from 'antd';
import axiosClient from '../../api/axiosClient';
import { useSignalR } from '../../context/SignalRContext';

const { Title, Text } = Typography;

const DashboardPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetail, setOrderDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const connection = useSignalR();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/order', { params: { PageNumber: 1, PageSize: 50 } });
      setOrders(res.data.items);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (connection) {
      // Listen for new order notifications via SignalR
      connection.on('ReceiveNewOrder', (newOrder) => {
        const mappedOrder = {
          orderId: newOrder.orderId,
          orderCode: newOrder.orderCode || newOrder.orderId?.substring(0, 8) + '...',
          orderTime: newOrder.orderTime,
          createdBy: newOrder.createdBy,
          createdByName: newOrder.createdByName || '',
          totalAmount: newOrder.totalAmount,
          status: newOrder.status,
          items: []
        };
        
        setOrders(prevOrders => [mappedOrder, ...prevOrders]);
      });
    }

    return () => {
      if (connection) {
        connection.off('ReceiveNewOrder');
      }
    };
  }, [connection]);

  const fetchOrderDetail = async (orderId) => {
    setDetailLoading(true);
    try {
      const res = await axiosClient.get(`/order/${orderId}`);
      setOrderDetail(res.data);
    } catch (error) {
      setOrderDetail(selectedOrder);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleRowClick = (record) => {
    setSelectedOrder(record);
    setModalVisible(true);
    fetchOrderDetail(record.orderId);
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setSelectedOrder(null);
    setOrderDetail(null);
  };

  const columns = [
    { 
      title: 'STT', 
      key: 'index',
      width: 60,
      render: (_, __, index) => index + 1
    },
    { title: 'Mã Đơn', dataIndex: 'orderCode', render: (code, record) => code || record.orderId?.substring(0, 8) + '...' },
    { title: 'Thời gian', dataIndex: 'orderTime', render: t => new Date(t).toLocaleString() },
    { title: 'Tổng tiền', dataIndex: 'totalAmount', render: t => <b style={{color: 'red'}}>{t.toLocaleString()}</b> },
    { title: 'Trạng thái', dataIndex: 'status', render: t => <Tag color="green">{t}</Tag> },
  ];

  return (
    <div style={{ padding: '16px', height: '100%', overflowY: 'auto' }}>
      <Title level={2} style={{ marginBottom: 16 }}>Lịch Sử Đơn Hàng</Title>
      <Card>
        <Table 
          dataSource={orders} 
          columns={columns} 
          rowKey="orderId" 
          loading={loading}
          pagination={{ pageSize: 10 }}
          onRow={(record) => ({
            onClick: () => handleRowClick(record),
            style: { cursor: 'pointer' }
          })}
        />
      </Card>

      <Modal
        title="Chi Tiết Đơn Hàng"
        open={modalVisible}
        onCancel={handleModalClose}
        footer={null}
        width={800}
        loading={detailLoading}
      >
        {orderDetail && (
          <>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Mã Đơn" span={2}>
                <Text strong>{orderDetail.orderCode || orderDetail.orderId}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Thời gian">
                {new Date(orderDetail.orderTime).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Người tạo">
                {orderDetail.createdByName || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Tổng tiền">
                <Text strong style={{ color: 'red', fontSize: 16 }}>
                  {orderDetail.totalAmount?.toLocaleString()} đ
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color="green">{orderDetail.status}</Tag>
              </Descriptions.Item>
            </Descriptions>

            <Divider>Danh Sách Sản Phẩm</Divider>

            {orderDetail.items && orderDetail.items.length > 0 ? (
              <List
                dataSource={orderDetail.items}
                renderItem={(item) => (
                  <List.Item>
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <Text strong style={{ display: 'block', marginBottom: 4 }}>
                          {item.productName || `Sản phẩm #${item.productId}`}
                        </Text>
                        <Text type="secondary">
                          SL: {item.quantity} × {item.unitPrice?.toLocaleString()} đ
                        </Text>
                      </div>
                      <Text strong style={{ color: '#1890ff', fontSize: 16 }}>
                        {(item.quantity * (item.unitPrice || 0)).toLocaleString()} đ
                      </Text>
                    </div>
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                Không có sản phẩm trong đơn hàng
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  );
};

export default DashboardPage;