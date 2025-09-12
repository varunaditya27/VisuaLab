declare module 'iptc-reader' {
  function iptcReader(buf: Buffer): Record<string, unknown>
  export = iptcReader
}
