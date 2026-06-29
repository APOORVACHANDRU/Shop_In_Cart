"""Tests for the Sales Order workflow and business logic."""


class TestSalesOrderCreation:
    def test_create_order_success(self, client, sample_product):
        payload = {
            "customer_name": "John Doe",
            "items": [{"product_id": sample_product["id"], "quantity": 2}],
        }
        res = client.post("/sales-orders/", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["customer_name"] == "John Doe"
        assert data["status"] == "draft"
        assert data["total"] == sample_product["price"] * 2
        assert len(data["items"]) == 1

    def test_create_order_insufficient_stock(self, client, sample_product):
        payload = {
            "customer_name": "Greedy Buyer",
            "items": [{"product_id": sample_product["id"], "quantity": 9999}],
        }
        res = client.post("/sales-orders/", json=payload)
        assert res.status_code == 400
        assert "Not enough stock" in res.json()["detail"]

    def test_create_order_invalid_product(self, client):
        payload = {
            "customer_name": "Jane Doe",
            "items": [{"product_id": 9999, "quantity": 1}],
        }
        res = client.post("/sales-orders/", json=payload)
        assert res.status_code == 404


class TestOrderStatusWorkflow:
    """Test the order state machine: draft → confirmed → shipped → delivered."""

    def _create_order(self, client, product_id, quantity=2):
        payload = {
            "customer_name": "Test Customer",
            "items": [{"product_id": product_id, "quantity": quantity}],
        }
        res = client.post("/sales-orders/", json=payload)
        return res.json()

    def test_confirm_order_deducts_stock(self, client, sample_product):
        order = self._create_order(client, sample_product["id"], quantity=10)

        # Confirm the order
        res = client.put(f"/sales-orders/{order['id']}/status", json={"status": "confirmed"})
        assert res.status_code == 200

        # Check stock was deducted
        product_res = client.get(f"/products/{sample_product['id']}")
        assert product_res.json()["quantity"] == 100 - 10  # original was 100

    def test_cancel_confirmed_order_restores_stock(self, client, sample_product):
        order = self._create_order(client, sample_product["id"], quantity=5)

        # Confirm then cancel
        client.put(f"/sales-orders/{order['id']}/status", json={"status": "confirmed"})
        client.put(f"/sales-orders/{order['id']}/status", json={"status": "cancelled"})

        # Stock should be restored
        product_res = client.get(f"/products/{sample_product['id']}")
        assert product_res.json()["quantity"] == 100

    def test_full_lifecycle(self, client, sample_product):
        order = self._create_order(client, sample_product["id"])

        # draft → confirmed → shipped → delivered
        for status in ["confirmed", "shipped", "delivered"]:
            res = client.put(f"/sales-orders/{order['id']}/status", json={"status": status})
            assert res.status_code == 200

        # Verify final status
        res = client.get(f"/sales-orders/{order['id']}")
        assert res.json()["status"] == "delivered"

    def test_invalid_status_rejected(self, client, sample_product):
        order = self._create_order(client, sample_product["id"])
        res = client.put(f"/sales-orders/{order['id']}/status", json={"status": "invalid"})
        assert res.status_code == 400


class TestOrderDeletion:
    def test_can_delete_draft_order(self, client, sample_product):
        payload = {
            "customer_name": "Delete Me",
            "items": [{"product_id": sample_product["id"], "quantity": 1}],
        }
        order = client.post("/sales-orders/", json=payload).json()
        res = client.delete(f"/sales-orders/{order['id']}")
        assert res.status_code == 200

    def test_cannot_delete_confirmed_order(self, client, sample_product):
        payload = {
            "customer_name": "Keep Me",
            "items": [{"product_id": sample_product["id"], "quantity": 1}],
        }
        order = client.post("/sales-orders/", json=payload).json()
        client.put(f"/sales-orders/{order['id']}/status", json={"status": "confirmed"})

        res = client.delete(f"/sales-orders/{order['id']}")
        assert res.status_code == 400


class TestInvoices:
    def test_create_invoice_from_confirmed_order(self, client, sample_product):
        payload = {
            "customer_name": "Invoice Customer",
            "items": [{"product_id": sample_product["id"], "quantity": 3}],
        }
        order = client.post("/sales-orders/", json=payload).json()
        client.put(f"/sales-orders/{order['id']}/status", json={"status": "confirmed"})

        res = client.post(f"/sales-orders/{order['id']}/invoice")
        assert res.status_code == 200
        invoice = res.json()
        assert invoice["customer_name"] == "Invoice Customer"
        assert invoice["status"] == "unpaid"
        assert invoice["total"] == order["total"]

    def test_cannot_invoice_draft_order(self, client, sample_product):
        payload = {
            "customer_name": "Draft Customer",
            "items": [{"product_id": sample_product["id"], "quantity": 1}],
        }
        order = client.post("/sales-orders/", json=payload).json()

        res = client.post(f"/sales-orders/{order['id']}/invoice")
        assert res.status_code == 400

    def test_cannot_duplicate_invoice(self, client, sample_product):
        payload = {
            "customer_name": "One Invoice Only",
            "items": [{"product_id": sample_product["id"], "quantity": 1}],
        }
        order = client.post("/sales-orders/", json=payload).json()
        client.put(f"/sales-orders/{order['id']}/status", json={"status": "confirmed"})

        # First invoice succeeds
        res = client.post(f"/sales-orders/{order['id']}/invoice")
        assert res.status_code == 200

        # Second invoice fails
        res = client.post(f"/sales-orders/{order['id']}/invoice")
        assert res.status_code == 400
