import React, { Component } from "react";
import { FaPlus, FaMinus, FaTrash } from "react-icons/fa";

export default class extends Component {
  render() {
    const { product, increaseQuantity, decreaseQuantity, deleteProduct, isHighestPrice } = this.props;

    return (
      <div className="col-md-6">
        <div className={`card h-100 shadow-sm ${isHighestPrice ? "border-danger border-3" : ""}`}>
          <div className="card-body">
            <h3 className="card-title fw-bold mb-3">
              {product.name}
              {isHighestPrice && (
                 <span className="badge bg-danger ms-2 fs-6">Highest Price</span>
              )}
            </h3>
            <p className="card-text mb-2">
              Category: <span className="fw-bold">{product.category}</span>
            </p>
            <hr />
            <p className="card-text fs-5">
              Price: <span className="fw-bold">${Number(product.price).toFixed(2)}</span>
            </p>
            
            {product.quantity === 0 ? (
              <div className="mb-4">
                 <span className="badge bg-danger fs-6 rounded-1">Out of Stock</span>
              </div>
            ) : (
                <p className="card-text fs-5 mb-4">
                  Quantity: <span className="fw-bold">{product.quantity}</span>
                </p>
            )}

            <div className="d-flex justify-content-center gap-3 mt-4">
              <button className="btn btn-success" onClick={() => increaseQuantity(product.id)}>
                <FaPlus />
              </button>
              <button 
                className="btn btn-warning text-white" 
                onClick={() => decreaseQuantity(product.id)}
                disabled={product.quantity === 0}
              >
                <FaMinus />
              </button>
              <button className="btn btn-danger" onClick={() => deleteProduct(product.id)}>
                <FaTrash />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
