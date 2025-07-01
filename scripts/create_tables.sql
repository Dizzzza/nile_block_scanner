-- Create networks table
CREATE TABLE IF NOT EXISTS networks (
    id SMALLSERIAL PRIMARY KEY,
    external_id VARCHAR(255) UNIQUE,
    network_name VARCHAR(255) NOT NULL,
    link VARCHAR(255),
    address_explorer VARCHAR(255),
    tx_explorer VARCHAR(255),
    block_explorer VARCHAR(255),
    status SMALLINT DEFAULT 1,
    scanner_table_name VARCHAR(255),
    prefix VARCHAR(10),
    address_length INTEGER,
    is_hex BOOLEAN DEFAULT false,
    short_name VARCHAR(50),
    blackbox_connected BOOLEAN DEFAULT false
);

-- Create tokens table
CREATE TABLE IF NOT EXISTS tokens (
    id SMALLSERIAL PRIMARY KEY,
    external_id VARCHAR(255) UNIQUE,
    network_id SMALLINT REFERENCES networks(id),
    decimals SMALLINT DEFAULT 6,
    token_key VARCHAR(255),
    symbol VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    contract VARCHAR(255),
    standard VARCHAR(20) CHECK (standard IN ('native', 'trc10', 'trc20', 'orc10', 'orc20')),
    mechanism VARCHAR(20) CHECK (mechanism IN ('api', 'blackbox')) DEFAULT 'api',
    token_rate_to_usd FLOAT DEFAULT 0,
    abi JSONB,
    contract_detail JSONB
);

-- Create addresses table
CREATE TABLE IF NOT EXISTS addresses (
    id SERIAL PRIMARY KEY,
    network_id SMALLINT REFERENCES networks(id),
    ts_add TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    address VARCHAR(255) UNIQUE NOT NULL,
    address_b VARCHAR(255) UNIQUE,
    is_monitoring BOOLEAN DEFAULT true
);

-- Create balances table
CREATE TABLE IF NOT EXISTS balances (
    address_id INTEGER REFERENCES addresses(id),
    token_id SMALLINT REFERENCES tokens(id),
    balance NUMERIC(39,0) DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (address_id, token_id)
);

-- Create txes table
CREATE TABLE IF NOT EXISTS txes (
    id BIGSERIAL PRIMARY KEY,
    network_id BIGINT NOT NULL,
    token_id BIGINT NOT NULL,
    block BIGINT NOT NULL,
    value VARCHAR(255) NOT NULL,
    value_txt VARCHAR(255),
    hash VARCHAR(255) NOT NULL,
    tx_fee VARCHAR(255),
    tx_fee_txt VARCHAR(255),
    from_address VARCHAR(255) NOT NULL,
    to_address VARCHAR(255) NOT NULL,
    ts BIGINT NOT NULL,
    info TEXT
);

-- Create scanned_blocks table (mainnet)
CREATE TABLE IF NOT EXISTS scanned_blocks (
    id BIGSERIAL PRIMARY KEY,
    num BIGINT UNIQUE NOT NULL,
    hash VARCHAR(64) NOT NULL
);

-- Create nile_scanned_blocks table (testnet)
CREATE TABLE IF NOT EXISTS nile_scanned_blocks (
    id BIGSERIAL PRIMARY KEY,
    num BIGINT UNIQUE NOT NULL,
    hash VARCHAR(64) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_addresses_address ON addresses(address);
CREATE INDEX IF NOT EXISTS idx_addresses_network_monitoring ON addresses(network_id, is_monitoring);
CREATE INDEX IF NOT EXISTS idx_balances_address_id ON balances(address_id);
CREATE INDEX IF NOT EXISTS idx_balances_token_id ON balances(token_id);
CREATE INDEX IF NOT EXISTS idx_tokens_network_id ON tokens(network_id);
CREATE INDEX IF NOT EXISTS idx_tokens_contract ON tokens(contract);
CREATE INDEX IF NOT EXISTS idx_tokens_standard ON tokens(standard);
CREATE INDEX IF NOT EXISTS idx_txes_hash ON txes(hash);
CREATE INDEX IF NOT EXISTS idx_txes_from_address ON txes(from_address);
CREATE INDEX IF NOT EXISTS idx_txes_to_address ON txes(to_address);
CREATE INDEX IF NOT EXISTS idx_txes_block ON txes(block);
CREATE INDEX IF NOT EXISTS idx_scanned_blocks_num ON scanned_blocks(num);
CREATE INDEX IF NOT EXISTS idx_nile_scanned_blocks_num ON nile_scanned_blocks(num);
