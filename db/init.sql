-- Initialize schema and seed a few sample rows for local testing

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC NOT NULL,
  description TEXT NOT NULL
);

INSERT INTO products (id, title, name, category, price, description) VALUES
  (1, 'Nordic Light', 'Minimal Desk Lamp', 'decoration', 1299, 'A warm-tone lamp for cozy desks.'),
  (2, 'Cozy Chair', 'Linen Armchair', 'furniture', 3999, 'Comfort-first chair with breathable linen upholstery.'),
  (3, 'Sound Cube', 'Bluetooth Speaker', 'gadget', 1890, 'Portable speaker with 12-hour battery life.')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_date TIMESTAMPTZ NOT NULL,
  products JSONB NOT NULL,
  price NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  payment_token TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  recipient JSONB NOT NULL,
  address TEXT NOT NULL,
  remarks TEXT,
  paid BOOLEAN DEFAULT FALSE,
  shipped BOOLEAN DEFAULT FALSE
);
