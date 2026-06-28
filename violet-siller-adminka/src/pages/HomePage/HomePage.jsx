import React, { useCallback, useEffect, useState } from 'react';
import { Button, Popconfirm, Spin, Table, Typography, message } from 'antd';
import { DeleteOutlined, EditOutlined, PlusCircleOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { deleteSellerProduct, fetchSellerProducts } from '../../api/sellerProductApi';
import { useSellerAuth } from '../../context/SellerAuthContext';
import { resolveAssetUrl } from '../../utils/mediaUrl';
import './HomePage.css';

const { Title, Text } = Typography;

export default function HomePage() {
  const { token } = useSellerAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const loadProducts = useCallback(async () => {
    if (!token) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const rows = await fetchSellerProducts(token);
      setProducts(rows);
    } catch (err) {
      message.error(err.message || 'Mahsulotlarni yuklab bo\'lmadi');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleDelete = async (productId) => {
    if (!token) return;
    setDeletingId(productId);
    try {
      await deleteSellerProduct(token, productId);
      message.success(`Mahsulot #${productId} o'chirildi`);
      setProducts((current) => current.filter((item) => Number(item.id) !== Number(productId)));
    } catch (err) {
      message.error(err.message || 'Mahsulotni o\'chirib bo\'lmadi');
    } finally {
      setDeletingId(null);
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 90,
    },
    {
      title: 'Rasm',
      dataIndex: 'image',
      key: 'image',
      width: 72,
      render: (image) =>
        image ? (
          <img src={resolveAssetUrl(image)} alt="" className="home-page__thumb" />
        ) : (
          <span className="home-page__thumb-placeholder">—</span>
        ),
    },
    {
      title: 'Sarlavha (UZ)',
      key: 'titleUz',
      render: (_, row) => row?.title?.uz || '—',
    },
    {
      title: 'Narx',
      dataIndex: 'price',
      key: 'price',
      width: 140,
    },
    {
      title: 'Bo\'lim',
      dataIndex: 'categoryName',
      key: 'categoryName',
      width: 160,
    },
    {
      title: 'Client',
      key: 'clientActive',
      width: 100,
      render: (_, row) => (row.clientActive ? 'Faol' : 'Yashirin'),
    },
    {
      title: 'Amallar',
      key: 'actions',
      width: 180,
      render: (_, row) => (
        <div className="home-page__actions">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => navigate(`/products/${row.id}/edit`)}
          >
            Tahrir
          </Button>
          <Popconfirm
            title="Mahsulotni o'chirish"
            description="Bu amalni qaytarib bo'lmaydi."
            okText="O'chirish"
            cancelText="Bekor"
            onConfirm={() => handleDelete(row.id)}
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              loading={deletingId === row.id}
            >
              O&apos;chirish
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <section className="home-page">
      <div className="home-page__head">
        <div>
          <Title level={3} className="home-page__title">
            Bosh sahifa
          </Title>
          <Text type="secondary">
            Sizning mahsulotlaringiz ro&apos;yxati. Saqlangan mahsulotlar mijozlar saytida
            ko&apos;rinadi.
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusCircleOutlined />}
          onClick={() => navigate('/products/add')}
        >
          Mahsulot qo&apos;shish
        </Button>
      </div>

      {loading ? (
        <div className="home-page__loading">
          <Spin />
        </div>
      ) : (
        <Table
          rowKey="id"
          columns={columns}
          dataSource={products}
          pagination={{ pageSize: 10, hideOnSinglePage: true }}
          locale={{ emptyText: 'Hozircha mahsulot yo\'q. «Mahsulot qo\'shish» tugmasini bosing.' }}
        />
      )}

      <p className="home-page__note">
        Mijozlar saytida ko&apos;rish: mahsulot saqlangandan keyin{' '}
        <Link to="/products/add">yangi mahsulot</Link> yoki tahrirlash orqali yangilanadi.
      </p>
    </section>
  );
}
