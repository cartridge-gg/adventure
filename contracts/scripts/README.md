# Deployment Scripts

This directory contains automated deployment scripts for the Ronin Quest Dojo project.

**For complete deployment documentation**, see the [Deployment section in the main README](../README.md#deployment).

## Script Architecture

The deployment system uses a **unified approach** for maintainability:

- **`deploy_network.sh`** - Unified deployment logic for Sepolia and Mainnet (single source of truth)
- **`deploy_katana.sh`** - Standalone local development script with Katana

Scarb.toml provides convenient aliases:
- `scarb run deploy_katana` → `./scripts/deploy_katana.sh`
- `scarb run deploy_sepolia` → `./scripts/deploy_network.sh sepolia`
- `scarb run deploy_mainnet` → `./scripts/deploy_network.sh mainnet`

This architecture provides:
- ✓ **DRY**: Shared logic maintained in one place
- ✓ **Simple**: Fewer files to maintain
- ✓ **Clear**: Explicit Scarb commands show intent
- ✓ **Flexible**: Easy to add new networks

## Available Scripts

### `deploy_katana.sh` - Local Development
Deploys to local Katana testnet with hot-reload for development.

```bash
# Using Scarb alias (recommended)
scarb run deploy_katana

# Direct call
./scripts/deploy_katana.sh
```

**Configuration:**
- Uses `dojo_dev.toml` and `katana.toml`
- Time lock: 60 seconds (for quick testing)
- Starts Katana automatically
- Stays running until Ctrl+C

### `deploy_network.sh sepolia` - Testnet Deployment
Deploys to Starknet Sepolia testnet.

```bash
# Ensure keystore_path is set in dojo_sepolia.toml, then:
scarb run deploy_sepolia

# Or direct call
./scripts/deploy_network.sh sepolia
```

**Prerequisites:**
- Create Starkli keystore and account (see [README.md](../README.md#account-setup-sepoliamainnet))
- Fund your account with Sepolia ETH
- Configure `keystore_path` in `dojo_sepolia.toml`

**Configuration:**
- Uses `dojo_sepolia.toml`
- Keystore path: Read from `dojo_sepolia.toml`
- Time lock: 3600 seconds (1 hour)
- RPC: Cartridge Sepolia endpoint

### `deploy_network.sh mainnet` - Production Deployment
Deploys to Starknet Mainnet with safety confirmations.

```bash
# Ensure keystore_path is set in dojo_mainnet.toml, then:
scarb run deploy_mainnet

# Or direct call
./scripts/deploy_network.sh mainnet
```

**Prerequisites:**
- Create Starkli keystore and account (see [README.md](../README.md#account-setup-sepoliamainnet))
- Fund your account with Mainnet ETH
- Configure `keystore_path` in `dojo_mainnet.toml`
- Test thoroughly on Sepolia first!

**Configuration:**
- Uses `dojo_mainnet.toml`
- Keystore path: Read from `dojo_mainnet.toml`
- Time lock: 86400 seconds (24 hours)
- RPC: Cartridge Mainnet endpoint
- Requires explicit "yes" confirmation

## What Each Script Does

All deployment scripts perform these steps:

1. **Build**: Compile Cairo contracts with appropriate profile
2. **Migrate**: Deploy World and all contracts to the network
3. **Extract Addresses**: Parse manifest for contract addresses
4. **Update Config**: Write world address to appropriate `.toml` file
5. **Configure Permissions**: Grant owner role to deployer account
6. **Setup NFT Minter**: Set Actions contract as NFT minter
7. **Configure Actions**: Set NFT address and time lock in Actions contract
8. **Whitelist Games**: Configure Waza trial with whitelisted contracts
9. **Setup Quiz**: Configure Chi trial with quiz answer hashes
10. **Mint Initial NFT**: Create deployer's NFT to verify setup

## Authentication Setup

This project uses **Starkli keystores** for secure authentication. No plaintext private keys needed!

### Create Keystores

```bash
# For Sepolia
starkli signer keystore new ~/.starkli-wallets/deployer-sepolia.json

# For Mainnet
starkli signer keystore new ~/.starkli-wallets/deployer-mainnet.json
```

### Initialize Accounts

```bash
# For Sepolia
starkli account oz init \
  --keystore ~/.starkli-wallets/deployer-sepolia.json \
  --rpc https://api.cartridge.gg/x/starknet/sepolia \
  ~/.starkli-wallets/deployer-sepolia-account.json

# For Mainnet
starkli account oz init \
  --keystore ~/.starkli-wallets/deployer-mainnet.json \
  --rpc https://api.cartridge.gg/x/starknet/mainnet \
  ~/.starkli-wallets/deployer-mainnet-account.json
```

See the [Account Setup section in README.md](../README.md#account-setup-sepoliamainnet) for complete setup instructions including funding and account deployment.

## Time Lock Values

Different networks use different time locks between trials:

- **Local (Katana)**: 60 seconds - Fast iteration for development
- **Sepolia**: 3600 seconds (1 hour) - Reasonable for testing
- **Mainnet**: 86400 seconds (24 hours) - Production rate limiting

## Script Output

Each script outputs:
- Contract addresses (World, NFT, Actions)
- Configuration status (permissions, minter, quiz, etc.)
- Links to block explorers
- Manifest file locations

## Troubleshooting

### "Network argument required" or "Invalid network"
Make sure you're calling the script correctly:
```bash
# Using Scarb aliases (recommended)
scarb run deploy_sepolia
scarb run deploy_mainnet

# Direct calls
./scripts/deploy_network.sh sepolia
./scripts/deploy_network.sh mainnet
```

### "Tool not found"
Install required tools:
```bash
# Dojo toolchain
curl -L https://install.dojoengine.org | bash

# Starkli
curl https://get.starkli.sh | sh
starkliup
```

### "keystore_path not found in config"
Set your keystore path in the appropriate TOML file:
```toml
# In dojo_sepolia.toml or dojo_mainnet.toml
[env]
keystore_path = "~/.starkli-wallets/deployer-sepolia-account.json"
```

### "Account not funded"
Get testnet ETH from a faucet or ensure mainnet account has ETH.

### "Migration failed"
- Check RPC endpoint is accessible
- Verify keystore file exists and password is correct
- Ensure account is deployed on the target network
- Check account has sufficient ETH for gas

### "Could not extract account address from keystore"
Verify your keystore file is a valid Starkli account descriptor (not just a signer keystore). You need the `-account.json` file, not just the keystore file.

### Updating Deployment Logic
Since all deployment logic lives in `deploy_network.sh`, you only need to update one file. The Scarb aliases automatically use the updated script.

## Security Notes

- **Never commit** keystore files or passwords
- **Encrypted keystores**: Private keys never stored in plaintext
- **Separate accounts**: Use different keystores for testnet and mainnet
- **Strong passwords**: Use unique, strong passwords for each keystore
- **Backup securely**: Keep encrypted backups of keystores off-machine
- **Test thoroughly**: Always test on Sepolia before mainnet deployment
- **Hardware wallets**: Consider hardware wallet integration for production

## Next Steps After Deployment

1. **Verify Contracts**: Check on Starkscan
2. **Configure Client**: Update client with contract addresses
3. **Setup Indexer**: Configure Torii for the deployed world
4. **Test Integration**: Verify all functionality works end-to-end
5. **Announce**: Let your users know about the deployment

## Support

For issues or questions:
- Check [README.md Troubleshooting](../README.md#troubleshooting) for common deployment issues
- Review [README.md Deployment](../README.md#deployment) for detailed deployment guide
- Review Dojo docs: https://book.dojoengine.org
- Check contract configuration in `../dojo_*.toml` files
