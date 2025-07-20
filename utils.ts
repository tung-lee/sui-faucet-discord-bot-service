export function isValidSuiAddress(address: string): boolean {
  // Sui addresses are 32 bytes (64 hex characters) and start with '0x'
  const suiAddressRegex = /^0x[a-fA-F0-9]{64}$/;
  return suiAddressRegex.test(address);
}