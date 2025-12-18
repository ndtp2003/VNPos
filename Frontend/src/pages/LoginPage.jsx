import { useState } from "react";
import { Form, Input, Button, Card, message } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import axiosClient from "../api/axiosClient";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    
    const onFinish = async (values) => {
        setLoading(true);
        try {
            const response = await axiosClient.post('/auth/login', values);

            const {token, fullName, role} = response.data;

            login(token, {fullName, role});
            message.success('Đăng nhập thành công!');

            navigate('/pos');
        } catch (error) {
            message.error(error.response?.data?.message || error.message || 'Đăng nhập thất bại!');
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' }}>
          <Card title="Đăng nhập VNPos" style={{ width: 400 }}>
            <Form
              name="login"
              onFinish={onFinish}
              layout="vertical"
            >
              <Form.Item
                name="username"
                rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}
              >
                <Input prefix={<UserOutlined />} placeholder="Tên đăng nhập" size="large" />
              </Form.Item>
    
              <Form.Item
                name="password"
                rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" size="large" />
              </Form.Item>
    
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} block size="large">
                  Đăng nhập
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </div>
      );
    };

    export default LoginPage;

