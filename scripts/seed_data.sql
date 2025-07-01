-- Insert TRON mainnet network
INSERT INTO networks (id, external_id, network_name, link, address_explorer, tx_explorer, block_explorer, scanner_table_name, prefix, address_length, is_hex, short_name, blackbox_connected)
VALUES (1, 'tron-mainnet', 'TRON Mainnet', 'https://tronscan.org', 'https://tronscan.org/#/address/', 'https://tronscan.org/#/transaction/', 'https://tronscan.org/#/block/', 'scanned_blocks', 'T', 34, false, 'TRX', false)
ON CONFLICT (id) DO UPDATE SET
    network_name = EXCLUDED.network_name,
    link = EXCLUDED.link,
    address_explorer = EXCLUDED.address_explorer,
    tx_explorer = EXCLUDED.tx_explorer,
    block_explorer = EXCLUDED.block_explorer;

-- Insert TRON Nile testnet network
INSERT INTO networks (id, external_id, network_name, link, address_explorer, tx_explorer, block_explorer, scanner_table_name, prefix, address_length, is_hex, short_name, blackbox_connected)
VALUES (2, 'tron-nile', 'TRON Nile Testnet', 'https://nile.tronscan.org', 'https://nile.tronscan.org/#/address/', 'https://nile.tronscan.org/#/transaction/', 'https://nile.tronscan.org/#/block/', 'nile_scanned_blocks', 'T', 34, false, 'TRX', false)
ON CONFLICT (id) DO UPDATE SET
    network_name = EXCLUDED.network_name,
    link = EXCLUDED.link,
    address_explorer = EXCLUDED.address_explorer,
    tx_explorer = EXCLUDED.tx_explorer,
    block_explorer = EXCLUDED.block_explorer;

-- Insert TRX token for mainnet
INSERT INTO tokens (id, external_id, network_id, decimals, symbol, name, standard, mechanism)
VALUES (1, 'trx-mainnet', 1, 6, 'TRX', 'TRON', 'native', 'api')
ON CONFLICT (id) DO UPDATE SET
    symbol = EXCLUDED.symbol,
    name = EXCLUDED.name;

-- Insert TRX token for nile testnet
INSERT INTO tokens (id, external_id, network_id, decimals, symbol, name, standard, mechanism)
VALUES (2, 'trx-nile', 2, 6, 'TRX', 'TRON', 'native', 'api')
ON CONFLICT (id) DO UPDATE SET
    symbol = EXCLUDED.symbol,
    name = EXCLUDED.name;

-- Insert USDT TRC20 token for mainnet
INSERT INTO tokens (id, external_id, network_id, decimals, symbol, name, contract, standard, mechanism)
VALUES (3, 'usdt-trc20-mainnet', 1, 6, 'USDT', 'Tether USD', 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', 'trc20', 'api')
ON CONFLICT (id) DO UPDATE SET
    symbol = EXCLUDED.symbol,
    name = EXCLUDED.name,
    contract = EXCLUDED.contract;

-- Insert USDC TRC20 token for mainnet
INSERT INTO tokens (id, external_id, network_id, decimals, symbol, name, contract, standard, mechanism)
VALUES (4, 'usdc-trc20-mainnet', 1, 6, 'USDC', 'USD Coin', 'TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8', 'trc20', 'api')
ON CONFLICT (id) DO UPDATE SET
    symbol = EXCLUDED.symbol,
    name = EXCLUDED.name,
    contract = EXCLUDED.contract;

-- Insert JST TRC20 token for mainnet
INSERT INTO tokens (id, external_id, network_id, decimals, symbol, name, contract, standard, mechanism)
VALUES (5, 'jst-trc20-mainnet', 1, 18, 'JST', 'JUST', 'TCFLL5dx5ZJdKnWuesXxi1VPwjLVmWZZy9', 'trc20', 'api')
ON CONFLICT (id) DO UPDATE SET
    symbol = EXCLUDED.symbol,
    name = EXCLUDED.name,
    contract = EXCLUDED.contract;

-- Reset sequence for tokens table
SELECT setval('tokens_id_seq', (SELECT MAX(id) FROM tokens));
