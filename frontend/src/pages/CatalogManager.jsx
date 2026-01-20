
// pages/CatalogManager.jsx
import React, { useState, useEffect } from 'react';
import './CatalogManager.css';

function CatalogManager() {
  const [products, setProducts] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    sku: '',
    product_name: '',
    specifications: {},
    price_per_km: 0
  });

  useEffect(() => {
    fetchCatalog();
  }, []);

  const fetchCatalog = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/catalog');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Failed to fetch catalog:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = editingProduct 
        ? `http://localhost:8000/api/catalog/${editingProduct.sku}`
        : 'http://localhost:8000/api/catalog';

      const method = editingProduct ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        fetchCatalog();
        resetForm();
      }
    } catch (error) {
      console.error('Failed to save product:', error);
    }
  };

  const handleDelete = async (sku) => {
    if (!confirm('Delete this product?')) return;

    try {
      await fetch(`http://localhost:8000/api/catalog/${sku}`, {
        method: 'DELETE'
      });
      fetchCatalog();
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/api/catalog/upload', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        fetchCatalog();
      }
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      sku: '',
      product_name: '',
      specifications: {},
      price_per_km: 0
    });
    setShowAddModal(false);
    setEditingProduct(null);
  };

  return (
    <div className="catalog-manager">
      <header className="page-header">
        <div>
          <h1>OEM Product Catalog</h1>
          <p>Manage your product datasheets and specifications</p>
        </div>
        <div className="header-actions">
          <label className="upload-btn">
            📤 Upload Catalog
            <input 
              type="file" 
              accept=".json,.csv,.xlsx" 
              onChange={handleFileUpload}
              hidden
            />
          </label>
          <button 
            className="btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            ➕ Add Product
          </button>
        </div>
      </header>

      {/* Product Table */}
      <div className="catalog-table">
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Product Name</th>
              <th>Voltage</th>
              <th>Conductor</th>
              <th>Size</th>
              <th>Price/km</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.sku}>
                <td><code>{product.sku}</code></td>
                <td>{product.product_name}</td>
                <td>{product.specifications?.voltage_rating || 'N/A'}</td>
                <td>{product.specifications?.conductor_material || 'N/A'}</td>
                <td>{product.specifications?.conductor_size || 'N/A'}</td>
                <td>₹{product.price_per_km?.toLocaleString()}</td>
                <td>
                  <button onClick={() => {
                    setEditingProduct(product);
                    setFormData(product);
                    setShowAddModal(true);
                  }}>✏️</button>
                  <button onClick={() => handleDelete(product.sku)}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
            <form onSubmit={handleSubmit}>
              <input
                placeholder="SKU"
                value={formData.sku}
                onChange={e => setFormData({...formData, sku: e.target.value})}
                required
              />
              <input
                placeholder="Product Name"
                value={formData.product_name}
                onChange={e => setFormData({...formData, product_name: e.target.value})}
                required
              />
              <input
                type="number"
                placeholder="Price per km"
                value={formData.price_per_km}
                onChange={e => setFormData({...formData, price_per_km: parseFloat(e.target.value)})}
                required
              />
              <div className="modal-actions">
                <button type="button" onClick={resetForm}>Cancel</button>
                <button type="submit" className="btn-primary">
                  {editingProduct ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CatalogManager;
