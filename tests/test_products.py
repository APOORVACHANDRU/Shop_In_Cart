"""Tests for the Products API endpoints."""


class TestCreateProduct:
    def test_create_product_success(self, client):
        payload = {
            "name": "Laptop",
            "description": "A powerful laptop",
            "category": "Electronics",
            "price": 999.99,
            "quantity": 10,
        }
        res = client.post("/products/", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["message"] == "Product created successfully"
        assert data["product"]["name"] == "Laptop"
        assert data["product"]["price"] == 999.99
        assert data["product"]["id"] is not None

    def test_create_product_missing_fields(self, client):
        payload = {"name": "Incomplete"}
        res = client.post("/products/", json=payload)
        assert res.status_code == 422  # Validation error


class TestGetProducts:
    def test_get_empty_products(self, client):
        res = client.get("/products/")
        assert res.status_code == 200
        data = res.json()
        assert data["products"] == []
        assert data["has_next"] is False

    def test_get_products_with_data(self, client, sample_product):
        res = client.get("/products/")
        assert res.status_code == 200
        data = res.json()
        assert len(data["products"]) == 1
        assert data["products"][0]["name"] == "Test Widget"

    def test_pagination_cursor(self, client):
        # Create 7 products (page size is 5)
        for i in range(7):
            client.post("/products/", json={
                "name": f"Product {i}",
                "description": f"Description {i}",
                "price": 10.0 + i,
                "quantity": 5,
            })

        # First page
        res = client.get("/products/", params={"limit": 5})
        data = res.json()
        assert len(data["products"]) == 5
        assert data["has_next"] is True
        assert data["next_cursor"] is not None

        # Second page using cursor
        res = client.get("/products/", params={"limit": 5, "cursor": data["next_cursor"]})
        data = res.json()
        assert len(data["products"]) == 2
        assert data["has_next"] is False


class TestUpdateProduct:
    def test_update_product_success(self, client, sample_product):
        updated = {
            "name": "Updated Widget",
            "description": "Updated description",
            "category": "Electronics",
            "price": 39.99,
            "quantity": 50,
        }
        res = client.put(f"/products/{sample_product['id']}", json=updated)
        assert res.status_code == 200
        assert res.json()["product"]["name"] == "Updated Widget"
        assert res.json()["product"]["price"] == 39.99

    def test_update_nonexistent_product(self, client):
        payload = {
            "name": "Ghost",
            "description": "Doesn't exist",
            "category": "General",
            "price": 1.0,
            "quantity": 1,
        }
        res = client.put("/products/9999", json=payload)
        assert res.status_code == 404


class TestDeleteProduct:
    def test_delete_product_success(self, client, sample_product):
        res = client.delete(f"/products/{sample_product['id']}")
        assert res.status_code == 200
        assert res.json()["message"] == "Product deleted successfully"

        # Verify it's gone
        res = client.get(f"/products/{sample_product['id']}")
        assert res.status_code == 404

    def test_delete_nonexistent_product(self, client):
        res = client.delete("/products/9999")
        assert res.status_code == 404
