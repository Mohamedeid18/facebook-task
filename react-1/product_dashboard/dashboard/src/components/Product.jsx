import React, { Component } from 'react';
import Card from './Card';

export default class Product extends Component {
  state = {
    name: '',
    price: '',
    quantity: '',
    category: ''
  };

  handleChange = (e) => {
    this.setState({
      [e.target.name]: e.target.value
    });
  }

  handleSubmit = (e) => {
    e.preventDefault();
    const { name, price, quantity, category } = this.state;
    // Simple validation
    if (!name.trim()) return alert("Name is required");
    const numPrice = Number(price);
    const numQty = Number(quantity);
    if (numPrice < 0 || numQty < 0) return alert("Price and Quantity must be positive");

    this.props.addProduct({
      name,
      price: numPrice,
      quantity: numQty,
      category
    });
    this.setState({ name: '', price: '', quantity: '', category: '' });
  }

  render() {
    const { products, stats, increaseQuantity, decreaseQuantity, deleteProduct, setFilter, currentFilter, clearAllProducts, maxPrice } = this.props;
    const { name, price, quantity, category } = this.state;

    return (
      <div className="container py-5">
        <h1 className="text-center mb-5">Product Dashboard</h1>
        
        {/* Stats Section */}
        <div className="row text-center mb-5">
          <div className="col-md-4">
             <h5>Total Products</h5>
             <p className="fs-2">{stats.totalProducts}</p>
          </div>
          <div className="col-md-4">
             <h5>Total Quantity</h5>
             <p className="fs-2">{stats.totalQuantity}</p>
          </div>
          <div className="col-md-4">
             <h5>Total Value</h5>
             <p className="fs-2">${stats.totalValue}</p>
          </div>
        </div>

        {stats.totalValue > 10000 && (
          <div className="alert alert-warning text-center fw-bold" role="alert">
            Total inventory value exceeds $10,000!
          </div>
        )}

        <hr className="my-4" />

        {/* Filter Buttons */}
        <div className="d-flex justify-content-center gap-2 mb-5">
           <button 
             className={`btn ${currentFilter === 'All' ? 'btn-primary' : 'btn-outline-primary'}`} 
             onClick={() => setFilter('All')}
           >
             All
           </button>
           <button 
             className={`btn ${currentFilter === 'In Stock' ? 'btn-success' : 'btn-outline-success'}`}
             onClick={() => setFilter('In Stock')}
           >
             In Stock
           </button>
           <button 
             className={`btn ${currentFilter === 'Out of Stock' ? 'btn-danger' : 'btn-outline-danger'}`}
             onClick={() => setFilter('Out of Stock')}
           >
             Out of Stock
           </button>
           <button className="btn btn-outline-danger ms-2" onClick={clearAllProducts}>
             Clear All
           </button>
        </div>

        {/* Add Product Form */}
        <div className="row g-3 align-items-center mb-5">
           <div className="col-auto">
             <span className="fw-bold fs-5">Add Product</span>
           </div>
           <div className="col">
             <input type="text" className="form-control" placeholder="Name" name="name" value={name} onChange={this.handleChange} />
           </div>
           <div className="col">
             <input type="number" className="form-control" placeholder="Price" name="price" value={price} onChange={this.handleChange} />
           </div>
           <div className="col">
             <input type="number" className="form-control" placeholder="Quantity" name="quantity" value={quantity} onChange={this.handleChange} />
           </div>
           <div className="col">
             <input type="text" className="form-control" placeholder="Category" name="category" value={category} onChange={this.handleChange} />
           </div>
           <div className="col-auto">
             <button className="btn btn-dark" onClick={this.handleSubmit}>Add</button>
           </div>
        </div>

        <div className="row g-4">
           {products.map(product => (
             <Card 
                key={product.id} 
                product={product} 
                increaseQuantity={increaseQuantity} 
                decreaseQuantity={decreaseQuantity} 
                deleteProduct={deleteProduct}
                isHighestPrice={product.price === maxPrice && maxPrice > 0}
              />
           ))}
         </div>
      </div>
    );
  }
}


