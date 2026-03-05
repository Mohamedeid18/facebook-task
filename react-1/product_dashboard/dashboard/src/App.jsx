import { Component } from "react";
import Product from "./components/Product";

export default class App extends Component {
  state = {
    products: [
      {
        id: 1,
        name: "Laptop",
        price: 1000,
        quantity: 3,
        category: "Electronics",
      },
      {
        id: 2,
        name: "Phone",
        price: 500,
        quantity: 1,
        category: "Electronics",
      },
      {
        id: 3,
        name: "Tablet",
        price: 300,
        quantity: 5,
        category: "Electronics",
      },
    ],
    filter: "All",
  };

  increaseQuantity = (id) => {
    this.setState((prevState) => ({
      products: prevState.products.map((product) =>
        product.id === id
          ? { ...product, quantity: product.quantity + 1 }
          : product,
      ),
    }));
  };

  decreaseQuantity = (id) => {
    this.setState((prevState) => ({
      products: prevState.products.map((product) =>
        product.id === id
          ? { ...product, quantity: Math.max(0, product.quantity - 1) }
          : product,
      ),
    }));
  };

  deleteProduct = (id) => {
    this.setState((prevState) => ({
      products: prevState.products.filter((product) => product.id !== id),
    }));
  };

  addProduct = (product) => {
    const newProduct = { ...product, id: Date.now() };
    this.setState((prevState) => ({
      products: [...prevState.products, newProduct],
    }));
  };

  clearAllProducts = () => {
    this.setState({ products: [] });
  };

  setFilter = (filter) => {
    this.setState({ filter });
  };

  render() {
    const { products, filter } = this.state;

    // Filter Logic
    let filteredProducts = products;
    if (filter === "In Stock") {
      filteredProducts = products.filter((p) => p.quantity > 0);
    } else if (filter === "Out of Stock") {
      filteredProducts = products.filter((p) => p.quantity === 0);
    }

    // Statistics Logic (based on filtered view or all? usually all, but user asked for "update automatically after any change". Let's stick to ALL products for dashboard stats).
    const totalProducts = products.length;
    const totalQuantity = products.reduce((acc, p) => acc + p.quantity, 0);
    const totalValue = products.reduce(
      (acc, p) => acc + p.price * p.quantity,
      0,
    );

    const maxPrice =
      products.length > 0 ? Math.max(...products.map((p) => p.price)) : 0;

    return (
      <div>
        <Product
          products={filteredProducts}
          stats={{ totalProducts, totalQuantity, totalValue }}
          increaseQuantity={this.increaseQuantity}
          decreaseQuantity={this.decreaseQuantity}
          deleteProduct={this.deleteProduct}
          addProduct={this.addProduct}
          setFilter={this.setFilter}
          currentFilter={filter}
          clearAllProducts={this.clearAllProducts}
          maxPrice={maxPrice}
        />
      </div>
    );
  }
}
