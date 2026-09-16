# ARGUS Key Management

ARGUS uses Ed25519 keys for cryptographically signing evidence bundles. Generating keys, signing bundles, and verifying signatures can be done through the ARGUS CLI.

## Generating Keys

To generate a new Ed25519 keypair, run:
\\\ash
argus keygen <prefix>
\\\`nThis creates <prefix>_pub.pem and <prefix>_priv.pem.

## Signing Bundles

To sign a bundle, run:
\\\ash
argus sign <bundle> <private-key.pem>
\\\`nThis calculates the SHA-256 hash of the bundle and signs it with the Ed25519 private key.

## Verifying Signatures

To verify a signed bundle, run:
\\\ash
argus verify <bundle> <public-key.pem>
\\\`nThis verifies the cryptographic signature of the bundle.
