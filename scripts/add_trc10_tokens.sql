-- Добавляем популярные TRC10 токены для mainnet

-- BTT (BitTorrent Token) - TRC10
INSERT INTO tokens (external_id, network_id, decimals, token_key, symbol, name, standard, mechanism)
VALUES ('btt-trc10-mainnet', 1, 6, '1002000', 'BTT', 'BitTorrent', 'trc10', 'api')
ON CONFLICT (external_id) DO UPDATE SET
    symbol = EXCLUDED.symbol,
    name = EXCLUDED.name,
    token_key = EXCLUDED.token_key;

-- WIN (WINk) - TRC10  
INSERT INTO tokens (external_id, network_id, decimals, token_key, symbol, name, standard, mechanism)
VALUES ('win-trc10-mainnet', 1, 6, '1000001', 'WIN', 'WINk', 'trc10', 'api')
ON CONFLICT (external_id) DO UPDATE SET
    symbol = EXCLUDED.symbol,
    name = EXCLUDED.name,
    token_key = EXCLUDED.token_key;

-- SEED (Sesameseed) - TRC10
INSERT INTO tokens (external_id, network_id, decimals, token_key, symbol, name, standard, mechanism)
VALUES ('seed-trc10-mainnet', 1, 6, '1000016', 'SEED', 'Sesameseed', 'trc10', 'api')
ON CONFLICT (external_id) DO UPDATE SET
    symbol = EXCLUDED.symbol,
    name = EXCLUDED.name,
    token_key = EXCLUDED.token_key;

-- Добавляем TRC10 токены для Nile testnet (если нужно)
-- Обычно в тестнете используются тестовые токены с другими ID

-- Пример тестового TRC10 токена для Nile
INSERT INTO tokens (external_id, network_id, decimals, token_key, symbol, name, standard, mechanism)
VALUES ('test-trc10-nile', 2, 6, '1000001', 'TEST', 'Test Token', 'trc10', 'api')
ON CONFLICT (external_id) DO UPDATE SET
    symbol = EXCLUDED.symbol,
    name = EXCLUDED.name,
    token_key = EXCLUDED.token_key;
