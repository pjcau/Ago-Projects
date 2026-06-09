import React from 'react';
import productData from './data/products.json';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Product Catalog</h1>
      </header>
      <main className="product-container">
        <div className="product-grid">
          {productData.map((product) => (
            <div key={product.id} className="product-card">
              <div className="product-id">#{product.id}</div>
              <h3 className="product-name">{product.name}</h3>
              <div className="product-price">${product.price.toFixed(2)}</div>
              <p className="product-description">{product.description}</p>
            </div>
          ))}
        </div>
        
        <div className="product-table-container">
          <h2>Product List View</h2>
          <table className="product-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Price</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {productData.map((product) => (
                <tr key={product.id}>
                  <td>{product.id}</td>
                  <td>{product.name}</td>
                  <td>${product.price.toFixed(2)}</td>
                  <td>{product.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

export default App;
